
import User from "../model/user.model.js";
import Activity from "../model/activity.model.js";
import { OrganizationModel } from "../model/organization.model.js";

class StatsController {
  static async getDashboardStats(req, res) {
    try {
      const [totalUsers, totalActivities, totalOrganizations] =
        await Promise.all([
          User.countDocuments({
            status: { $ne: "deleted" },
          }),
          Activity.countDocuments({
            status: { $ne: "deleted" },
          }),
          OrganizationModel.countDocuments({
            status: { $ne: "deleted" },
          }),
        ]);

      return res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalActivities,
          totalOrganizations,
          pendingReports: 0,
        },
      });
    } catch (error) {
      console.error("Dashboard statistics error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard statistics",
      });
    }
  }
}

export default StatsController;
