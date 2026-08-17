using System.Threading.RateLimiting;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;

namespace AssetManagement.Api.Extensions
{
    public static class SecurityExtensions
    {
        public static IServiceCollection AddAppDataProtection(
            this IServiceCollection services,
            IConfiguration configuration,
            IWebHostEnvironment environment)
        {
            var configuredKeysPath = configuration["DataProtection:KeysPath"];
            var keysPath = string.IsNullOrWhiteSpace(configuredKeysPath)
                ? Path.Combine(environment.ContentRootPath, "data-protection-keys")
                : configuredKeysPath;

            Directory.CreateDirectory(keysPath);

            services.AddDataProtection()
                .PersistKeysToFileSystem(new DirectoryInfo(keysPath));

            return services;
        }

        public static IServiceCollection AddAppCors(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var allowedOrigins = configuration
                .GetSection("Cors:AllowedOrigins")
                .Get<string[]>()?
                .Where(origin => !string.IsNullOrWhiteSpace(origin))
                .ToArray() ?? Array.Empty<string>();

            if (allowedOrigins.Length == 0)
            {
                throw new InvalidOperationException(
                    "At least one CORS origin must be configured in Cors:AllowedOrigins.");
            }

            services.AddCors(options =>
            {
                options.AddPolicy("FrontendPolicy", policy =>
                {
                    policy.WithOrigins(allowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            return services;
        }

        public static IServiceCollection AddAppRateLimiting(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var authRateLimitEnabled = configuration.GetValue<bool>("RateLimiting:AuthEnabled");
            var authRateLimitPermitLimit = configuration.GetValue("RateLimiting:AuthPermitLimit", 5);
            var authRateLimitWindowSeconds = configuration.GetValue("RateLimiting:AuthWindowSeconds", 60);

            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.OnRejected = async (context, cancellationToken) =>
                {
                    context.HttpContext.Response.ContentType = "application/json";

                    var isLoginRequest = context.HttpContext.Request.Path.StartsWithSegments("/api/auth/login");
                    var code = isLoginRequest
                        ? "rateLimit.login"
                        : "rateLimit.generic";
                    var message = isLoginRequest
                        ? "Too many sign-in attempts. Please try again later."
                        : "Too many requests. Please try again later.";

                    await context.HttpContext.Response.WriteAsJsonAsync(
                        new { code, message },
                        cancellationToken: cancellationToken);
                };

                options.AddPolicy("AuthPolicy", httpContext =>
                {
                    if (!authRateLimitEnabled)
                    {
                        return RateLimitPartition.GetNoLimiter("auth-policy-disabled");
                    }

                    var remoteIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    var path = httpContext.Request.Path.ToString().ToLowerInvariant();

                    return RateLimitPartition.GetFixedWindowLimiter(
                        $"{path}:{remoteIp}",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = authRateLimitPermitLimit,
                            Window = TimeSpan.FromSeconds(authRateLimitWindowSeconds),
                            QueueLimit = 0,
                            AutoReplenishment = true
                        });
                });
            });

            return services;
        }

        public static IServiceCollection AddAppForwardedHeaders(this IServiceCollection services)
        {
            services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders =
                    ForwardedHeaders.XForwardedFor
                    | ForwardedHeaders.XForwardedProto
                    | ForwardedHeaders.XForwardedHost;

                options.KnownIPNetworks.Clear();
                options.KnownProxies.Clear();
            });

            return services;
        }
    }
}
