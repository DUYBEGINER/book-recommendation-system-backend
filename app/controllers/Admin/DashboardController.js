/**
 * Admin Dashboard Controller
 */
import { ApiResponse, logger } from "#utils/index.js";
import { dashboardService } from "#services/dashboardService.js";

/**
 * GET /admin/dashboard - Get dashboard statistics
 */
export const getDashboard = async (req, res) => {
  try {
    const { 
      topRatedPage = 0, 
      topRatedSize = 5, 
      topFavoritedPage = 0, 
      topFavoritedSize = 5 
    } = req.query;
    
    const dashboard = await dashboardService.getDashboardStats(
      parseInt(topRatedPage),
      parseInt(topRatedSize),
      parseInt(topFavoritedPage),
      parseInt(topFavoritedSize)
    );
    
    return ApiResponse.success(res, dashboard, 'Dashboard fetched successfully');
  } catch (error) {
    logger.error('Get dashboard error:', error);
    return ApiResponse.error(res, 'Failed to fetch dashboard', 500);
  }
};
