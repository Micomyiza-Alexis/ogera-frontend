import { apiSlice } from "./apiSlice";

export interface Permission {
  id: string;
  api_name: string;
  route: string;
  category?: string;
  permission: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionsResponse {
  success: boolean;
  message: string;
  data: Permission[];
}

export interface PermissionResponse {
  success: boolean;
  message: string;
  data: Permission;
}

export const permissionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all permissions
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

    // Get single permission by ID
    getPermissionById: builder.query<PermissionResponse, string>({
      query: (id) => ({
        url: `/permissions/${id}`,
        method: "GET",
      }),
      providesTags: ["Permission"],
    }),

    // Update permission
    updatePermission: builder.mutation<
      PermissionResponse,
      { id: string; data: Partial<Permission> }
    >({
      query: ({ id, data }) => ({
        url: `/permissions/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Permission"],
    }),

    // Create permission
    createPermission: builder.mutation<PermissionResponse, Partial<Permission>>({
      query: (data) => ({
        url: "/permissions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Permission"],
    }),

    // Delete permission
    deletePermission: builder.mutation<PermissionResponse, string>({
      query: (id) => ({
        url: `/permissions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Permission"],
    }),
  }),
});

export const {
  useGetAllPermissionsQuery,
  useGetPermissionByIdQuery,
  useUpdatePermissionMutation,
  useCreatePermissionMutation,
  useDeletePermissionMutation,
} = permissionsApi;
