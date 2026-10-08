using AssetManagement.Api.Services;

namespace AssetManagement.Api.Tests;

public class EquipmentImageServiceTests
{
    [Fact]
    public void GetImageFilePath_WithoutConfiguredUploadsPath_UsesWebRootUploads()
    {
        var environment = new TestWebHostEnvironment();
        var imageService = new EquipmentImageService(environment, TestSupport.CreateConfiguration());

        var filePath = imageService.GetImageFilePath("image.png");

        Assert.Equal(Path.Combine(environment.WebRootPath, "uploads", "equipment", "image.png"), filePath);
    }
}
