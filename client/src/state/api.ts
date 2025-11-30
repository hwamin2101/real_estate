// src/state/api.ts
import { cleanParams, createNewUserInDatabase, withToast } from "@/lib/utils";
import {
  Application,
  Lease,
  Manager,
  Payment,
  Property,
  Tenant,
} from "@/types/prismaTypes";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { FiltersState } from ".";

// ==================== TYPE USER ====================
type User = {
  cognitoInfo: any;
  userInfo: Tenant | Manager;
  userRole: string;
  defaultLocation?: {
    name: string;
    latitude: number;
    longitude: number;
  };
};

// ==================== TYPE NOTIFICATION ====================
export type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  recipientCognitoId: string;
  userRole: string;
  relatedId?: number | null;
  relatedType?: string | null;
  createdAt: string;
};

// ==================== TYPE STATS RESPONSE ====================
type StatsResponse = {
  totalProperties: number;
  rentedProperties: number;
  currentMonthRevenue: number;
  totalTenants: number;
  applicationsToday: number;
  occupancyRate: number;
  totalRevenue: number;
  monthlyRevenue: { month: string; income: number }[];
  recentTransactions: {
    id: number;
    customer: string;
    date: string;
    amount: number;
    status: "Pending" | "Paid" | "PartiallyPaid" | "Overdue";
  }[];
  propertyPerformance: {
    name: string;
    occupancy: number;
    revenue: number;
    status: string;
  }[];
  tenantDemographics: {
    ageGroup: string;
    count: number;
    percentage: number;
  }[];
  geographicDistribution: {
    location: string;
    properties: number;
    percentage: number;
  }[];
  leaseExpirations: {
    tenant: string;
    property: string;
    expiryDate: string;
    daysLeft: number;
  }[];
};

// ==================== API SLICE ====================
export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
    prepareHeaders: async (headers) => {
      try {
        const session = await fetchAuthSession();
        const { idToken } = session.tokens ?? {};
        if (idToken) {
          headers.set("Authorization", `Bearer ${idToken.toString()}`);
        }
      } catch (error) {
        console.warn("Không lấy được token Amplify:", error);
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: [
    "Managers",
    "Tenants",
    "Properties",
    "PropertyDetails",
    "Leases",
    "Payments",
    "Applications",
    "Stats",
    "Notifications",
  ],
  endpoints: (build) => ({
    // ==================== AUTH ====================
    getAuthUser: build.query<User, void>({
      queryFn: async () => {
        try {
          const session = await fetchAuthSession();
          const { idToken } = session.tokens ?? {};
          const user = await getCurrentUser();
          const userRole = (idToken?.payload["custom:role"] as string)?.toLowerCase();

          if (!userRole || !["manager", "tenant"].includes(userRole)) {
            return { error: { status: 401, data: "Vai trò không hợp lệ" } };
          }

          const endpoint = userRole === "manager" ? `/managers/${user.userId}` : `/tenants/${user.userId}`;
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${idToken?.toString()}` },
          });

          let userDetails = await response.json();

          if (response.status === 404) {
            userDetails = await createNewUserInDatabase(user, idToken!, userRole, fetch);
          }

          return {
            data: {
              cognitoInfo: user,
              userInfo: userDetails,
              userRole,
              defaultLocation: {
                name: "Hà Nội, Việt Nam",
                latitude: 21.0278,
                longitude: 105.8342,
              },
            },
          };
        } catch (error: any) {
          return { error: { status: 500, data: error.message || "Lỗi xác thực" } };
        }
      },
    }),

    // ==================== PROPERTIES ====================
    getProperties: build.query<Property[], Partial<FiltersState> & { favoriteIds?: number[] }>({
      query: (filters) => {
        const params = cleanParams({
          location: filters.location,
          priceMin: filters.priceRange?.[0],
          priceMax: filters.priceRange?.[1],
          beds: filters.beds,
          baths: filters.baths,
          propertyType: filters.propertyType,
          squareFeetMin: filters.squareFeet?.[0],
          squareFeetMax: filters.squareFeet?.[1],
          amenities: Array.isArray(filters.amenities) ? filters.amenities.join(",") : "",
          availableFrom: filters.availableFrom,
          favoriteIds: filters.favoriteIds?.join(","),
          latitude: filters.coordinates?.[1],
          longitude: filters.coordinates?.[0],
        });
        return { url: "properties", params };
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Properties" as const, id })), { type: "Properties", id: "LIST" }]
          : [{ type: "Properties", id: "LIST" }],
    }),

    getProperty: build.query<Property, number>({
      query: (id) => `properties/${id}`,
      providesTags: (result, error, id) => [{ type: "PropertyDetails", id }],
    }),

    // ==================== NOTIFICATIONS ====================
    getNotifications: build.query<Notification[], void>({
      query: () => "notifications",
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Notifications" as const, id })), { type: "Notifications", id: "LIST" }]
          : [{ type: "Notifications", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Không thể tải thông báo.",
        });
      },
    }),
    getApplication: build.query<Application, number>({
      query: (id) => `applications/${id}`, 
      providesTags: ["Applications"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Không thể tải chi tiết hợp đồng.",
        });
      },
    }),

    markNotificationRead: build.mutation<Notification, string>({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Notifications", id },
        { type: "Notifications", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Đã đánh dấu đã đọc!",
          error: "Không thể đánh dấu đã đọc.",
        });
      },
    }),

    deleteNotification: build.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Notifications", id },
        { type: "Notifications", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Đã xóa thông báo!",
          error: "Không thể xóa thông báo.",
        });
      },
    }),

    // ==================== TENANTS ====================
    getTenant: build.query<Tenant, string>({
      query: (cognitoId) => `tenants/${cognitoId}`,
      providesTags: (result) => [{ type: "Tenants", id: result?.id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Không thể tải hồ sơ người thuê.",
        });
      },
    }),

    getCurrentResidences: build.query<Property[], string>({
      query: (cognitoId) => `tenants/${cognitoId}/current-residences`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as const, id })),
              { type: "Properties", id: "LIST" },
            ]
          : [{ type: "Properties", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Không thể tải danh sách nơi đang thuê.",
        });
      },
    }),

    updateTenantSettings: build.mutation<
      Tenant,
      { cognitoId: string } & Partial<Tenant>
    >({
      query: ({ cognitoId, ...updatedTenant }) => ({
        url: `tenants/${cognitoId}`,
        method: "PUT",
        body: updatedTenant,
      }),
      invalidatesTags: (result) => [{ type: "Tenants", id: result?.id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Cập nhật cài đặt thành công!",
          error: "Cập nhật cài đặt thất bại.",
        });
      },
    }),

    // ==================== FAVORITES ====================
    addFavoriteProperty: build.mutation<
      Tenant,
      { cognitoId: string; propertyId: number }
    >({
      query: ({ cognitoId, propertyId }) => ({
        url: `tenants/${cognitoId}/favorites/${propertyId}`,
        method: "POST",
      }),
      invalidatesTags: (result) => [
        { type: "Tenants", id: result?.id },
        { type: "Properties", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Đã thêm vào danh sách yêu thích!",
          error: "Không thể thêm vào danh sách yêu thích.",
        });
      },
    }),

    removeFavoriteProperty: build.mutation<
      Tenant,
      { cognitoId: string; propertyId: number }
    >({
      query: ({ cognitoId, propertyId }) => ({
        url: `tenants/${cognitoId}/favorites/${propertyId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result) => [
        { type: "Tenants", id: result?.id },
        { type: "Properties", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Đã xóa khỏi danh sách yêu thích!",
          error: "Không thể xóa khỏi danh sách yêu thích.",
        });
      },
    }),



        // === PAYMENT ENDPOINTS ===
    createVNPayPayment: build.mutation<{ paymentUrl: string }, { paymentId: number }>({
      query: (body) => ({
        url: "/payment/vnpay",
        method: "POST",
        body,
      }),
    }),

    createStripeSession: build.mutation<
      { url: string },
      { applicationId: number; paymentId: number }
    >({
      query: ({ applicationId, paymentId }) => ({
        url: `/payment/applications/${applicationId}/pay/stripe`,
        method: "POST",
        body: { paymentId },
      }),
    }),

    // === MANAGER ENDPOINTS ===
    // ==================== MANAGERS ====================
    getManagerProperties: build.query<Property[], string>({
      query: (cognitoId) => `managers/${cognitoId}/properties`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as const, id })),
              { type: "Properties", id: "LIST" },
            ]
          : [{ type: "Properties", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Không thể tải danh sách căn hộ của quản lý.",
        });
      },
    }),

    updateManagerSettings: build.mutation<
      Manager,
      { cognitoId: string } & Partial<Manager>
    >({
      query: ({ cognitoId, ...updatedManager }) => ({
        url: `managers/${cognitoId}`,
        method: "PUT",
        body: updatedManager,
      }),
      invalidatesTags: (result) => [{ type: "Managers", id: result?.id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Cập nhật thông tin quản lý thành công!",
          error: "Cập nhật thông tin quản lý thất bại.",
        });
      },
    }),

    createProperty: build.mutation<Property, FormData>({
      query: (newProperty) => ({
        url: `properties`,
        method: "POST",
        body: newProperty,
      }),
      invalidatesTags: (result) => [
        { type: "Properties", id: "LIST" },
        { type: "Managers", id: result?.manager?.id },
        "Stats",
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Tạo căn hộ mới thành công!",
          error: "Không thể tạo căn hộ mới.",
        });
      },
    }),

    // ==================== LEASES ====================
    getLeases: build.query<Lease[], void>({
      query: () => "leases",
      providesTags: ["Leases"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Không thể tải danh sách hợp đồng thuê.",
        });
      },
    }),

    getPropertyLeases: build.query<Lease[], number>({
      async queryFn(propertyId, _api, _extra, baseQuery) {
        try {
          const session = await fetchAuthSession();
          const { idToken } = session.tokens ?? {};
          const userId = idToken?.payload["sub"];
          const userType = idToken?.payload["custom:role"];

          if (!userId || !userType) {
            return { error: { status: 400, data: "Thiếu thông tin người dùng" } };
          }

          const result = await baseQuery(
            `applications?userId=${userId}&userType=${userType}`
          );
          if (result.error) return { error: result.error };

          const data = (result.data as any[]).filter(
            (app) => app.property.id === propertyId && app.lease
          );

          return {
            data: data.map((app) => ({
              id: app.lease.id,
              startDate: app.lease.startDate,
              endDate: app.lease.endDate,
              rent: app.lease.rent,
              tenant: app.tenant,
              property: app.property,
            })),
          };
        } catch {
          return { error: { status: 500, data: "Lỗi hệ thống" } };
        }
      },
      providesTags: ["Leases"],
    }),

    // ==================== PAYMENTS ====================
    getPayments: build.query<Payment[], number>({
      query: (leaseId) => `leases/${leaseId}/payments`,
      providesTags: ["Payments"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Không thể tải thông tin thanh toán.",
        });
      },
    }),

    
    getApplicationPaymentSchedule: build.query<Payment[], number>({
      query: (applicationId) => `applications/${applicationId}/payment-schedule`,
      providesTags: ["Payments"],
    }),

    // ==================== APPLICATIONS ====================
    getApplications: build.query<
      Application[],
      { userId?: string; userType?: string }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.userId) queryParams.append("userId", params.userId);
        if (params.userType) queryParams.append("userType", params.userType);
        return `applications?${queryParams.toString()}`;
      },
      providesTags: ["Applications"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Không thể tải danh sách đơn thuê.",
        });
      },
    }),

    updateApplicationStatus: build.mutation<
      Application & { lease?: Lease },
      { id: number; status: string }
    >({
      query: ({ id, status }) => ({
        url: `applications/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Applications", "Leases", "Stats"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Cập nhật trạng thái thuê thành công!",
          error: "Cập nhật trạng thái thuê thất bại.",
        });
      },
    }),

    createApplication: build.mutation<Application, Partial<Application>>({
      query: (body) => ({
        url: `applications`,
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["Applications", "Stats"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Yêu cầu thuê mới thành công!",
          error: "Không thể yêu cầu thuê mới.",
        });
      },
    }),

    // ==================== STATS ====================
    getStats: build.query<StatsResponse, void>({
      query: () => "stats",
      providesTags: ["Stats"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Không thể tải dữ liệu thống kê.",
        });
      },
    }),

    getLeaseExpirationAlerts: build.query<
      {
        id: number;
        tenant: string;
        property: string;
        expiryDate: string;
        daysRemaining: number;
        priority: "Critical" | "High" | "Low";
      }[],
      void
    >({
      query: () => "analytics/lease-expiration-alerts",
      providesTags: ["Stats"],
    }),

    getPropertyPerformance: build.query<
      {
        id: number;
        name: string;
        occupancyRate: number;
        monthlyRevenue: number;
        status: string;
      }[],
      void
    >({
      query: () => "analytics/property-performance",
      providesTags: ["Stats"],
    }),

    getTenantDemographics: build.query<
      {
        totalTenants: number;
        ageGroups: Record<string, number>;
        genderDistribution: Record<string, number>;
      },
      void
    >({
      query: () => "analytics/tenant-demographics",
      providesTags: ["Stats"],
    }),

    getGeographicDistribution: build.query<
      {
        city: string;
        propertyCount: number;
        percentage: string;
      }[],
      void
    >({ 
      query: () => "analytics/geographic-distribution",
      providesTags: ["Stats"],
    }),
  }),
});

// ==================== EXPORT HOOKS ====================
export const {
  useGetAuthUserQuery,
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useGetTenantQuery,
  useGetCurrentResidencesQuery,
  useUpdateTenantSettingsMutation,
  useAddFavoritePropertyMutation,
  useRemoveFavoritePropertyMutation,
  useGetManagerPropertiesQuery,
  useUpdateManagerSettingsMutation,
  useCreatePropertyMutation,
  useGetLeasesQuery,
  useGetPropertyLeasesQuery,
  useGetPaymentsQuery,
  useGetApplicationQuery,
  useGetApplicationsQuery,
  useCreateApplicationMutation,
  useUpdateApplicationStatusMutation,
  // useCreateApplicationMutation,
  useUpdatePropertyMutation,
  // useDeletePropertyMutation,
  useCreateVNPayPaymentMutation,
  useCreateStripeSessionMutation,
  useGetApplicationPaymentScheduleQuery,
  useGetStatsQuery,
  useGetLeaseExpirationAlertsQuery,
  useGetPropertyPerformanceQuery,
  useGetTenantDemographicsQuery,
  useGetGeographicDistributionQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useDeleteNotificationMutation,
} = api;