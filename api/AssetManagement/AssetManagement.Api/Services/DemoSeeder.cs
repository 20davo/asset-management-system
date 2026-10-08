using System.Globalization;
using AssetManagement.Api.Constants;
using AssetManagement.Api.Data;
using AssetManagement.Api.Models;

namespace AssetManagement.Api.Services
{
    public interface IDemoSeeder
    {
        void ResetIfDue();
    }

    public class DemoSeeder : IDemoSeeder
    {
        private const string StateFileName = "last-reset.txt";

        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEquipmentImageService _imageService;
        private readonly IWebHostEnvironment _environment;

        public DemoSeeder(
            AppDbContext context,
            IConfiguration configuration,
            IEquipmentImageService imageService,
            IWebHostEnvironment environment)
        {
            _context = context;
            _configuration = configuration;
            _imageService = imageService;
            _environment = environment;
        }

        public void ResetIfDue()
        {
            if (!_configuration.GetValue<bool>("Demo:Enabled"))
            {
                return;
            }

            var stateFilePath = GetStateFilePath();

            if (!IsResetDue(stateFilePath))
            {
                return;
            }

            ResetDatabase();
            ResetImages();

            File.WriteAllText(stateFilePath, DateTime.UtcNow.ToString("O", CultureInfo.InvariantCulture));
        }

        private bool IsResetDue(string stateFilePath)
        {
            if (!File.Exists(stateFilePath))
            {
                return true;
            }

            var resetInterval = TimeSpan.FromHours(_configuration.GetValue("Demo:ResetIntervalHours", 24));
            var isValidTime = DateTime.TryParse(
                File.ReadAllText(stateFilePath),
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out var lastReset);

            return !isValidTime || DateTime.UtcNow - lastReset >= resetInterval;
        }

        private void ResetDatabase()
        {
            var accounts = _configuration.GetSection("Demo:Accounts").Get<DemoAccount[]>() ?? [];
            var now = DateTime.UtcNow;

            using var transaction = _context.Database.BeginTransaction();

            // Plain DELETE on purpose: restarting the ID sequences would let an old JWT match a new user.
            _context.Checkouts.RemoveRange(_context.Checkouts);
            _context.Equipments.RemoveRange(_context.Equipments);
            _context.Users.RemoveRange(_context.Users);
            _context.SaveChanges();

            var accountUsers = accounts
                .Select(account => CreateUser(account.Name, account.Email, account.Password, account.Role))
                .ToList();
            var demoAdmin = accountUsers.FirstOrDefault(user => user.Role == UserRoles.Admin);
            var demoUser = accountUsers.FirstOrDefault(user => user.Role == UserRoles.User);

            if (demoAdmin == null || demoUser == null)
            {
                throw new InvalidOperationException(
                    "Demo:Accounts must contain at least one Admin and one User account.");
            }

            var borrowers = DemoSeedData.ExtraUsers.ToDictionary(
                extraUser => extraUser.Email,
                extraUser => CreateUser(extraUser.Name, extraUser.Email, Guid.NewGuid().ToString(), UserRoles.User));
            borrowers[DemoSeedData.DemoUser] = demoUser;

            var equipments = DemoSeedData.Equipment.ToDictionary(
                item => item.SerialNumber,
                item => new Equipment
                {
                    Name = item.Name,
                    Category = item.Category,
                    SerialNumber = item.SerialNumber,
                    ImageUrl = $"/uploads/equipment/{item.ImageFileName}",
                    Status = EquipmentStatus.Available,
                    CreatedAt = now.AddDays(-30)
                });

            foreach (var serialNumber in DemoSeedData.MaintenanceSerialNumbers)
            {
                equipments[serialNumber].Status = EquipmentStatus.Maintenance;
                equipments[serialNumber].MaintenanceByUser = demoAdmin;
            }

            var checkouts = DemoSeedData.Checkouts
                .Select(item => new Checkout
                {
                    Equipment = equipments[item.SerialNumber],
                    User = borrowers[item.Borrower],
                    CheckedOutAt = now.AddDays(-item.CheckedOutDaysAgo),
                    DueAt = now.AddDays(item.DueInDays),
                    ReturnedAt = item.ReturnedDaysAgo.HasValue ? now.AddDays(-item.ReturnedDaysAgo.Value) : null
                })
                .ToList();

            foreach (var checkout in checkouts.Where(checkout => checkout.ReturnedAt == null))
            {
                checkout.Equipment!.Status = EquipmentStatus.CheckedOut;
            }

            _context.Users.AddRange(accountUsers);
            _context.Users.AddRange(borrowers.Values.Except(accountUsers));
            _context.Equipments.AddRange(equipments.Values);
            _context.Checkouts.AddRange(checkouts);
            _context.SaveChanges();

            transaction.Commit();
        }

        private void ResetImages()
        {
            var uploadDirectory = _imageService.GetEquipmentUploadDirectory();
            var seedImageDirectory = Path.Combine(AppContext.BaseDirectory, "SeedData", "equipment");

            Directory.CreateDirectory(uploadDirectory);

            foreach (var filePath in Directory.GetFiles(uploadDirectory))
            {
                File.Delete(filePath);
            }

            foreach (var item in DemoSeedData.Equipment)
            {
                File.Copy(
                    Path.Combine(seedImageDirectory, item.ImageFileName),
                    Path.Combine(uploadDirectory, item.ImageFileName),
                    overwrite: true);
            }
        }

        private string GetStateFilePath()
        {
            var statePath = _configuration["Demo:StatePath"];

            if (string.IsNullOrWhiteSpace(statePath))
            {
                statePath = Path.Combine(_environment.ContentRootPath, "demo-state");
            }

            Directory.CreateDirectory(statePath);

            return Path.Combine(statePath, StateFileName);
        }

        private static User CreateUser(string name, string email, string password, string role)
        {
            return new User
            {
                Name = name.Trim(),
                Email = email.Trim().ToLowerInvariant(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Role = role
            };
        }
    }
}
