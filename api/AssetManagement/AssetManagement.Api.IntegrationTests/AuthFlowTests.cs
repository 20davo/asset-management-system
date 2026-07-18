using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AssetManagement.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AssetManagement.Api.IntegrationTests;

[Collection("Integration")]
public class AuthFlowTests
{
    private readonly IntegrationTestFixture _fixture;

    public AuthFlowTests(IntegrationTestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Register_WhenTwoRequestsRaceForTheSameEmail_ExactlyOneSucceeds()
    {
        const string email = "register.race@integration.test";
        using var firstClient = _fixture.Factory.CreateClient();
        using var secondClient = _fixture.Factory.CreateClient();

        var responses = await Task.WhenAll(
            firstClient.PostAsJsonAsync(
                "/api/auth/register",
                new { name = "Register Race One", email, password = "Password123!" }),
            secondClient.PostAsJsonAsync(
                "/api/auth/register",
                new { name = "Register Race Two", email, password = "Password123!" }));

        Assert.Equal(1, responses.Count(response => response.StatusCode == HttpStatusCode.OK));
        Assert.Equal(1, responses.Count(response => response.StatusCode == HttpStatusCode.BadRequest));

        using var scope = _fixture.Factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userCount = await dbContext.Users.CountAsync(user => user.Email == email);

        Assert.Equal(1, userCount);
    }

    [Fact]
    public async Task ChangePassword_InvalidatesOldTokenAndReturnsWorkingFreshToken()
    {
        const string email = "token.rotation@integration.test";
        const string originalPassword = "Password123!";
        const string newPassword = "NewPassword123!";

        await _fixture.RegisterAsync("Token Rotation User", email, originalPassword);

        var oldToken = await _fixture.LoginAsync(email, originalPassword);
        using var client = _fixture.Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", oldToken);

        var beforeChange = await client.GetAsync("/api/equipment");
        Assert.Equal(HttpStatusCode.OK, beforeChange.StatusCode);

        var changeResponse = await client.PostAsJsonAsync(
            "/api/auth/change-password",
            new
            {
                currentPassword = originalPassword,
                newPassword,
                confirmNewPassword = newPassword
            });
        Assert.Equal(HttpStatusCode.OK, changeResponse.StatusCode);

        using var changeJson = JsonDocument.Parse(await changeResponse.Content.ReadAsStringAsync());
        var freshToken = changeJson.RootElement.GetProperty("token").GetString();
        Assert.False(string.IsNullOrWhiteSpace(freshToken));

        var withOldToken = await client.GetAsync("/api/equipment");
        Assert.Equal(HttpStatusCode.Unauthorized, withOldToken.StatusCode);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", freshToken);
        var withFreshToken = await client.GetAsync("/api/equipment");
        Assert.Equal(HttpStatusCode.OK, withFreshToken.StatusCode);
    }
}
