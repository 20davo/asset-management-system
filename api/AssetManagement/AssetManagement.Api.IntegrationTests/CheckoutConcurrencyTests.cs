using System.Net;
using System.Net.Http.Json;
using AssetManagement.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AssetManagement.Api.IntegrationTests;

[Collection("Integration")]
public class CheckoutConcurrencyTests
{
    private readonly IntegrationTestFixture _fixture;

    public CheckoutConcurrencyTests(IntegrationTestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Checkout_WhenTwoUsersRaceForTheSameAsset_ExactlyOneSucceeds()
    {
        using var adminClient = await _fixture.CreateClientAsync(
            IntegrationTestFixture.AdminEmail,
            IntegrationTestFixture.AdminPassword);
        var equipmentId = await _fixture.CreateEquipmentAsync(
            adminClient,
            "Race Laptop",
            $"RACE-{Guid.NewGuid():N}");

        await _fixture.RegisterAsync("Race User One", "race.one@integration.test", "Password123!");
        await _fixture.RegisterAsync("Race User Two", "race.two@integration.test", "Password123!");

        using var firstClient = await _fixture.CreateClientAsync("race.one@integration.test", "Password123!");
        using var secondClient = await _fixture.CreateClientAsync("race.two@integration.test", "Password123!");

        var payload = new { dueAt = DateTime.UtcNow.AddDays(7) };

        var responses = await Task.WhenAll(
            firstClient.PostAsJsonAsync($"/api/equipment/{equipmentId}/checkout", payload),
            secondClient.PostAsJsonAsync($"/api/equipment/{equipmentId}/checkout", payload));

        Assert.Equal(1, responses.Count(response => response.StatusCode == HttpStatusCode.OK));
        Assert.Equal(1, responses.Count(response => response.StatusCode == HttpStatusCode.BadRequest));

        using var scope = _fixture.Factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var activeCheckoutCount = await dbContext.Checkouts
            .CountAsync(checkout => checkout.EquipmentId == equipmentId && checkout.ReturnedAt == null);

        Assert.Equal(1, activeCheckoutCount);
    }
}
