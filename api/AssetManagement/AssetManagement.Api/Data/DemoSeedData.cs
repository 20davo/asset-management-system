namespace AssetManagement.Api.Data
{
    public class DemoAccount
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public record DemoEquipment(string Name, string Category, string SerialNumber, string ImageFileName);

    public record DemoExtraUser(string Name, string Email);

    public record DemoCheckout(
        string SerialNumber,
        string Borrower,
        int CheckedOutDaysAgo,
        int DueInDays,
        int? ReturnedDaysAgo = null);

    public static class DemoSeedData
    {
        public const string DemoUser = "demo-user";

        public static readonly DemoEquipment[] Equipment =
        [
            new("Redmi", "Phone", "001", "redmi.webp"),
            new("Lenovo", "Laptop", "002", "lenovo.webp"),
            new("Iphone", "Phone", "0010", "iphone.webp"),
            new("LG", "Monitor", "0015", "lg.webp"),
            new("GXT", "Mouse", "0020", "gxt.webp"),
            new("Dell", "Monitor", "0021", "dell.webp"),
            new("Acer", "Monitor", "0011", "acer.webp"),
            new("ASUS", "Monitor", "0029", "asus.webp"),
            new("Poco", "Phone", "0042", "poco.webp"),
            new("HP", "Laptop", "0031", "hp.webp"),
            new("Logitech", "Mouse", "0023", "logitech_mouse.webp"),
            new("Razer", "Mouse", "0025", "razer.webp"),
            new("Logitech", "Keyboard", "0040", "logitech.webp"),
            new("Corsair", "Keyboard", "0032", "corsair.webp"),
            new("Ducky", "Keyboard", "0017", "ducky.webp"),
            new("Asus", "Laptop", "005", "asus_laptop.webp")
        ];

        public static readonly DemoExtraUser[] ExtraUsers =
        [
            new("Teszt Elek", "telek@demo.example"),
            new("Szép Anna", "szani@demo.example")
        ];

        public static readonly string[] MaintenanceSerialNumbers = ["0023", "0029", "0017"];

        public static readonly DemoCheckout[] Checkouts =
        [
            new("001", DemoUser, CheckedOutDaysAgo: 3, DueInDays: 4),
            new("0011", DemoUser, CheckedOutDaysAgo: 9, DueInDays: -2),
            new("0020", "telek@demo.example", CheckedOutDaysAgo: 2, DueInDays: 5),
            new("0032", "telek@demo.example", CheckedOutDaysAgo: 6, DueInDays: 8),
            new("0031", "szani@demo.example", CheckedOutDaysAgo: 4, DueInDays: 10),
            new("0010", "szani@demo.example", CheckedOutDaysAgo: 8, DueInDays: -1),
            new("0040", "szani@demo.example", CheckedOutDaysAgo: 1, DueInDays: 6),

            new("0015", "telek@demo.example", CheckedOutDaysAgo: 20, DueInDays: -13, ReturnedDaysAgo: 14),
            new("0021", DemoUser, CheckedOutDaysAgo: 15, DueInDays: -8, ReturnedDaysAgo: 9),
            new("002", "szani@demo.example", CheckedOutDaysAgo: 12, DueInDays: -5, ReturnedDaysAgo: 6),
            new("0042", DemoUser, CheckedOutDaysAgo: 10, DueInDays: -3, ReturnedDaysAgo: 2),
            new("0025", "telek@demo.example", CheckedOutDaysAgo: 7, DueInDays: -4, ReturnedDaysAgo: 4),
            new("005", "szani@demo.example", CheckedOutDaysAgo: 5, DueInDays: -1, ReturnedDaysAgo: 1)
        ];
    }
}
