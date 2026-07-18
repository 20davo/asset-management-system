using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace AssetManagement.Api.Data
{
    public static class DatabaseErrors
    {
        public static bool IsUniqueViolation(DbUpdateException exception)
        {
            return exception.InnerException is PostgresException postgresException
                && postgresException.SqlState == PostgresErrorCodes.UniqueViolation;
        }
    }
}
