using AssetManagement.Api.Data;

namespace AssetManagement.Api.Services
{
    public interface IDemoAccountPolicy
    {
        bool IsProtected(string email);
    }

    public class DemoAccountPolicy : IDemoAccountPolicy
    {
        private readonly bool _demoEnabled;
        private readonly HashSet<string> _protectedEmails;

        public DemoAccountPolicy(IConfiguration configuration)
        {
            _demoEnabled = configuration.GetValue<bool>("Demo:Enabled");
            _protectedEmails = (configuration.GetSection("Demo:Accounts").Get<DemoAccount[]>() ?? [])
                .Select(account => account.Email.Trim().ToLowerInvariant())
                .ToHashSet();
        }

        public bool IsProtected(string email)
        {
            return _demoEnabled && _protectedEmails.Contains(email.Trim().ToLowerInvariant());
        }
    }
}
