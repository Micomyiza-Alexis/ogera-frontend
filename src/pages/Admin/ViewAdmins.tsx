import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import CustomTable, {
  type Column,
  type TableAction,
} from "../../components/Table/CustomTable";
import {
  Chip,
  Avatar,
  Box,
  Typography,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { TrashIcon } from "@heroicons/react/24/outline";
import {
  useGetAllAdminsQuery,
  useDeleteAdminMutation,
  useGetAdminByIdQuery,
  useUpdateAdminMutation,
} from "../../services/api/adminApi";
import type { AdminProfile } from "../../services/api/adminApi";
import toast from "react-hot-toast";

interface Admin {
  index: number;
  id: string;
  name: string;
  email: string;
  role: "Admin";
  roleName: string;
  joinDate: string;
  mobile_number?: string;
}

const ViewAdmins: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dateLocaleMap: Record<string, string> = { af: "af-ZA", zu: "zu-ZA", sw: "sw-KE", rw: "rw-RW", fr: "fr-FR" };
  const dateLocale = dateLocaleMap[i18n.language] || "en-US";
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError, refetch } = useGetAllAdminsQuery({
    page: page + 1, // API uses 1-based page, table uses 0-based
    limit,
    search: searchQuery,
  });

  const [deleteAdmin, { isLoading: isDeleting }] = useDeleteAdminMutation();
  const [updateAdmin, { isLoading: isUpdating }] = useUpdateAdminMutation();

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<{ id: string; name: string } | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [editForm, setEditForm] = useState<{
    full_name?: string;
    email?: string;
    mobile_number?: string;
  }>({});

  const selectedAdminId = selectedAdmin?.id || "";

  const {
    data: adminDetails,
    isLoading: isLoadingAdminDetails,
    refetch: refetchAdminDetails,
  } = useGetAdminByIdQuery(selectedAdminId, {
    skip: !selectedAdminId || (!viewDialogOpen && !editDialogOpen),
  });

  useEffect(() => {
    if (adminDetails?.data && editDialogOpen) {
      setEditForm({
        full_name: adminDetails.data.full_name,
        email: adminDetails.data.email,
        mobile_number: adminDetails.data.mobile_number,
      });
    }
  }, [adminDetails, editDialogOpen]);

  const handleDeleteClick = (id: string, name: string) => {
    setAdminToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!adminToDelete) return;

    try {
      await deleteAdmin(adminToDelete.id).unwrap();
      toast.success(t("pages.admin.adminDeletedSuccess"));
      setShowDeleteModal(false);
      setAdminToDelete(null);
      refetch();
    } catch (error: any) {
      toast.error(
        error?.data?.message || t("pages.admin.failedToDeleteAdmin")
      );
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAdminToDelete(null);
  };

  const handleView = (row: Admin) => {
    setSelectedAdmin(row);
    setViewDialogOpen(true);
    refetchAdminDetails();
  };

  const handleEdit = (row: Admin) => {
    setSelectedAdmin(row);
    setEditDialogOpen(true);
    refetchAdminDetails();
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedAdmin(null);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedAdmin(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!selectedAdmin) return;
    try {
      await updateAdmin({ id: selectedAdmin.id, data: editForm }).unwrap();
      toast.success(t("pages.admin.adminUpdatedSuccess"));
      handleCloseEditDialog();
      refetch();
    } catch (error: any) {
      toast.error(
        error?.data?.message || t("pages.admin.failedToUpdateAdmin")
      );
    }
  };

  const mapAdmin = (admin: AdminProfile, index: number): Admin => ({
    index: page * limit + index + 1, // Calculate index based on current page
    id: admin.user_id,
    name: admin.full_name,
    email: admin.email,
    role: "Admin", // All admins show as "Admin"
    roleName: admin.role?.roleName || "-", // Show the actual role name (e.g., "job-admin", "users-admin")
    joinDate: admin.created_at
      ? new Date(admin.created_at).toLocaleDateString(dateLocale, {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : "-",
    mobile_number: admin.mobile_number,
  });

  // Use server response data array, since the endpoint returns an object wrapper.
  const rawAdmins = data?.data ?? [];
  const admins: Admin[] = (!data && isError && searchQuery)
    ? []
    : rawAdmins.map((admin: AdminProfile, index: number) => mapAdmin(admin, index));

  const totalCount = data?.pagination?.total ?? rawAdmins.length;

  const columns: Column<Admin>[] = [
    {
      id: "index",
      label: "#",
      minWidth: 60,
      align: "center",
      sortable: false,
      format: (value) => (
        <Typography sx={{ fontWeight: 500, color: "var(--theme-text-secondary, #6b7280)" }}>
          {value}
        </Typography>
      ),
    },
    {
      id: "name",
      label: t("pages.admin.admin"),
      minWidth: 200,
      format: (value, row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: "#9333ea",
              width: 40,
              height: 40,
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {row.name.charAt(0)}
          </Avatar>
          <Typography sx={{ fontWeight: 500, color: "var(--theme-text-primary, #111827)" }}>
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: "email",
      label: t("pages.admin.email"),
      minWidth: 200,
    },
    {
      id: "role",
      label: t("pages.admin.role"),
      minWidth: 120,
      format: (value) => (
        <Chip
          label={value}
          size="small"
          sx={{
            bgcolor: "var(--chip-role-admin-bg)",
            color: "var(--chip-role-admin-text)",
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      id: "roleName",
      label: t("pages.admin.roleName"),
      minWidth: 150,
      format: (value) => (
        <Typography sx={{ color: "var(--theme-text-primary, #111827)", fontWeight: 500 }}>
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "mobile_number",
      label: t("pages.admin.mobile"),
      minWidth: 120,
      format: (value) => (
        <Typography sx={{ color: "var(--theme-text-secondary, #6b7280)" }}>
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "joinDate",
      label: t("pages.admin.createdDate"),
      minWidth: 120,
    },
  ];

  const actions: TableAction<Admin>[] = [
    {
      label: t("pages.admin.view"),
      icon: <ViewIcon fontSize="small" />,
      onClick: (row) => {
        handleView(row);
      },
      color: "primary",
    },
    {
      label: t("pages.admin.edit"),
      icon: <EditIcon fontSize="small" />,
      onClick: (row) => {
        handleEdit(row);
      },
      color: "primary",
    },
    {
      label: t("pages.admin.delete"),
      icon: <DeleteIcon fontSize="small" />,
      onClick: (row) => handleDeleteClick(row.id, row.name),
      color: "error",
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 flex items-center gap-2 md:gap-3">
            <UserGroupIcon className="h-8 w-8 md:h-10 md:w-10 text-purple-600" />
            {t("pages.admin.viewTitle")}
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-2">
            {t("pages.admin.viewSubtitle")}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">{t("pages.admin.totalAdmins")}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {isLoading ? "…" : totalCount}
          </p>
          <p className="text-sm text-green-600 mt-2">{t("pages.admin.liveData")}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">{t("pages.admin.admins")}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {isLoading
              ? "…"
              : admins.filter((a) => a.role === "Admin").length}
          </p>
          <p className="text-sm text-blue-600 mt-2">{t("pages.admin.fullAdminAccess")}</p>
        </div>
      </div>

      {/* Custom Table */}
      <CustomTable
        columns={columns}
        data={admins}
        actions={actions}
        loading={isLoading || isDeleting}
        emptyMessage={
          isError
            ? t("pages.admin.failedToLoadAdmins")
            : t("pages.admin.noAdminsFound")
        }
        selectable={true}
        searchable={true}
        searchPlaceholder={t("pages.admin.searchPlaceholder")}
        onSearch={(q) => { setSearchQuery(q); setPage(0); }}
        disableClientSideSearch={true}
        rowsPerPageOptions={[5, 10, 25, 50]}
        defaultRowsPerPage={limit}
        serverSidePagination={true}
        totalCount={totalCount}
        page={page}
        onPageChange={(newPage) => setPage(newPage)}
        onRowsPerPageChange={(newLimit) => {
          setLimit(newLimit);
          setPage(0);
        }}
      />

      {/* View Admin Modal */}
      {viewDialogOpen && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto theme-modal">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between theme-modal-header">
              <h2 className="text-2xl font-bold text-gray-900">{t("pages.admin.adminDetails")}</h2>
              <button
                onClick={handleCloseViewDialog}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
            <div className="p-6">
              {isLoadingAdminDetails || !adminDetails?.data ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                  <p className="mt-2 text-gray-600">{t("pages.admin.loading")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar
                      sx={{
                        bgcolor: "#9333ea",
                        width: 48,
                        height: 48,
                        fontSize: "1.25rem",
                        fontWeight: 600,
                      }}
                    >
                      {adminDetails.data.full_name?.charAt(0) || "A"}
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {adminDetails.data.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {adminDetails.data.role?.roleName || "Admin"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t("pages.admin.email")}</p>
                      <p className="text-sm text-gray-900">{adminDetails.data.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t("pages.admin.mobile")}</p>
                      <p className="text-sm text-gray-900">{adminDetails.data.mobile_number || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t("pages.admin.createdAt")}</p>
                      <p className="text-sm text-gray-900">
                        {adminDetails.data.created_at
                          ? new Date(adminDetails.data.created_at).toLocaleString(dateLocale === "af-ZA" ? "af-ZA" : "en-US")
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <button
                      onClick={handleCloseViewDialog}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                    >
                      {t("pages.admin.close")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editDialogOpen && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border-2 border-gray-200 max-h-[90vh] overflow-y-auto theme-modal">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between theme-modal-header">
              <h2 className="text-2xl font-bold text-gray-900">{t("pages.admin.editAdmin")}</h2>
              <button
                onClick={handleCloseEditDialog}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="p-6 space-y-4">
              {isLoadingAdminDetails || !adminDetails?.data ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                  <p className="mt-2 text-gray-600">{t("pages.admin.loading")}</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("pages.admin.fullNameLabel")}
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.full_name ?? ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          full_name: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t("pages.admin.fullNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("pages.admin.emailAddressLabel")}
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email ?? ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t("pages.admin.emailPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("pages.admin.mobileNumberOptional")}
                    </label>
                    <input
                      type="tel"
                      value={editForm.mobile_number ?? ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          mobile_number: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t("pages.admin.mobileNumberPlaceholder")}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseEditDialog}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                    >
                      {t("pages.admin.cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating || isLoadingAdminDetails}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium disabled:opacity-50"
                    >
                      {isUpdating ? t("pages.admin.saving") : t("pages.admin.saveChanges")}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && adminToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border-2 border-red-200 theme-modal">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                {t("pages.admin.deleteAdminTitle")}
              </h3>
              <p className="text-gray-600 text-center mb-6">
                {t("pages.admin.deleteAdminConfirm", { name: adminToDelete.name })}
                <br />
                <span className="text-red-600 font-medium">{t("pages.admin.actionCannotBeUndone")}</span>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  {t("pages.admin.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t("pages.admin.deleting")}
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-5 w-5" />
                      {t("pages.admin.delete")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAdmins;






