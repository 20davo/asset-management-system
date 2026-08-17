using System.Text;
using AssetManagement.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AssetManagement.Api.Extensions
{
    public static class AuthenticationExtensions
    {
        private const string JwtPlaceholderValue = "replace-with-a-long-random-secret-key";

        public static IServiceCollection AddAppAuthentication(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var jwtKey = configuration["Jwt:Key"];
            var jwtIssuer = configuration["Jwt:Issuer"];
            var jwtAudience = configuration["Jwt:Audience"];

            if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey == JwtPlaceholderValue)
            {
                throw new InvalidOperationException(
                    "Jwt:Key must be configured with a real secret value before the application starts.");
            }

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!)),
                    ClockSkew = TimeSpan.Zero
                };
                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = async context =>
                    {
                        var userIdClaim = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                        var roleClaim = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                        var tokenVersionClaim = context.Principal?.FindFirst(Constants.CustomClaimTypes.TokenVersion)?.Value;

                        if (!int.TryParse(userIdClaim, out var userId)
                            || string.IsNullOrWhiteSpace(roleClaim)
                            || !int.TryParse(tokenVersionClaim, out var tokenVersion))
                        {
                            context.Fail("Invalid token claims.");
                            return;
                        }

                        var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                        var user = await dbContext.Users
                            .AsNoTracking()
                            .FirstOrDefaultAsync(candidate => candidate.Id == userId);

                        if (user == null || user.Role != roleClaim || user.TokenVersion != tokenVersion)
                        {
                            context.Fail("The token no longer matches the current user state.");
                        }
                    }
                };
            });

            return services;
        }
    }
}
