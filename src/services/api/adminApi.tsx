import { apiSlice } from "./apiSlice";

export interface CreateAdminRequest {
  email: string;
  password: string;
  role: string; // roleName from the roles table
  full_name?: string;
  mobile_number?: string;
}

export interface AdminProfile {
  user_id: string;
  email: string;
  full_name: string;
  mobile_number?: string;
  role: {
    roleName: string;
    roleType: string;
  };
  created_at: string;
  updated_at: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAdminResponse {
  success: boolean;
  status: number;
  data: AdminProfile;
  message: string;
}

export interface AdminsListResponse {
  success: boolean;
  status: number;
  data: AdminProfile[];
  message: string;
  pagination?: PaginationMeta;
}

export interface AdminDetailResponse {
  success: boolean;
  status: number;
  data: AdminProfile;
  message: string;
}

export interface UpdateAdminRequest {
  full_name?: string;
  email?: string;
  mobile_number?: string;
  password?: string;
  role?: string;
}

export interface Role {
  id: string;
  roleName: string;
  roleType: string;
  permission_json: any;
  created_at?: string;
  updated_at?: string;
}

export interface RolesResponse {
  success?: boolean;
  status?: number;
  data?: Role[];
  message?: string;
}

export interface CreateRoleRequest {
  roleName: string;
  roleType: "student" | "employer" | "superAdmin" | "admin";
  permission_json?: any[];
}

export interface CreateRoleResponse {
  message: string;
  data: Role;
}

export interface UpdateRoleRequest {
  roleName?: string;
  permission_json?: any[];
}

export interface Permission {
  id: string;
  api_name: string;
  route: string;
  permission: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export interface PermissionsResponse {
  success?: boolean;
  status?: number;
  data?: Permission[];
  message?: string;
}

export interface CreatePermissionRequest {
  api_name: string;
  route: string;
  permission: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}

export interface CreatePermissionResponse {
  success: boolean;
  status: number;
  data: Permission;
  message: string;
}

export interface RoutesResponse {
  success: boolean;
  status: number;
  data: string[];
  message: string;
}

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create admin or subadmin (superadmin only)
    createAdmin: builder.mutation<CreateAdminResponse, CreateAdminRequest>({
      query: (data) => ({
        url: "/auth/create-subadmin",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // Get all admins/subadmins (superadmin only)
    getAllAdmins: builder.query<AdminsListResponse, PaginationParams | void>({
      query: (params = {}) => {
        const { page = 1, limit = 10, search } = params || {};
        const qp: Record<string, any> = { page, limit };
        if (search && search.trim()) qp.search = search.trim();
        return {
          url: "/auth/subadmins",
          method: "GET",
          params: qp,
        };
      },
      providesTags: ["User"],
    }),

    // Get admin/subadmin by ID (superadmin only)
    getAdminById: builder.query<AdminDetailResponse, string>({
      query: (id) => ({
        url: `/auth/subadmins/${id}`,
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    // Update admin/subadmin (superadmin only)
    updateAdmin: builder.mutation<
      AdminDetailResponse,
      { id: string; data: UpdateAdminRequest }
    >({
      query: ({ id, data }) => ({
        url: `/auth/subadmins/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // Delete admin/subadmin (superadmin only)
    deleteAdmin: builder.mutation<
      { success: boolean; status: number; message: string },
      string
    >({
      query: (id) => ({
        url: `/auth/subadmins/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    // Get all roles (for dropdown selection / listing)
    getAllRoles: builder.query<Role[], { search?: string } | void>({
      query: (params = {}) => {
        const search = params?.search?.trim();
        return {
          url: search ? `/roles?search=${encodeURIComponent(search)}` : "/roles",
          method: "GET",
        };
      },
      providesTags: ["Role"],
    }),

    // Get role by ID
    getRoleById: builder.query<Role, string>({
      query: (id) => ({
        url: `/roles/${id}`,
        method: "GET",
      }),
      providesTags: ["Role"],
    }),

    // Create role (superadmin only)
    createRole: builder.mutation<CreateRoleResponse, CreateRoleRequest>({
      query: (data) => ({
        url: "/roles/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Role"],
    }),

    // Update role (superadmin only)
    updateRole: builder.mutation<
      { message: string; data: Role },
      { id: string; data: UpdateRoleRequest }
    >({
      query: ({ id, data }) => ({
        url: `/roles/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Role"],
    }),

    // Delete role (superadmin only)
    deleteRole: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),

    // Get all permissions (superadmin only)
    getAllPermissions: builder.query<PermissionsResponse, { search?: string } | void>({
      query: (params = {}) => {
        const search = params?.search?.trim();
        return {
          url: search ? `/permissions?search=${encodeURIComponent(search)}` : "/permissions",
          method: "GET",
        };
      },
      providesTags: ["Permission"],
    }),

    // Get permission by ID (superadmin only)
    getPermissionById: builder.query<{ success: boolean; data: Permission }, string>({
      query: (id) => ({
        url: `/permissions/${id}`,
        method: "GET",
      }),
      providesTags: ["Permission"],
    }),

    // Create permission (superadmin only)
    createPermission: builder.mutation<CreatePermissionResponse, CreatePermissionRequest>({
      query: (data) => ({
        url: "/permissions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Permission"],
    }),

    // Update permission (superadmin only)
    updatePermission: builder.mutation<
      CreatePermissionResponse,
      { id: string; data: Partial<CreatePermissionRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/permissions/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Permission"],
    }),

    // Delete permission (superadmin only)
    deletePermission: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/permissions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Permission"],
    }),

    // Get all available routes (superadmin only)
    getAllRoutes: builder.query<RoutesResponse, void>({
      query: () => ({
        url: "/permissions/routes",
        method: "GET",
      }),
    }),
  }),
});

export const {
  useCreateAdminMutation,
  useGetAllAdminsQuery,
  useGetAdminByIdQuery,
  useUpdateAdminMutation,
  useDeleteAdminMutation,
  useGetAllRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetAllPermissionsQuery,
  useGetPermissionByIdQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
  useGetAllRoutesQuery,
} = adminApi;
