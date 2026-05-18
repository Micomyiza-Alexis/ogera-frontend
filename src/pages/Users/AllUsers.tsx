import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { UsersIcon } from "@heroicons/react/24/outline";
import CustomTable, {
  type Column,
  type TableAction,
} from "../../components/Table/CustomTable";
import { 
  Chip, 
  Avatar, 
  Box, 
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  TextField,
  Grid,
  useMediaQuery,
  useTheme,
  IconButton,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useGetAllUsersQuery, useGetUserByIdQuery, useUpdateUserByIdMutation, useDeleteUserMutation } from "../../services/api/usersApi";
import type { UserProfile } from "../../services/api/profileApi";
import toast from "react-hot-toast";
import AddUserDialog from "../../components/AddUserDialog";

interface User {
  index: number;
  id: number;
  userId: string; // Store the actual user_id (UUID) for API calls
  name: string;
  email: string;
  role: "Student" | "Employer" | "Admin";
  status: "Active" | "Pending" | "Suspended";
  joinDate: string;
}

const AllUsers: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = isMobile; // Alias for consistency with existing code
  
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState(""); // Add search state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToView, setUserToView] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});
  const [countdown, setCountdown] = useState(3);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [deleteUser] = useDeleteUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserByIdMutation();
  
  // Fetch full user details when viewing/editing
  const { data: userDetails, isLoading: isLoadingUserDetails } = useGetUserByIdQuery(
    userToView?.userId || userToEdit?.userId || "",
    { skip: !userToView && !userToEdit }
  );

  // Update form data when user details are loaded
  useEffect(() => {
    if (userDetails?.data && userToEdit) {
      setEditFormData({
        full_name: userDetails.data.full_name,
        email: userDetails.data.email,
        mobile_number: userDetails.data.mobile_number,
        national_id_number: userDetails.data.national_id_number,
        business_registration_id: userDetails.data.business_registration_id,
        preferred_location: userDetails.data.preferred_location,
      });
    }
  }, [userDetails, userToEdit]);

  // Use getAllUsers API with server-side pagination - this endpoint uses roleType from roles table
  // Now includes counts for students and employers in a single API call
  // No type parameter means fetch all users (students and employers)
  // Search is performed on the backend for efficiency
  const { 
    data: usersData, 
    isLoading, 
    isError 
  } = useGetAllUsersQuery({
    page: page + 1, // Backend uses 1-based pagination
    limit: limit,
    search: searchQuery, // Pass search query to API
    // No type parameter = fetch all users
  });

  const allUsers: UserProfile[] = usersData?.data || [];

  const mapUser = (user: UserProfile, index: number): User => {
    // Use roleType / roleName from the role object (now available from the API)
    const rawRoleType = user.role?.roleType || user.role?.roleName || "";
    const roleType = rawRoleType.toLowerCase();
    const startIndex = page * limit;

    let uiRole: User["role"];
    if (roleType === "student") {
      uiRole = "Student";
    } else if (roleType === "employer") {
      uiRole = "Employer";
    } else {
      // Any admin-type role (admin / superAdmin / custom admin names) will
      // be normalised to "Admin" for display. These should generally be
      // managed from the Admin section, not this Users list.
      uiRole = "Admin";
    }

    return {
      index: startIndex + index + 1,
      id: Number(user.user_id),
      userId: user.user_id, // Store the UUID string for API calls
      name: user.full_name,
      email: user.email,
      role: uiRole,
      status: "Active",
      joinDate: user.created_at
        ? new Date(user.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
          })
        : "-",
    };
  };

  const users: User[] = allUsers.map((user, index) => mapUser(user, index));
  
  // Calculate counts from pagination metadata and counts from API
  const totalCount = usersData?.pagination?.total || 0;
  const studentCount = usersData?.counts?.students || 0;
  const employerCount = usersData?.counts?.employers || 0;

  // Lock body scroll when any full-screen dialog (view/edit/add user) is open
  useEffect(() => {
    const anyDialogOpen = viewDialogOpen || editDialogOpen || addUserDialogOpen;
    if (!anyDialogOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [viewDialogOpen, editDialogOpen, addUserDialogOpen]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
    setCountdown(3);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.userId).unwrap();
        // The mutation will automatically invalidate the cache and refetch the data
      } catch (error) {
        console.error("Failed to delete user:", error);
        // You can add a toast notification here if needed
      }
    }
    handleCloseDeleteDialog();
  }, [userToDelete, deleteUser, handleCloseDeleteDialog]);

  const handleDeleteClick = (row: User) => {
    setUserToDelete(row);
    setDeleteDialogOpen(true);
    setCountdown(3);
  };

  const handleViewClick = (row: User) => {
    setUserToView(row);
    setViewDialogOpen(true);
  };

  const handleEditClick = (row: User) => {
    setUserToEdit(row);
    setEditDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setUserToView(null);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setUserToEdit(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    if (!userToEdit) return;

    try {
      await updateUser({ id: userToEdit.userId, data: editFormData }).unwrap();
      toast.success(t("pages.users.userUpdatedSuccess"));
      handleCloseEditDialog();
    } catch (error: any) {
      toast.error(error?.data?.message || t("pages.users.failedToUpdateUser"));
    }
  };

  // Handle delete dialog countdown
  useEffect(() => {
    if (!deleteDialogOpen) {
      return;
    }

    // Reset countdown when dialog opens
    setCountdown(3);

    // Start countdown interval
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          // Auto-delete when countdown reaches 0
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          handleConfirmDelete();
          return 0;
        }
        return newCount;
      });
    }, 1000);

    // Cleanup on unmount or when dialog closes
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [deleteDialogOpen, handleConfirmDelete]);

  const columns: Column<User>[] = [
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
      label: t("pages.users.user"),
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
      label: t("pages.users.email"),
      minWidth: 200,
    },
    {
      id: "role",
      label: t("pages.users.role"),
      minWidth: 120,
      format: (value) => {
        const isStudent = value === "Student";
        const isEmployer = value === "Employer";
        return (
          <Chip
            label={value}
            size="small"
            sx={{
              bgcolor: isStudent ? "var(--chip-role-student-bg)" : isEmployer ? "var(--chip-role-employer-bg)" : "var(--chip-role-admin-bg)",
              color: isStudent ? "var(--chip-role-student-text)" : isEmployer ? "var(--chip-role-employer-text)" : "var(--chip-role-admin-text)",
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      id: "status",
      label: t("pages.users.status"),
      minWidth: 120,
      format: (value) => {
        const isActive = value === "Active";
        const isPending = value === "Pending";
        return (
          <Chip
            label={value}
            size="small"
            sx={{
              bgcolor: isActive ? "var(--chip-status-active-bg)" : isPending ? "var(--chip-status-pending-bg)" : "var(--chip-status-suspended-bg)",
              color: isActive ? "var(--chip-status-active-text)" : isPending ? "var(--chip-status-pending-text)" : "var(--chip-status-suspended-text)",
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      id: "joinDate",
      label: t("pages.users.joinDate"),
      minWidth: 120,
    },
  ];

  const actions: TableAction<User>[] = [
    {
      label: t("pages.users.view"),
      icon: <ViewIcon fontSize="small" />,
      onClick: (row) => {
        handleViewClick(row);
      },
      color: "primary",
    },
    {
      label: t("pages.users.edit"),
      icon: <EditIcon fontSize="small" />,
      onClick: (row) => {
        handleEditClick(row);
      },
      color: "primary",
    },
    {
      label: t("pages.users.delete"),
      icon: <DeleteIcon fontSize="small" />,
      onClick: (row) => {
        handleDeleteClick(row);
      },
      color: "error",
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 flex items-center gap-2 md:gap-3">
            <UsersIcon className="h-8 w-8 md:h-10 md:w-10 text-purple-600" />
            {t("pages.users.allUsers")}
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-2">
            {t("pages.users.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setAddUserDialogOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 md:px-6 py-2.5 rounded-lg font-semibold transition shadow-md hover:shadow-lg whitespace-nowrap self-start md:self-auto"
        >
          {t("pages.users.addUser")}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">{t("pages.users.totalUsers")}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {isLoading ? "…" : totalCount}
          </p>
          <p className="text-sm text-green-600 mt-2">
            {t("pages.users.studentsAndEmployersOnly")}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">{t("pages.users.students")}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {isLoading ? "…" : studentCount}
          </p>
          <p className="text-sm text-blue-600 mt-2">{t("pages.users.studentAccounts")}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">{t("pages.users.employers")}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {isLoading ? "…" : employerCount}
          </p>
          <p className="text-sm text-purple-600 mt-2">{t("pages.users.employerAccounts")}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">{t("pages.users.onThisPage")}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {isLoading ? "…" : users.length}
          </p>
          <p className="text-sm text-gray-600 mt-2">{t("pages.users.currentlyDisplayed")}</p>
        </div>
      </div>

      {/* Custom Table */}
      <CustomTable
        columns={columns}
        data={users}
        actions={actions}
        loading={isLoading}
        emptyMessage={
          isError
            ? t("pages.users.failedToLoad")
            : totalCount === 0
            ? t("pages.users.noUsersPresent")
            : t("pages.users.noUsersFound")
        }
        selectable={true}
        searchable={true}
        searchPlaceholder={t("pages.users.searchPlaceholder")}
        onSearch={(query) => {
          setSearchQuery(query);
          setPage(0); // Reset to first page when searching
        }}
        disableClientSideSearch={true} // Disable client-side filtering as we use server-side search
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

      {/* View User Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            m: isMobile ? 0 : 2,
            maxHeight: isMobile ? "100vh" : "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {userDetails?.data?.role?.roleType === "student" ? "Student" : userDetails?.data?.role?.roleType === "employer" ? "Employer" : "User"} Details
          </Typography>
          <IconButton
            onClick={handleCloseViewDialog}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": { backgroundColor: "action.hover" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 3 } }}>
          {isLoadingUserDetails ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: isMobile ? 2 : 4 }}>
              <CircularProgress size={isMobile ? 32 : 40} />
            </Box>
          ) : userDetails?.data ? (
            <Box>
              {/* User Profile Header Card */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
                  mb: isSmallMobile ? 1.5 : isMobile ? 2 : 2,
                  p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                  borderRadius: 1.5,
                  backgroundColor:
                    userDetails.data.role?.roleType === "student"
                      ? "var(--chip-role-student-bg)"
                      : "var(--chip-role-employer-bg)",
                  border: `1px solid ${
                    userDetails.data.role?.roleType === "student"
                      ? "var(--chip-role-student-bg)"
                      : "var(--chip-role-employer-bg)"
                  }`,
                  flexDirection: isMobile ? "column" : "row",
                  textAlign: isMobile ? "center" : "left",
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: userDetails.data.role?.roleType === "student" ? "#3b82f6" : "#10b981",
                    width: isSmallMobile ? 48 : isMobile ? 56 : 64,
                    height: isSmallMobile ? 48 : isMobile ? 56 : 64,
                    fontSize: isSmallMobile ? "1.25rem" : isMobile ? "1.5rem" : "1.75rem",
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
                  }}
                >
                  {userDetails.data.full_name?.charAt(0) || "U"}
                </Avatar>
                <Box sx={{ flex: 1, width: isMobile ? "100%" : "auto" }}>
                  <Typography 
                    variant={isSmallMobile ? "subtitle2" : isMobile ? "subtitle1" : "h6"} 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: isSmallMobile ? "0.9375rem" : isMobile ? "1.125rem" : "1.25rem",
                      mb: 0.5,
                      color: "text.primary",
                    }}
                  >
                    {userDetails.data.full_name}
                  </Typography>
                  <Chip
                    label={userDetails.data.role?.roleType === "student" ? "Student" : "Employer"}
                    size="small"
                    sx={{
                      bgcolor: userDetails.data.role?.roleType === "student" ? "var(--chip-role-student-bg)" : "var(--chip-role-employer-bg)",
                      color: userDetails.data.role?.roleType === "student" ? "var(--chip-role-student-text)" : "var(--chip-role-employer-text)",
                      fontWeight: 600,
                      fontSize: isSmallMobile ? "0.65rem" : isMobile ? "0.7rem" : "0.75rem",
                      height: isSmallMobile ? "20px" : isMobile ? "22px" : "24px",
                      px: 0.75,
                    }}
                  />
                </Box>
              </Box>

              {/* Details Section */}
              <Grid container spacing={isSmallMobile ? 1.5 : isMobile ? 2 : 2}>
                {/* Email */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                      borderRadius: 1.5,
                      backgroundColor: "var(--theme-card-bg, #ffffff)",
                      border: "1px solid var(--theme-border, rgba(0, 0, 0, 0.08))",
                      boxShadow: "0 4px 10px rgba(15, 23, 42, 0.04)",
                      height: "100%",
                      minHeight: "80px",
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: isSmallMobile ? 0.5 : 0.75, 
                        fontSize: isSmallMobile ? "0.65rem" : isMobile ? "0.7rem" : "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Email Address
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: isSmallMobile ? "0.8125rem" : isMobile ? "0.875rem" : "0.9375rem",
                        wordBreak: "break-word",
                        color: "text.primary",
                      }}
                    >
                      {userDetails.data.email}
                    </Typography>
                  </Box>
                </Grid>

                {/* Mobile Number */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                      borderRadius: 1.5,
                      backgroundColor: "var(--theme-card-bg, #ffffff)",
                      border: "1px solid var(--theme-border, rgba(0, 0, 0, 0.08))",
                      boxShadow: "0 4px 10px rgba(15, 23, 42, 0.04)",
                      height: "100%",
                      minHeight: "80px",
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: isSmallMobile ? 0.5 : 0.75, 
                        fontSize: isSmallMobile ? "0.65rem" : isMobile ? "0.7rem" : "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Mobile Number
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: isSmallMobile ? "0.8125rem" : isMobile ? "0.875rem" : "0.9375rem",
                        color: "text.primary",
                      }}
                    >
                      {userDetails.data.mobile_number || "-"}
                    </Typography>
                  </Box>
                </Grid>

                {/* National ID Number - Only for Students */}
                {userDetails.data.role?.roleType === "student" && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                        borderRadius: 1.5,
                        backgroundColor: "rgba(59, 130, 246, 0.05)",
                        border: "1px solid rgba(59, 130, 246, 0.15)",
                        height: "100%",
                        minHeight: "80px",
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: isSmallMobile ? 0.5 : 0.75, 
                          fontSize: isSmallMobile ? "0.65rem" : isMobile ? "0.7rem" : "0.75rem",
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        National ID Number
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: isSmallMobile ? "0.8125rem" : isMobile ? "0.875rem" : "0.9375rem",
                          wordBreak: "break-word",
                          color: "text.primary",
                        }}
                      >
                        {userDetails.data.national_id_number || "-"}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Business Registration ID - Only for Employers */}
                {userDetails.data.role?.roleType === "employer" && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                        borderRadius: 1.5,
                        backgroundColor: "rgba(16, 185, 129, 0.05)",
                        border: "1px solid rgba(16, 185, 129, 0.15)",
                        height: "100%",
                        minHeight: "80px",
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: isSmallMobile ? 0.5 : 0.75, 
                          fontSize: isSmallMobile ? "0.65rem" : isMobile ? "0.7rem" : "0.75rem",
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Business Registration ID
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: isSmallMobile ? "0.8125rem" : isMobile ? "0.875rem" : "0.9375rem",
                          wordBreak: "break-word",
                          color: "text.primary",
                        }}
                      >
                        {userDetails.data.business_registration_id || "-"}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Preferred Location */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                      borderRadius: 1.5,
                      backgroundColor: "var(--theme-card-bg, #ffffff)",
                      border: "1px solid var(--theme-border, rgba(0, 0, 0, 0.08))",
                      boxShadow: "0 4px 10px rgba(15, 23, 42, 0.04)",
                      height: "100%",
                      minHeight: "80px",
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: isSmallMobile ? 0.5 : 0.75, 
                        fontSize: isSmallMobile ? "0.65rem" : isMobile ? "0.7rem" : "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Preferred Location
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: isSmallMobile ? "0.8125rem" : isMobile ? "0.875rem" : "0.9375rem",
                        color: "text.primary",
                      }}
                    >
                      {userDetails.data.preferred_location || "-"}
                    </Typography>
                  </Box>
                </Grid>
                {/* Verification Status */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                      borderRadius: 1.5,
                      backgroundColor: userDetails.data.email_verified
                        ? "var(--chip-verified-bg)"
                        : "var(--chip-unverified-bg)",
                      border: `1px solid ${
                        userDetails.data.email_verified
                          ? "var(--chip-verified-bg)"
                          : "var(--chip-unverified-bg)"
                      }`,
                      height: "100%",
                      minHeight: "80px",
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: isSmallMobile ? 0.5 : 0.75, 
                        fontSize: isSmallMobile ? "0.65rem" : isMobile ? "0.7rem" : "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Email Verification
                    </Typography>
                    <Chip
                      icon={userDetails.data.email_verified ? (
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: "#065f46",
                          }}
                        />
                      ) : undefined}
                      label={userDetails.data.email_verified ? "Verified" : "Not Verified"}
                      size="small"
                      sx={{
                        bgcolor: userDetails.data.email_verified ? "var(--chip-verified-bg)" : "var(--chip-unverified-bg)",
                        color: userDetails.data.email_verified ? "var(--chip-verified-text)" : "var(--chip-unverified-text)",
                        fontSize: isSmallMobile ? "0.65rem" : isMobile ? "0.7rem" : "0.75rem",
                        height: isSmallMobile ? "22px" : isMobile ? "24px" : "26px",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                      borderRadius: 1.5,
                      backgroundColor: userDetails.data.phone_verified
                        ? "var(--chip-verified-bg)"
                        : "var(--chip-unverified-bg)",
                      border: `1px solid ${
                        userDetails.data.phone_verified
                          ? "var(--chip-verified-bg)"
                          : "var(--chip-unverified-bg)"
                      }`,
                      height: "100%",
                      minHeight: "80px",
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: isSmallMobile ? 0.5 : 0.75, 
                        fontSize: isSmallMobile ? "0.65rem" : isMobile ? "0.7rem" : "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Phone Verification
                    </Typography>
                    <Chip
                      icon={userDetails.data.phone_verified ? (
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: "#065f46",
                          }}
                        />
                      ) : undefined}
                      label={userDetails.data.phone_verified ? "Verified" : "Not Verified"}
                      size="small"
                      sx={{
                        bgcolor: userDetails.data.phone_verified ? "var(--chip-verified-bg)" : "var(--chip-unverified-bg)",
                        color: userDetails.data.phone_verified ? "var(--chip-verified-text)" : "var(--chip-unverified-text)",
                        fontSize: isSmallMobile ? "0.65rem" : isMobile ? "0.7rem" : "0.75rem",
                        height: isSmallMobile ? "22px" : isMobile ? "24px" : "26px",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Grid>

                {/* Account Dates */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                      borderRadius: 1.5,
                      backgroundColor: "var(--theme-card-bg, #ffffff)",
                      border: "1px solid var(--theme-border, rgba(0, 0, 0, 0.08))",
                      boxShadow: "0 4px 10px rgba(15, 23, 42, 0.04)",
                      height: "100%",
                      minHeight: "80px",
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: isSmallMobile ? 0.5 : 0.75, 
                        fontSize: isSmallMobile ? "0.65rem" : isMobile ? "0.7rem" : "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Account Created
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: isSmallMobile ? "0.8125rem" : isMobile ? "0.875rem" : "0.9375rem",
                        color: "text.primary",
                      }}
                    >
                      {userDetails.data.created_at
                        ? new Date(userDetails.data.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "-"}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: isSmallMobile ? "0.625rem" : isMobile ? "0.65rem" : "0.7rem",
                        color: "text.secondary",
                        mt: 0.5,
                        display: "block",
                      }}
                    >
                      {userDetails.data.created_at
                        ? new Date(userDetails.data.created_at).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                      borderRadius: 1.5,
                      backgroundColor: "var(--theme-card-bg, #ffffff)",
                      border: "1px solid var(--theme-border, rgba(0, 0, 0, 0.08))",
                      boxShadow: "0 4px 10px rgba(15, 23, 42, 0.04)",
                      height: "100%",
                      minHeight: "80px",
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: isSmallMobile ? 0.5 : 0.75, 
                        fontSize: isSmallMobile ? "0.65rem" : isMobile ? "0.7rem" : "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Last Updated
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: isSmallMobile ? "0.8125rem" : isMobile ? "0.875rem" : "0.9375rem",
                        color: "text.primary",
                      }}
                    >
                      {userDetails.data.updated_at
                        ? new Date(userDetails.data.updated_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "-"}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: isSmallMobile ? "0.625rem" : isMobile ? "0.65rem" : "0.7rem",
                        color: "text.secondary",
                        mt: 0.5,
                        display: "block",
                      }}
                    >
                      {userDetails.data.updated_at
                        ? new Date(userDetails.data.updated_at).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography>User details not found</Typography>
          )}
        </DialogContent>
        <DialogActions 
          sx={{ 
            px: isSmallMobile ? 1.5 : isMobile ? 2 : 2.5, 
            pb: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
            pt: isSmallMobile ? 1 : isMobile ? 1.25 : 1.5,
            flexDirection: isMobile ? "column" : "row",
            gap: isSmallMobile ? 0.75 : isMobile ? 1 : 0,
            borderTop: isMobile ? "1px solid rgba(0, 0, 0, 0.12)" : "none",
            position: isMobile ? "sticky" : "relative",
            bottom: 0,
            backgroundColor: "var(--theme-card-bg, #ffffff)",
            zIndex: 1,
            boxShadow: isMobile ? "0 -2px 8px rgba(0, 0, 0, 0.1)" : "none",
            flexShrink: 0,
          }}
        >
          <Button 
            onClick={handleCloseViewDialog} 
            variant="outlined" 
            color="inherit"
            fullWidth={isMobile}
            size={isSmallMobile ? "medium" : isMobile ? "large" : "medium"}
            sx={{
              minHeight: isSmallMobile ? "42px" : isMobile ? "48px" : "36px",
              fontSize: isSmallMobile ? "0.875rem" : isMobile ? "0.9375rem" : "0.875rem",
              fontWeight: isMobile ? 500 : 400,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <AddUserDialog
        open={addUserDialogOpen}
        onClose={() => setAddUserDialogOpen(false)}
      />

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            m: isMobile ? 0 : 2,
            maxHeight: isMobile ? "100vh" : "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
            borderBottom: "1px solid var(--theme-border, #e5e7eb)",
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "var(--theme-text-primary, #111827)" }}
          >
            {userDetails?.data?.role?.roleType === "student" ? t("pages.users.editStudent") : userDetails?.data?.role?.roleType === "employer" ? t("pages.users.editEmployer") : t("pages.users.editUser")}
          </Typography>
          <IconButton
            onClick={handleCloseEditDialog}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": { backgroundColor: "action.hover" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 3 } }}>
          {isLoadingUserDetails ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: isMobile ? 2 : 4 }}>
              <CircularProgress size={isMobile ? 32 : 40} />
            </Box>
          ) : userDetails?.data ? (
            <Box>
              {/* User Info Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
                  mb: isSmallMobile ? 1.5 : isMobile ? 2 : 3,
                  p: isSmallMobile ? 1.5 : isMobile ? 2 : 2.5,
                  borderRadius: 2,
                  backgroundColor: "rgba(147, 51, 234, 0.06)",
                  border: "1px solid rgba(147, 51, 234, 0.18)",
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: userDetails.data.role?.roleType === "student" ? "#3b82f6" : "#10b981",
                    width: isSmallMobile ? 48 : isMobile ? 56 : 64,
                    height: isSmallMobile ? 48 : isMobile ? 56 : 64,
                    fontSize: isSmallMobile ? "1rem" : isMobile ? "1.25rem" : "1.5rem",
                    fontWeight: 600,
                  }}
                >
                  {userDetails.data.full_name?.charAt(0) || "U"}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant={isSmallMobile ? "body2" : isMobile ? "body1" : "subtitle1"}
                    sx={{
                      fontWeight: 600,
                      color: "var(--theme-text-primary, #111827)",
                      fontSize: isSmallMobile ? "0.875rem" : isMobile ? "0.9375rem" : "1rem",
                    }}
                  >
                    {userDetails.data.full_name}
                  </Typography>
                  <Chip
                    label={userDetails.data.role?.roleType === "student" ? "Student" : "Employer"}
                    size="small"
                    sx={{
                      bgcolor: userDetails.data.role?.roleType === "student" ? "var(--chip-role-student-bg)" : "var(--chip-role-employer-bg)",
                      color: userDetails.data.role?.roleType === "student" ? "var(--chip-role-student-text)" : "var(--chip-role-employer-text)",
                      fontWeight: 600,
                      mt: 0.5,
                      fontSize: isSmallMobile ? "0.65rem" : isMobile ? "0.7rem" : "0.75rem",
                      height: isSmallMobile ? "20px" : isMobile ? "22px" : "24px",
                    }}
                  />
                </Box>
              </Box>

              <Grid container spacing={isSmallMobile ? 2 : isMobile ? 2.5 : 3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={editFormData.full_name || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, full_name: e.target.value })
                    }
                    variant="outlined"
                    size={isSmallMobile ? "small" : isMobile ? "small" : "medium"}
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: isSmallMobile ? "0.875rem" : isMobile ? "0.875rem" : "1rem",
                        minHeight: isSmallMobile ? "44px" : isMobile ? "48px" : "56px",
                        backgroundColor: "var(--theme-input-bg, #ffffff)",
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: isSmallMobile ? "0.75rem" : isMobile ? "0.8125rem" : "0.875rem",
                      },
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={editFormData.email || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, email: e.target.value })
                    }
                    variant="outlined"
                    size={isSmallMobile ? "small" : isMobile ? "small" : "medium"}
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: isSmallMobile ? "0.875rem" : isMobile ? "0.875rem" : "1rem",
                        minHeight: isSmallMobile ? "44px" : isMobile ? "48px" : "56px",
                        backgroundColor: "var(--theme-input-bg, #ffffff)",
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: isSmallMobile ? "0.75rem" : isMobile ? "0.8125rem" : "0.875rem",
                      },
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Mobile Number"
                    value={editFormData.mobile_number || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, mobile_number: e.target.value })
                    }
                    variant="outlined"
                    size={isSmallMobile ? "small" : isMobile ? "small" : "medium"}
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: isSmallMobile ? "0.875rem" : isMobile ? "0.875rem" : "1rem",
                        minHeight: isSmallMobile ? "44px" : isMobile ? "48px" : "56px",
                        backgroundColor: "var(--theme-input-bg, #ffffff)",
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: isSmallMobile ? "0.75rem" : isMobile ? "0.8125rem" : "0.875rem",
                      },
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  />
                </Grid>
                {/* Show National ID only for Students */}
                {userDetails.data.role?.roleType === "student" && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="National ID Number"
                      value={editFormData.national_id_number || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, national_id_number: e.target.value })
                      }
                      variant="outlined"
                      size={isSmallMobile ? "small" : isMobile ? "small" : "medium"}
                      sx={{
                        "& .MuiInputBase-root": {
                          fontSize: isSmallMobile ? "0.875rem" : isMobile ? "0.875rem" : "1rem",
                          minHeight: isSmallMobile ? "44px" : isMobile ? "48px" : "56px",
                          backgroundColor: "var(--theme-input-bg, #ffffff)",
                        },
                        "& .MuiInputLabel-root": {
                          fontSize: isSmallMobile ? "0.75rem" : isMobile ? "0.8125rem" : "0.875rem",
                        },
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: "primary.main",
                          },
                        },
                      }}
                    />
                  </Grid>
                )}
                {/* Show Business Registration ID only for Employers */}
                {userDetails.data.role?.roleType === "employer" && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Business Registration ID"
                      value={editFormData.business_registration_id || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, business_registration_id: e.target.value })
                      }
                      variant="outlined"
                      size={isSmallMobile ? "small" : isMobile ? "small" : "medium"}
                      sx={{
                        "& .MuiInputBase-root": {
                          fontSize: isSmallMobile ? "0.875rem" : isMobile ? "0.875rem" : "1rem",
                          minHeight: isSmallMobile ? "44px" : isMobile ? "48px" : "56px",
                          backgroundColor: "var(--theme-input-bg, #ffffff)",
                        },
                        "& .MuiInputLabel-root": {
                          fontSize: isSmallMobile ? "0.75rem" : isMobile ? "0.8125rem" : "0.875rem",
                        },
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: "primary.main",
                          },
                        },
                      }}
                    />
                  </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Preferred Location"
                    value={editFormData.preferred_location || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, preferred_location: e.target.value })
                    }
                    variant="outlined"
                    size={isSmallMobile ? "small" : isMobile ? "small" : "medium"}
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: isSmallMobile ? "0.875rem" : isMobile ? "0.875rem" : "1rem",
                        minHeight: isSmallMobile ? "44px" : isMobile ? "48px" : "56px",
                        backgroundColor: "var(--theme-input-bg, #ffffff)",
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: isSmallMobile ? "0.75rem" : isMobile ? "0.8125rem" : "0.875rem",
                      },
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography>User details not found</Typography>
          )}
        </DialogContent>
        <DialogActions 
          sx={{ 
            px: isSmallMobile ? 1.5 : isMobile ? 2 : 3, 
            pb: isSmallMobile ? 1.5 : isMobile ? 2 : 2,
            pt: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
            flexDirection: isMobile ? "column-reverse" : "row",
            gap: isSmallMobile ? 0.75 : isMobile ? 1 : 0,
            borderTop: isMobile ? "1px solid rgba(0, 0, 0, 0.12)" : "none",
            position: isMobile ? "sticky" : "relative",
            bottom: 0,
            backgroundColor: "var(--theme-card-bg, #ffffff)",
            zIndex: 1,
            boxShadow: isMobile ? "0 -2px 8px rgba(0, 0, 0, 0.1)" : "none",
          }}
        >
          <Button 
            onClick={handleCloseEditDialog}
            variant="outlined"
            color="inherit"
            fullWidth={isMobile}
            size={isSmallMobile ? "medium" : isMobile ? "large" : "medium"}
            sx={{
              minHeight: isSmallMobile ? "42px" : isMobile ? "48px" : "36px",
              fontSize: isSmallMobile ? "0.875rem" : isMobile ? "0.9375rem" : "0.875rem",
              fontWeight: isMobile ? 500 : 400,
            }}
          >
            {t("pages.users.cancel")}
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            color="primary"
            disabled={isUpdating || isLoadingUserDetails}
            startIcon={isUpdating ? <CircularProgress size={isSmallMobile ? 16 : isMobile ? 18 : 20} /> : <EditIcon />}
            fullWidth={isMobile}
            size={isSmallMobile ? "medium" : isMobile ? "large" : "medium"}
            sx={{
              minHeight: isSmallMobile ? "42px" : isMobile ? "48px" : "36px",
              fontSize: isSmallMobile ? "0.875rem" : isMobile ? "0.9375rem" : "0.875rem",
              fontWeight: isMobile ? 600 : 500,
            }}
          >
            {isUpdating ? t("pages.users.saving") : t("pages.users.saveChanges")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth={isSmallMobile ? "xs" : isMobile ? "sm" : "sm"}
        fullWidth={false}
        fullScreen={isMobile}
        scroll="paper"
        PaperProps={{
          sx: {
            m: isMobile ? 0 : isSmallMobile ? 0.5 : 1,
            width: isMobile ? "100%" : isSmallMobile ? "90%" : "480px",
            maxWidth: isMobile ? "100%" : isSmallMobile ? "90%" : "480px",
            maxHeight: isMobile ? "100vh" : isSmallMobile ? "90vh" : "85vh",
            height: isMobile ? "100vh" : "auto",
            borderRadius: isMobile ? 0 : isSmallMobile ? 1 : 2,
            marginLeft: isMobile ? 0 : "auto",
            marginRight: isMobile ? 0 : isSmallMobile ? "8px" : "16px",
            marginTop: isMobile ? 0 : isSmallMobile ? "8px" : "16px",
            marginBottom: isMobile ? 0 : isSmallMobile ? "8px" : "16px",
          },
        }}
        sx={{
          "& .MuiDialog-container": {
            alignItems: isMobile ? "flex-end" : "flex-start",
            justifyContent: isMobile ? "center" : "flex-end",
            padding: isSmallMobile ? "4px" : isMobile ? "8px" : "8px",
          },
          "& .MuiDialogContent-root": {
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            padding: isSmallMobile ? "10px" : isMobile ? "12px" : "16px",
          },
        }}
      >
        <DialogTitle 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            gap: 0.75,
            px: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
            py: isSmallMobile ? 0.75 : isMobile ? 1 : 1.5,
            fontSize: isSmallMobile ? "0.8125rem" : isMobile ? "0.9375rem" : "1rem",
            position: isMobile ? "sticky" : "relative",
            top: 0,
            backgroundColor: "var(--theme-card-bg, #ffffff)",
            zIndex: 2,
            borderBottom: isMobile ? "1px solid rgba(0, 0, 0, 0.12)" : "none",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flex: 1 }}>
            <DeleteIcon 
              color="error" 
              fontSize={isSmallMobile ? "small" : isMobile ? "small" : "medium"}
              sx={{ fontSize: isSmallMobile ? "16px" : isMobile ? "18px" : "20px" }}
            />
            <Typography 
              variant={isSmallMobile ? "body2" : isMobile ? "body1" : "subtitle1"} 
              component="span"
              sx={{ 
                fontWeight: 600,
                fontSize: isSmallMobile ? "0.8125rem" : isMobile ? "0.9375rem" : "1rem",
              }}
            >
              {t("pages.users.deleteUser")}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseDeleteDialog}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                color: "text.primary",
              },
              width: isSmallMobile ? 24 : isMobile ? 28 : 32,
              height: isSmallMobile ? 24 : isMobile ? 28 : 32,
              position: "absolute",
              right: isSmallMobile ? 8 : isMobile ? 12 : 16,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <CloseIcon 
              fontSize={isSmallMobile ? "small" : isMobile ? "small" : "medium"}
              sx={{ fontSize: isSmallMobile ? "16px" : isMobile ? "18px" : "20px" }}
            />
          </IconButton>
        </DialogTitle>
        <DialogContent 
          sx={{ 
            px: isSmallMobile ? 1 : isMobile ? 1.5 : 2, 
            pb: isSmallMobile ? 0.75 : isMobile ? 1 : 1.5,
            pt: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
            overflowY: "auto",
            maxHeight: isMobile ? "calc(100vh - 180px)" : "none",
            "&::-webkit-scrollbar": {
              width: isMobile ? "4px" : "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              borderRadius: "4px",
            },
          }}
        >
          <Typography 
            variant={isSmallMobile ? "body2" : isMobile ? "body1" : "body1"} 
            sx={{ 
              mb: isSmallMobile ? 1.5 : isMobile ? 2 : 2,
              fontSize: isSmallMobile ? "0.8125rem" : isMobile ? "0.875rem" : "1rem",
              lineHeight: 1.6,
            }}
          >
            {t("pages.users.deleteConfirm")} <strong>{userToDelete?.name}</strong>?
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
              mt: isSmallMobile ? 1.5 : isMobile ? 2 : 2,
              p: isSmallMobile ? 1.5 : isMobile ? 2 : 2,
              bgcolor: "#fee2e2",
              borderRadius: isSmallMobile ? 1.5 : 2,
            }}
          >
            <CircularProgress 
              size={isSmallMobile ? 20 : isMobile ? 22 : 24} 
              thickness={4}
              sx={{ color: "#ef4444" }}
            />
            <Typography 
              variant={isSmallMobile ? "caption" : isMobile ? "body2" : "body2"} 
              color="error" 
              fontWeight={600}
              sx={{
                fontSize: isSmallMobile ? "0.7rem" : isMobile ? "0.75rem" : "0.875rem",
              }}
            >
              {t("pages.users.autoDeleting", { count: countdown })}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions 
          sx={{ 
            px: isSmallMobile ? 1 : isMobile ? 1.5 : 2, 
            pb: isSmallMobile ? 1 : isMobile ? 1.5 : 1.5,
            pt: isSmallMobile ? 0.75 : isMobile ? 1 : 1.5,
            flexDirection: isMobile ? "column-reverse" : "row",
            gap: isSmallMobile ? 0.5 : isMobile ? 0.75 : 0,
            borderTop: isMobile ? "1px solid rgba(0, 0, 0, 0.12)" : "none",
            position: isMobile ? "sticky" : "relative",
            bottom: 0,
            backgroundColor: "var(--theme-card-bg, #ffffff)",
            zIndex: 1,
            boxShadow: isMobile ? "0 -2px 8px rgba(0, 0, 0, 0.1)" : "none",
          }}
        >
          <Button
            onClick={handleCloseDeleteDialog}
            variant="outlined"
            color="inherit"
            fullWidth={isMobile}
            size={isSmallMobile ? "small" : isMobile ? "medium" : "small"}
            sx={{
              minHeight: isSmallMobile ? "36px" : isMobile ? "40px" : "32px",
              fontSize: isSmallMobile ? "0.8125rem" : isMobile ? "0.875rem" : "0.8125rem",
              fontWeight: isMobile ? 500 : 400,
            }}
          >
            {t("pages.users.cancel")}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon sx={{ fontSize: isSmallMobile ? "14px" : isMobile ? "16px" : "18px" }} />}
            fullWidth={isMobile}
            size={isSmallMobile ? "small" : isMobile ? "medium" : "small"}
            sx={{
              minHeight: isSmallMobile ? "36px" : isMobile ? "40px" : "32px",
              fontSize: isSmallMobile ? "0.8125rem" : isMobile ? "0.875rem" : "0.8125rem",
              fontWeight: isMobile ? 600 : 500,
            }}
          >
            {t("pages.users.confirmDelete")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AllUsers;
