using AssetManagement.Api.Extensions;
using Microsoft.Extensions.DependencyInjection;

namespace AssetManagement.Api.Tests;

public class AuthenticationExtensionsTests
{
    [Fact]
    public void AddAppAuthentication_WithoutKey_Throws()
    {
        var configuration = TestSupport.CreateConfiguration();

        Assert.Throws<InvalidOperationException>(
            () => new ServiceCollection().AddAppAuthentication(configuration));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("replace-with-a-long-random-secret-key")]
    [InlineData("change-this-to-a-real-random-secret")]
    public void AddAppAuthentication_WithEmptyOrPlaceholderKey_Throws(string jwtKey)
    {
        var configuration = TestSupport.CreateConfiguration(
            new KeyValuePair<string, string?>("Jwt:Key", jwtKey));

        Assert.Throws<InvalidOperationException>(
            () => new ServiceCollection().AddAppAuthentication(configuration));
    }

    [Fact]
    public void AddAppAuthentication_WithKeyShorterThan32Bytes_Throws()
    {
        var configuration = TestSupport.CreateConfiguration(
            new KeyValuePair<string, string?>("Jwt:Key", new string('k', 31)));

        var exception = Assert.Throws<InvalidOperationException>(
            () => new ServiceCollection().AddAppAuthentication(configuration));

        Assert.Contains("32 bytes", exception.Message);
    }

    [Fact]
    public void AddAppAuthentication_WithKeyOf32Bytes_DoesNotThrow()
    {
        var configuration = TestSupport.CreateConfiguration(
            new KeyValuePair<string, string?>("Jwt:Key", new string('k', 32)));

        var exception = Record.Exception(
            () => new ServiceCollection().AddAppAuthentication(configuration));

        Assert.Null(exception);
    }
}
