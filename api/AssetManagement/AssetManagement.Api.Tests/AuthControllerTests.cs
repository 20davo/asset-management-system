using AssetManagement.Api.Controllers;
using AssetManagement.Api.Dtos;
using AssetManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Api.Tests;

public class AuthControllerTests
{
    [Fact]
    public async Task Register_WhenRegistrationIsDisabled_ReturnsForbidden()
    {
        await using var context = TestSupport.CreateDbContext();
        var configuration = TestSupport.CreateConfiguration(
            new KeyValuePair<string, string?>("Registration:Enabled", "false"));
        var controller = TestSupport.CreateAuthController(context, configuration);

        var result = await controller.Register(new RegisterDto
        {
            Name = "Test User",
            Email = "test.user@example.com",
            Password = "Password123!"
        });

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, objectResult.StatusCode);
        Assert.Empty(await context.Users.ToListAsync());
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsBadRequest()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(new User
        {
            Name = "Existing User",
            Email = "duplicate@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!")
        });
        await context.SaveChangesAsync();

        var configuration = TestSupport.CreateConfiguration(
            new KeyValuePair<string, string?>("Registration:Enabled", "true"));
        var controller = TestSupport.CreateAuthController(context, configuration);

        var result = await controller.Register(new RegisterDto
        {
            Name = "New User",
            Email = "DUPLICATE@example.com",
            Password = "Password123!"
        });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Single(await context.Users.ToListAsync());
    }

    [Fact]
    public async Task ChangePassword_WithValidRequest_BumpsTokenVersionAndReturnsFreshToken()
    {
        await using var context = TestSupport.CreateDbContext();
        context.Users.Add(new User
        {
            Id = 1,
            Name = "Test User",
            Email = "test.user@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OldPassword123!"),
            Role = Constants.UserRoles.User
        });
        await context.SaveChangesAsync();

        var configuration = TestSupport.CreateConfiguration(
            new KeyValuePair<string, string?>("Jwt:Key", "unit-test-signing-key-with-enough-length-123456"),
            new KeyValuePair<string, string?>("Jwt:Issuer", "AssetManagement.Api"),
            new KeyValuePair<string, string?>("Jwt:Audience", "AssetManagement.Client"));
        var controller = TestSupport.CreateAuthController(context, configuration);
        TestSupport.SignIn(controller, 1, Constants.UserRoles.User);

        var result = await controller.ChangePassword(new ChangePasswordDto
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword123!",
            ConfirmNewPassword = "NewPassword123!"
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        var payload = Assert.IsType<Dictionary<string, object?>>(okResult.Value);
        var freshToken = Assert.IsType<string>(payload["token"]);
        Assert.NotEmpty(freshToken);

        var user = await context.Users.SingleAsync();
        Assert.Equal(1, user.TokenVersion);
        Assert.True(BCrypt.Net.BCrypt.Verify("NewPassword123!", user.PasswordHash));
    }
}
