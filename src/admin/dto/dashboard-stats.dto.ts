export class DashboardStatsDto {
  totalUsers: number;
  newUsers: number;
  totalProducts: number;
  newProducts: number;
  activeAuctions: number;
  endedAuctions: number;
  totalRevenue: number;
  pendingSellerRequests: number;
  approvedSellerRequests: number;
  
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  
  productGrowth: Array<{
    date: string;
    count: number;
  }>;
  
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  
  categoryDistribution: Array<{
    name: string;
    count: number;
  }>;
}
