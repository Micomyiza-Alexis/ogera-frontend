import { apiSlice } from "./apiSlice";
import type { UserProfile } from "./profileApi";

export interface PaginationParams {
  page?: number;
  limit?: number;
  type?: string; // "all", "Student", or "Employer"
  search?: string; // Search by name or email
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsersListResponse {
  success: boolean;
  status: number;
  data: UserProfile[];
  message: string;
  pagination?: PaginationMeta;
  counts?: {
    students: number;
    employers: number;
  };
}

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all users (admin / superadmin)
    // This single endpoint handles all user types based on the 'type' parameter
    // type: undefined or "all" = all users, "Student" = students only, "Employer" = employers only
    // Supports search by name or email via the 'search' parameter
    getAllUsers: builder.query<UsersListResponse, PaginationParams | void>({
      query: (params = {}) => {
        const { page = 1, limit = 10, type, search } = params || {};
        const queryParams: Record<string, any> = {
          page,
          limit,
        };
        // Only add type parameter if it's provided and not "all"
        if (type && type !== "all") {
          queryParams.type = type;
        }
        // Only add search parameter if it's provided and not empty
        if (search && search.trim()) {
          queryParams.search = search.trim();
        }
        return {
          url: "/users",
          method: "GET",
          params: queryParams,
        };
      },
      providesTags: ["User"],
    }),

    // Get all students
    // getAllStudents: builder.query<UsersListResponse, PaginationParams | void>({
    //   query: (params = {}) => {
    //     const { page = 1, limit = 10 } = params || {};
    //     return {
    //       url: "/auth/get-students",
    //       method: "GET",
    //       params: {
    //         page,
    //         limit,
    //       },
    //     };
    //   },
    //   providesTags: ["User"],
    // }),

    // // Get all employers
    // getAllEmployers: builder.query<UsersListResponse, PaginationParams | void>({
    //   query: (params = {}) => {
    //     const { page = 1, limit = 10 } = params || {};
    //     return {
    //       url: "/auth/get-employers",
    //       method: "GET",
    //       params: {
    //         page,
    //         limit,
    //       },
    //     };
    //   },
    //   providesTags: ["User"],
    // }),

    // Get user by ID (admin/superadmin only)
    getUserById: builder.query<
      { success: boolean; status: number; data: UserProfile; message: string },
      string
    >({
      query: (id) => ({
        url: `/auth/users/${id}`,
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    // Update user by ID (admin/superadmin only)
    updateUserById: builder.mutation<
      { success: boolean; status: number; data: UserProfile; message: string },
      { id: string; data: Partial<UserProfile> }
    >({
      query: ({ id, data }) => ({
        url: `/auth/users/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // Delete user (admin/superadmin only)
    deleteUser: builder.mutation<
      { success: boolean; status: number; message: string },
      string
    >({
      query: (id) => ({
        url: `/auth/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    // Add user (admin/superadmin only)
    addUser: builder.mutation<
      { success: boolean; status: number; data: UserProfile; message: string },
      {
        full_name: string;
        email: string;
        password: string;
        role: string;
        mobile_number: string;
        national_id_number?: string;
        business_registration_id?: string;
      }
    >({
      query: (data) => ({
        url: "/auth/add-user",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  // useGetAllStudentsQuery,
  // useGetAllEmployersQuery,
  useGetUserByIdQuery,
  useUpdateUserByIdMutation,
  useDeleteUserMutation,
  useAddUserMutation,
} = usersApi;
