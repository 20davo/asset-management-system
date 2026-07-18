using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Testcontainers.PostgreSql;

namespace AssetManagement.Api.IntegrationTests;

public sealed class IntegrationTestFixture : IAsyncLifetime
{
    public const string AdminEmail = "admin@integration.test";
    public const string AdminPassword = "AdminPassword123!";

    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .Build();

    public WebApplicationFactory<Program> Factory { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();

        Factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.UseSetting("ConnectionStrings:DefaultConnection", _dbContainer.GetConnectionString());
            builder.UseSetting("Jwt:Key", "integration-test-signing-key-1234567890-abcdef");
            builder.UseSetting("Registration:Enabled", "true");
            builder.UseSetting("BootstrapAdmin:Enabled", "true");
            builder.UseSetting("BootstrapAdmin:Name", "Integration Admin");
            builder.UseSetting("BootstrapAdmin:Email", AdminEmail);
            builder.UseSetting("BootstrapAdmin:Password", AdminPassword);
            builder.UseSetting("RateLimiting:AuthEnabled", "false");
            builder.UseSetting(
                "DataProtection:KeysPath",
                Path.Combine(Path.GetTempPath(), "ams-integration-tests", "dp-keys"));
        });

        _ = Factory.Server;
    }

    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync();
        await _dbContainer.DisposeAsync();
    }

    public async Task RegisterAsync(string name, string email, string password)
    {
        using var client = Factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new { name, email, password });

        response.EnsureSuccessStatusCode();
    }

    public async Task<string> LoginAsync(string email, string password)
    {
        using var client = Factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });

        response.EnsureSuccessStatusCode();

        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        return json.RootElement.GetProperty("token").GetString()!;
    }

    public async Task<HttpClient> CreateClientAsync(string email, string password)
    {
        var client = Factory.CreateClient();
        var token = await LoginAsync(email, password);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        return client;
    }

    public async Task<int> CreateEquipmentAsync(HttpClient adminClient, string name, string serialNumber)
    {
        using var form = new MultipartFormDataContent
        {
            { new StringContent(name), "name" },
            { new StringContent("Integration"), "category" },
            { new StringContent(serialNumber), "serialNumber" }
        };

        var response = await adminClient.PostAsync("/api/equipment", form);

        response.EnsureSuccessStatusCode();

        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        return json.RootElement.GetProperty("data").GetProperty("id").GetInt32();
    }
}

[CollectionDefinition("Integration")]
public sealed class IntegrationCollection : ICollectionFixture<IntegrationTestFixture>
{
}
