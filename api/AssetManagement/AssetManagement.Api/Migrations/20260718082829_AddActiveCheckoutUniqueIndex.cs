using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssetManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddActiveCheckoutUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_ActiveEquipment",
                table: "Checkouts",
                column: "EquipmentId",
                unique: true,
                filter: "\"ReturnedAt\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Checkouts_ActiveEquipment",
                table: "Checkouts");
        }
    }
}
