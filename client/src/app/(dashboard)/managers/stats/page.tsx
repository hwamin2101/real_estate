"use client";

import React from "react";
import { useGetStatsQuery } from "@/state/api";
import Loading from "@/components/Loading";
import Header from "@/components/Header";
import {
  Building,
  Users,
  DollarSign,
  Calendar,
  RefreshCw,
  Eye,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type TransactionStatus = "Pending" | "Paid" | "PartiallyPaid" | "Overdue";
type PropertyStatus = "Occupied" | "Vacant";
type Priority = "Critical" | "High" | "Low";

type Transaction = {
  id: number;
  customer: string;
  email: string;
  phoneNumber: string;
  date: string;
  amount: number;
  status: TransactionStatus;
};

type PropertyPerformance = {
  id: number;
  name: string;
  address: string;
  occupancyRate: number;
  monthlyRevenue: number;
  status: PropertyStatus;
};

type GeographicDistribution = {
  city: string;
  propertyCount: number;
  percentage: string;
};

type LeaseExpiration = {
  id: number;
  tenant: string;
  property: string;
  expiryDate: string;
  daysRemaining: number;
  priority: Priority;
};

type StatsResponse = {
  totalProperties: number;
  rentedProperties: number;
  currentMonthRevenue: number;
  totalTenants: number;
  applicationsToday: number;
  occupancyRate: number;
  totalRevenue: number;
  monthlyRevenue: { month: string; income: number }[];
  recentTransactions: Transaction[];
  propertyPerformance: PropertyPerformance[];
  geographicDistribution: GeographicDistribution[];
  leaseExpirationAlerts: LeaseExpiration[];
};

// Utility functions
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);

const formatCompact = (amount: number): string => {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toString();
};

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("vi-VN");

const getPerformanceStatus = (occupancy: number, revenue: number) => {
  if (occupancy >= 80 && revenue >= 1500000)
    return { label: "Cao", status: "High" as const };
  if (occupancy >= 60 || revenue >= 1000000)
    return { label: "Trung bình", status: "Medium" as const };
  return { label: "Thấp", status: "Low" as const };
};

// Sub-components
const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  actionText?: string;
  actionIcon?: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, value, icon, iconBgColor, actionText, actionIcon, footer }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
          {title}
        </p>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </h3>
      </div>
      <div className={`p-3 ${iconBgColor} rounded-xl`}>{icon}</div>
    </div>
    <div className="flex items-center gap-2">
      {footer ? (
        footer
      ) : actionText ? (
        <button className="ml-auto text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1">
          {actionText}
          {actionIcon}
        </button>
      ) : null}
    </div>
  </div>
);

const OccupancyChart: React.FC<{
  rentedProperties: number;
  totalProperties: number;
  occupancyRate: number;
}> = ({ rentedProperties, totalProperties, occupancyRate }) => {
  const pieData = [
    { name: "Đã thuê", value: rentedProperties, color: "#8b5cf6" },
    {
      name: "Trống",
      value: totalProperties - rentedProperties,
      color: "#e0e7ff",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tỷ lệ lấp đầy
        </h3>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={450}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {occupancyRate.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Đã thanh toán
            </div>
          </div>
        </div>

        <div className="mt-6 w-full space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Đã thanh toán
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {rentedProperties}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-100 dark:bg-indigo-900"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Chưa thanh toán
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {totalProperties - rentedProperties}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RevenueChart: React.FC<{
  data: { month: string; income: number }[];
  totalRevenue: number;
}> = ({ data, totalRevenue }) => (
  <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Doanh thu 6 tháng gần đây
      </h3>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Tổng: {formatCurrency(totalRevenue)}
      </div>
    </div>

    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e5e7eb"
          opacity={0.2}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#9ca3af"
          tickFormatter={formatCompact}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#8b5cf6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorIncome)"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const PropertyPerformanceTable: React.FC<{
  data: PropertyPerformance[];
}> = ({ data }) => {
  if (data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Hiệu suất căn hộ
        </h3>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <Eye className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-y border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Tên căn hộ
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Địa chỉ
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Tỷ lệ lấp đầy
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Doanh thu tháng
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((property) => {
              const perfStatus = getPerformanceStatus(
                property.occupancyRate,
                property.monthlyRevenue
              );
              return (
                <tr
                  key={property.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {property.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {property.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {property.occupancyRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(property.monthlyRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        perfStatus.status === "High"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : perfStatus.status === "Medium"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {perfStatus.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const GeographicDistributionChart: React.FC<{
  data: GeographicDistribution[];
}> = ({ data }) => {
  if (data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Phân bố địa lý
        </h3>
      </div>

      <div className="space-y-4">
        {data.map((location, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                {location.city}
              </span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-md">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${location.percentage}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white ml-3">
              {location.propertyCount} căn ({location.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LeaseExpirationAlerts: React.FC<{
  data: LeaseExpiration[];
}> = ({ data }) => {
  if (data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Cảnh báo hết hạn hợp đồng
        </h3>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-500" />
          <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
            {data.length} hợp đồng sắp hết hạn
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((lease) => (
          <div
            key={lease.id}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              lease.priority === "Critical"
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : lease.priority === "High"
                ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-2 rounded-lg ${
                  lease.priority === "Critical"
                    ? "bg-red-100 dark:bg-red-900/30"
                    : lease.priority === "High"
                    ? "bg-orange-100 dark:bg-orange-900/30"
                    : "bg-yellow-100 dark:bg-yellow-900/30"
                }`}
              >
                <Users
                  className={`h-5 w-5 ${
                    lease.priority === "Critical"
                      ? "text-red-600 dark:text-red-400"
                      : lease.priority === "High"
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-yellow-600 dark:text-yellow-400"
                  }`}
                />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {lease.tenant}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lease.property}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {lease.daysRemaining} ngày còn lại
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hết hạn: {formatDate(lease.expiryDate)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TransactionsTable: React.FC<{
  transactions: Transaction[];
}> = ({ transactions }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Giao dịch thành công gần đây
        </h3>
        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
          {transactions.length} giao dịch
        </span>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700/50 border-y border-gray-200 dark:border-gray-700">
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              ID Giao dịch
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Khách hàng
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Số điện thoại
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Ngày
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Số tiền
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Trạng thái
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {transactions.slice(0, 8).map((t) => (
            <tr
              key={t.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                #{t.id.toString().padStart(6, "0")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                {t.customer}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {t.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {t.phoneNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {formatDate(t.date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(t.amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Đã thanh toán
                </span>
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
              >
                Chưa có giao dịch thành công nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// Main component
const StatsPage = () => {
  const { data: stats, isLoading, error, refetch } = useGetStatsQuery();

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Lỗi khi tải dữ liệu thống kê</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    );
  }

  if (!stats) return <Loading />;

  const currentMonthTransactionsCount = stats.recentTransactions.filter((t) => {
    const tDate = new Date(t.date);
    const now = new Date();
    return (
      tDate.getMonth() === now.getMonth() &&
      tDate.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <Header
          title="Thống kê tổng quan"
          subtitle="Theo dõi hiệu suất và doanh thu hệ thống"
        />
        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <KPICard
          title="TỔNG SỐ CĂN HỘ"
          value={stats.totalProperties}
          icon={<Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
          iconBgColor="bg-blue-50 dark:bg-blue-900/20"
          actionText="Xem chi tiết"
          actionIcon={<Eye className="h-4 w-4" />}
        />

        <KPICard
          title="ĐẶT PHÒNG HÔM NAY"
          value={stats.applicationsToday}
          icon={
            <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          }
          iconBgColor="bg-orange-50 dark:bg-orange-900/20"
          actionText="Xem tất cả đơn"
          actionIcon={<Eye className="h-4 w-4" />}
        />

        <KPICard
          title="DOANH THU THÁNG"
          value={formatCurrency(stats.currentMonthRevenue)}
          icon={
            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
          }
          iconBgColor="bg-green-50 dark:bg-green-900/20"
          footer={
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Từ {currentMonthTransactionsCount} giao dịch
            </span>
          }
        />

        <KPICard
          title="TỔNG KHÁCH HÀNG"
          value={stats.totalTenants}
          icon={<Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
          iconBgColor="bg-purple-50 dark:bg-purple-900/20"
          footer={
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              {stats.rentedProperties} đã thanh toán
            </span>
          }
        />
      </div>

      {/* Occupancy Rate & Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <OccupancyChart
          rentedProperties={stats.rentedProperties}
          totalProperties={stats.totalProperties}
          occupancyRate={stats.occupancyRate}
        />
        <RevenueChart
          data={stats.monthlyRevenue}
          totalRevenue={stats.totalRevenue}
        />
      </div>

      {/* Property Performance Section */}
      <PropertyPerformanceTable data={stats.propertyPerformance ?? []} />

      {/* Geographic Distribution */}
      <GeographicDistributionChart
        data={stats.geographicDistribution ?? []}
      />

      {/* Lease Expiration Alerts */}
      <LeaseExpirationAlerts data={stats.leaseExpirationAlerts ?? []} />

      {/* Recent Transactions */}
      <TransactionsTable transactions={stats.recentTransactions} />
    </div>
  );
};

export default StatsPage;