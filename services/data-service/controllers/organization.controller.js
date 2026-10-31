
import OrganizationService from "../services/organization.service.js";

class OrganizationCtrl {
  // Get organizations with filters and pagination.
  static async handleGetAllOrganizations(req, res) {
    try {
      const result =
        await OrganizationService.getAllOrganizations(req.query);

      return res.status(200).json({
        success: true,
        data: result.organizations,
        pagination: result.pagination,
        message: "Organization list fetched successfully",
      });
    } catch (error) {
      const isValidationError = [
        "Invalid organization status filter",
        "Invalid verification status filter",
        "Invalid search query",
        "Search query is too long",
        "Invalid pagination values",
      ].includes(error.message);

      return res.status(isValidationError ? 400 : 500).json({
        success: false,
        message: "Could not fetch organizations",
        error: error.message,
      });
    }
  }

  // Get organization statistics.
  static async handleGetOrganizationStats(req, res) {
    try {
      const result =
        await OrganizationService.getOrganizationStats();

      return res.status(200).json({
        success: true,
        data: result,
        message: "Organization statistics fetched successfully",
      });
    } catch (error) {
      console.error("Organization statistics error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not fetch organization statistics",
      });
    }
  }

  // Get one organization by ID.
  static async handleGetOrganizationById(req, res) {
    try {
      const { id } = req.params;

      const result =
        await OrganizationService.getOrganizationById(id);

      return res.status(200).json({
        success: true,
        data: result,
        message: "Organization fetched successfully",
      });
    } catch (error) {
      const isInvalidId =
        error.message === "Invalid organization ID";

      const isNotFound =
        error.message === "Organization not found";

      const statusCode = isInvalidId ? 400 : isNotFound ? 404 : 500;

      if (statusCode === 500) {
        console.error("Get organization error:", error);
      }

      return res.status(statusCode).json({
        success: false,
        message: isInvalidId
          ? "Invalid organization ID"
          : isNotFound
            ? "Organization not found"
            : "Could not fetch organization",
      });
    }
  }
}

export default OrganizationCtrl;
