import React, { useState, useEffect } from "react";
import { BriefcaseIcon } from "@heroicons/react/24/outline";
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
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  // useGetAllEmployersQuery,
  useGetUserByIdQuery,
  useUpdateUserByIdMutation,
  useGetAllUsersQuery,
} from "../../services/api/usersApi";
import type { UserProfile } from "../../services/api/profileApi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface Employer {
  index: number;
  id: number;
  userId: string; // Store the actual user_id (UUID) for API calls
  name: string;
  contact: string;
  jobsPosted: number;
  activeJobs: number;
  verified: boolean;
}

const Employers: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState(""); // Add search state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [employerToView, setEmployerToView] = useState<Employer | null>(null);
  const [employerToEdit, setEmployerToEdit] = useState<Employer | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserByIdMutation();

  const { data, isLoading, isError } = useGetAllUsersQuery({
    page: page + 1,
    limit: limit,
    type: "Employer",
    search: searchQuery, // Pass search query to API
  });

  // Fetch full employer details when viewing/editing
  const { data: employerDetails, isLoading: isLoadingEmployerDetails } =
    useGetUserByIdQuery(
      employerToView?.userId || employerToEdit?.userId || "",
      { skip: !employerToView && !employerToEdit },
    );

  // Update form data when employer details are loaded
  useEffect(() => {
    if (employerDetails?.data && employerToEdit) {
      setEditFormData({
        full_name: employerDetails.data.full_name,
        email: employerDetails.data.email,
        mobile_number: employerDetails.data.mobile_number,
        business_registration_id: employerDetails.data.business_registration_id,
        preferred_location: employerDetails.data.preferred_location,
      });
    }
  }, [employerDetails, employerToEdit]);

  // Map API user profile to Employer row
  const mapEmployer = (user: UserProfile, index: number): Employer => ({
    index: page * limit + index + 1,
    id: Number(user.user_id),
    userId: user.user_id, // Store the UUID string for API calls
    name: user.full_name,
    contact: user.email,
    jobsPosted: 0,
    activeJobs: 0,
    verified: true,
  });

  const employers: Employer[] = (data?.data || []).map((user, index) =>
    mapEmployer(user, index),
  );
  const totalCount = data?.pagination?.total || employers.length;

  const columns: Column<Employer>[] = [
    {
      id: "index",
      label: "#",
      minWidth: 60,
      align: "center",
      sortable: false,
      format: (value) => (
        <Typography
          sx={{
            fontWeight: 500,
            color: "var(--theme-text-secondary, #6b7280)",
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      id: "name",
      label: t("pages.users.company"),
      minWidth: 200,
      format: (value, row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: "#10b981",
              width: 40,
              height: 40,
              fontSize: "1.2rem",
              fontWeight: 700,
              borderRadius: "8px",
            }}
          >
            {row.name.charAt(0)}
          </Avatar>
          <Typography
            sx={{
              fontWeight: 600,
              color: "var(--theme-text-primary, #111827)",
            }}
          >
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: "contact",
      label: t("pages.users.contact"),
      minWidth: 200,
    },
    {
      id: "jobsPosted",
      label: t("pages.users.jobsPosted"),
      minWidth: 120,
      align: "center",
      format: (value) => (
        <Chip
          label={value}
          size="small"
          sx={{
            bgcolor: "var(--chip-role-student-bg)",
            color: "var(--chip-role-student-text)",
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      id: "activeJobs",
      label: t("pages.users.activeJobs"),
      minWidth: 120,
      align: "center",
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
      id: "verified",
      label: t("pages.users.verified"),
      minWidth: 120,
      format: (value) =>
        value ? (
          <Chip
            label={t("pages.users.verifiedLabel")}
            size="small"
            sx={{
              bgcolor: "var(--chip-verified-bg)",
              color: "var(--chip-verified-text)",
              fontWeight: 600,
            }}
          />
        ) : (
          <Chip
            label={t("pages.users.pending")}
            size="small"
            sx={{
              bgcolor: "var(--chip-status-pending-bg)",
              color: "var(--chip-status-pending-text)",
              fontWeight: 600,
            }}
          />
        ),
    },
  ];

  const handleViewClick = (row: Employer) => {
    setEmployerToView(row);
    setViewDialogOpen(true);
  };

  const handleEditClick = (row: Employer) => {
    setEmployerToEdit(row);
    setEditDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setEmployerToView(null);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEmployerToEdit(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    if (!employerToEdit) return;

    try {
      await updateUser({
        id: employerToEdit.userId,
        data: editFormData,
      }).unwrap();
      toast.success(t("pages.users.employerUpdatedSuccess"));
      handleCloseEditDialog();
    } catch (error: any) {
      toast.error(
        error?.data?.message || t("pages.users.failedToUpdateEmployer"),
      );
    }
  };

  const actions: TableAction<Employer>[] = [
    {
      label: t("pages.users.viewProfile"),
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
  ];

  return (
    <div className="theme-page-bg space-y-6 animate-fadeIn min-h-full p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-[var(--theme-text-primary)] flex items-center gap-2 md:gap-3">
            <BriefcaseIcon className="h-8 w-8 md:h-10 md:w-10 text-green-600 dark:text-green-400" />
            {t("pages.users.employersPageTitle")}
          </h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-[var(--theme-text-secondary)] mt-2">
            {t("pages.users.employersSubtitle")}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-md border border-green-200">
          <p className="text-sm text-green-700 font-medium">
            {t("pages.users.totalEmployers")}
          </p>
          <p className="text-3xl font-bold text-green-900 mt-2">
            {isLoading ? "…" : totalCount}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-md border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">
            {t("pages.users.activeJobsPosted")}
          </p>
          <p className="text-3xl font-bold text-blue-900 mt-2">1,480</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-md border border-purple-200">
          <p className="text-sm text-purple-700 font-medium">
            {t("pages.users.verifiedEmployers")}
          </p>
          <p className="text-3xl font-bold text-purple-900 mt-2">1,120</p>
        </div>
      </div>

      {/* Employers Table */}
      <CustomTable
        columns={columns}
        data={employers}
        actions={actions}
        loading={isLoading}
        emptyMessage={
          isError
            ? t("pages.users.failedToLoadEmployers")
            : totalCount === 0
              ? t("pages.users.noEmployersPresent")
              : t("pages.users.noEmployersFound")
        }
        searchable={true}
        searchPlaceholder={t("pages.users.searchEmployers")}
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

      {/* View Employer Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        scroll="paper"
        PaperProps={{
          sx: {
            m: isMobile ? 0 : "48px auto",
            width: isMobile ? "100%" : "auto",
            maxWidth: isMobile ? "100%" : "500px",
            maxHeight: isMobile ? "100vh" : "calc(100vh - 96px)",
            height: isMobile ? "100vh" : "auto",
            borderRadius: isMobile ? 0 : 1,
            display: "flex",
            flexDirection: "column",
          },
        }}
        sx={{
          "& .MuiDialog-container": {
            alignItems: isMobile ? "flex-end" : "center",
            padding: isMobile ? 0 : "24px",
          },
          "& .MuiDialogContent-root": {
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            padding: isSmallMobile ? "12px" : isMobile ? "16px" : "20px",
            flex: "1 1 auto",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              borderRadius: "4px",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: isSmallMobile ? 1.5 : isMobile ? 2 : 3,
            py: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
            fontSize: isSmallMobile
              ? "0.875rem"
              : isMobile
                ? "1rem"
                : "1.25rem",
            position: isMobile ? "sticky" : "relative",
            top: 0,
            backgroundColor: "var(--theme-card-bg, #ffffff)",
            zIndex: 2,
            borderBottom: isMobile ? "1px solid rgba(0, 0, 0, 0.12)" : "none",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            <ViewIcon
              color="primary"
              fontSize={
                isSmallMobile ? "small" : isMobile ? "medium" : "medium"
              }
              sx={{
                fontSize: isSmallMobile ? "18px" : isMobile ? "20px" : "24px",
              }}
            />
            <Typography
              variant={isSmallMobile ? "body1" : isMobile ? "subtitle1" : "h6"}
              component="span"
              sx={{
                fontWeight: 600,
                fontSize: isSmallMobile
                  ? "0.875rem"
                  : isMobile
                    ? "1rem"
                    : "1.25rem",
              }}
            >
              {t("pages.users.employerDetails")}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseViewDialog}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                color: "text.primary",
              },
              width: isSmallMobile ? 28 : isMobile ? 32 : 36,
              height: isSmallMobile ? 28 : isMobile ? 32 : 36,
              position: "absolute",
              right: isSmallMobile ? 8 : isMobile ? 12 : 16,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <CloseIcon
              fontSize={
                isSmallMobile ? "small" : isMobile ? "medium" : "medium"
              }
              sx={{
                fontSize: isSmallMobile ? "18px" : isMobile ? "20px" : "24px",
              }}
            />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            px: isSmallMobile ? 1.5 : isMobile ? 2 : 2.5,
            pb: isSmallMobile ? 1 : isMobile ? 1.25 : 1.5,
            pt: isSmallMobile ? 1.25 : isMobile ? 1.5 : 2,
          }}
        >
          {isLoadingEmployerDetails ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                p: isMobile ? 2 : 4,
              }}
            >
              <CircularProgress size={isMobile ? 32 : 40} />
            </Box>
          ) : employerDetails?.data ? (
            <Box>
              {/* Employer Profile Header Card */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
                  mb: isSmallMobile ? 1.5 : isMobile ? 2 : 2,
                  p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                  borderRadius: 1.5,
                  backgroundColor: "var(--chip-role-employer-bg)",
                  border: "1px solid var(--chip-role-employer-bg)",
                  flexDirection: isMobile ? "column" : "row",
                  textAlign: isMobile ? "center" : "left",
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "#10b981",
                    width: isSmallMobile ? 48 : isMobile ? 56 : 64,
                    height: isSmallMobile ? 48 : isMobile ? 56 : 64,
                    fontSize: isSmallMobile
                      ? "1.25rem"
                      : isMobile
                        ? "1.5rem"
                        : "1.75rem",
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
                    borderRadius: "8px",
                  }}
                >
                  {employerDetails.data.full_name?.charAt(0) || "E"}
                </Avatar>
                <Box sx={{ flex: 1, width: isMobile ? "100%" : "auto" }}>
                  <Typography
                    variant={
                      isSmallMobile
                        ? "subtitle2"
                        : isMobile
                          ? "subtitle1"
                          : "h6"
                    }
                    sx={{
                      fontWeight: 700,
                      fontSize: isSmallMobile
                        ? "0.9375rem"
                        : isMobile
                          ? "1.125rem"
                          : "1.25rem",
                      mb: 0.5,
                      color: "text.primary",
                    }}
                  >
                    {employerDetails.data.full_name}
                  </Typography>
                  <Chip
                    label={t("pages.users.employer")}
                    size="small"
                    sx={{
                      bgcolor: "var(--chip-role-employer-bg)",
                      color: "var(--chip-role-employer-text)",
                      fontWeight: 600,
                      fontSize: isSmallMobile
                        ? "0.65rem"
                        : isMobile
                          ? "0.7rem"
                          : "0.75rem",
                      height: isSmallMobile
                        ? "20px"
                        : isMobile
                          ? "22px"
                          : "24px",
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
                      border:
                        "1px solid var(--theme-border, rgba(0, 0, 0, 0.08))",
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
                        fontSize: isSmallMobile
                          ? "0.65rem"
                          : isMobile
                            ? "0.7rem"
                            : "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {t("pages.users.emailAddress")}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: isSmallMobile
                          ? "0.8125rem"
                          : isMobile
                            ? "0.875rem"
                            : "0.9375rem",
                        wordBreak: "break-word",
                        color: "text.primary",
                      }}
                    >
                      {employerDetails.data.email}
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
                      border:
                        "1px solid var(--theme-border, rgba(0, 0, 0, 0.08))",
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
                        fontSize: isSmallMobile
                          ? "0.65rem"
                          : isMobile
                            ? "0.7rem"
                            : "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {t("pages.users.mobileNumber")}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: isSmallMobile
                          ? "0.8125rem"
                          : isMobile
                            ? "0.875rem"
                            : "0.9375rem",
                        color: "text.primary",
                      }}
                    >
                      {employerDetails.data.mobile_number || "-"}
                    </Typography>
                  </Box>
                </Grid>

                {/* Business Registration ID */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                      borderRadius: 1.5,
                      backgroundColor: "var(--theme-card-bg, #ffffff)",
                      border:
                        "1px solid var(--theme-border, rgba(0, 0, 0, 0.08))",
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
                        fontSize: isSmallMobile
                          ? "0.65rem"
                          : isMobile
                            ? "0.7rem"
                            : "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {t("pages.users.businessRegistrationId")}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: isSmallMobile
                          ? "0.8125rem"
                          : isMobile
                            ? "0.875rem"
                            : "0.9375rem",
                        color: "text.primary",
                      }}
                    >
                      {employerDetails.data.business_registration_id || "-"}
                    </Typography>
                  </Box>
                </Grid>

                {/* Preferred Location */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                      borderRadius: 1.5,
                      backgroundColor: "rgba(0, 0, 0, 0.02)",
                      border: "1px solid rgba(0, 0, 0, 0.08)",
                      height: "100%",
                      minHeight: "80px",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: isSmallMobile ? 0.5 : 0.75,
                        fontSize: isSmallMobile
                          ? "0.65rem"
                          : isMobile
                            ? "0.7rem"
                            : "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {t("pages.users.preferredLocation")}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: isSmallMobile
                          ? "0.8125rem"
                          : isMobile
                            ? "0.875rem"
                            : "0.9375rem",
                        color: "text.primary",
                      }}
                    >
                      {employerDetails.data.preferred_location || "-"}
                    </Typography>
                  </Box>
                </Grid>

                {/* Email Verification */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                      borderRadius: 1.5,
                      backgroundColor: employerDetails.data.email_verified
                        ? "var(--chip-verified-bg)"
                        : "var(--chip-unverified-bg)",
                      border: `1px solid ${
                        employerDetails.data.email_verified
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
                        fontSize: isSmallMobile
                          ? "0.65rem"
                          : isMobile
                            ? "0.7rem"
                            : "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Email Verification
                    </Typography>
                    <Chip
                      icon={
                        employerDetails.data.email_verified ? (
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "#065f46",
                            }}
                          />
                        ) : undefined
                      }
                      label={
                        employerDetails.data.email_verified
                          ? t("pages.users.verified")
                          : t("pages.users.notVerified")
                      }
                      size="small"
                      sx={{
                        bgcolor: employerDetails.data.email_verified
                          ? "var(--chip-verified-bg)"
                          : "var(--chip-unverified-bg)",
                        color: employerDetails.data.email_verified
                          ? "var(--chip-verified-text)"
                          : "var(--chip-unverified-text)",
                        fontSize: isSmallMobile
                          ? "0.65rem"
                          : isMobile
                            ? "0.7rem"
                            : "0.75rem",
                        height: isSmallMobile
                          ? "22px"
                          : isMobile
                            ? "24px"
                            : "26px",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Grid>

                {/* Phone Verification */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                      borderRadius: 1.5,
                      backgroundColor: employerDetails.data.phone_verified
                        ? "var(--chip-verified-bg)"
                        : "var(--chip-unverified-bg)",
                      border: `1px solid ${
                        employerDetails.data.phone_verified
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
                        fontSize: isSmallMobile
                          ? "0.65rem"
                          : isMobile
                            ? "0.7rem"
                            : "0.75rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {t("pages.users.phoneVerification")}
                    </Typography>
                    <Chip
                      icon={
                        employerDetails.data.phone_verified ? (
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "#065f46",
                            }}
                          />
                        ) : undefined
                      }
                      label={
                        employerDetails.data.phone_verified
                          ? t("pages.users.verified")
                          : t("pages.users.notVerified")
                      }
                      size="small"
                      sx={{
                        bgcolor: employerDetails.data.phone_verified
                          ? "var(--chip-verified-bg)"
                          : "var(--chip-unverified-bg)",
                        color: employerDetails.data.phone_verified
                          ? "var(--chip-verified-text)"
                          : "var(--chip-unverified-text)",
                        fontSize: isSmallMobile
                          ? "0.65rem"
                          : isMobile
                            ? "0.7rem"
                            : "0.75rem",
                        height: isSmallMobile
                          ? "22px"
                          : isMobile
                            ? "24px"
                            : "26px",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Grid>

                {/* Account Created */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: isSmallMobile ? 1.25 : isMobile ? 1.5 : 1.75,
                      borderRadius: 1.5,
                      backgroundColor: "rgba(0, 0, 0, 0.02)",
                      border: "1px solid rgba(0, 0, 0, 0.08)",
                      height: "100%",
                      minHeight: "80px",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: isSmallMobile ? 0.5 : 0.75,
                        fontSize: isSmallMobile
                          ? "0.65rem"
                          : isMobile
                            ? "0.7rem"
                            : "0.75rem",
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
                        fontSize: isSmallMobile
                          ? "0.8125rem"
                          : isMobile
                            ? "0.875rem"
                            : "0.9375rem",
                        color: "text.primary",
                      }}
                    >
                      {employerDetails.data.created_at
                        ? new Date(
                            employerDetails.data.created_at,
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "-"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: isSmallMobile
                          ? "0.625rem"
                          : isMobile
                            ? "0.65rem"
                            : "0.7rem",
                        color: "text.secondary",
                        mt: 0.5,
                        display: "block",
                      }}
                    >
                      {employerDetails.data.created_at
                        ? new Date(
                            employerDetails.data.created_at,
                          ).toLocaleTimeString("en-US", {
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
            <Typography>Employer details not found</Typography>
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
              fontSize: isSmallMobile
                ? "0.875rem"
                : isMobile
                  ? "0.9375rem"
                  : "0.875rem",
              fontWeight: isMobile ? 500 : 400,
            }}
          >
            {t("pages.users.close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employer Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        scroll="paper"
        PaperProps={{
          sx: {
            m: isMobile ? 0 : 2,
            width: isMobile ? "100%" : "auto",
            maxWidth: isMobile ? "100%" : "600px",
            maxHeight: isMobile ? "100vh" : "90vh",
            height: isMobile ? "100vh" : "auto",
            borderRadius: isMobile ? 0 : 1,
            margin: isMobile ? 0 : "32px",
          },
        }}
        sx={{
          "& .MuiDialog-container": {
            alignItems: isMobile ? "flex-end" : "center",
          },
          "& .MuiDialogContent-root": {
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            padding: isSmallMobile ? "16px" : isMobile ? "20px" : "24px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: isSmallMobile ? 1.5 : isMobile ? 2 : 3,
            py: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
            fontSize: isSmallMobile
              ? "0.875rem"
              : isMobile
                ? "1rem"
                : "1.25rem",
            position: isMobile ? "sticky" : "relative",
            top: 0,
            backgroundColor: "var(--theme-card-bg, #ffffff)",
            zIndex: 2,
            borderBottom: isMobile ? "1px solid rgba(0, 0, 0, 0.12)" : "none",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            <EditIcon
              color="primary"
              fontSize={
                isSmallMobile ? "small" : isMobile ? "medium" : "medium"
              }
              sx={{
                fontSize: isSmallMobile ? "18px" : isMobile ? "20px" : "24px",
              }}
            />
            <Typography
              variant={isSmallMobile ? "body1" : isMobile ? "subtitle1" : "h6"}
              component="span"
              sx={{
                fontWeight: 600,
                fontSize: isSmallMobile
                  ? "0.875rem"
                  : isMobile
                    ? "1rem"
                    : "1.25rem",
              }}
            >
              {t("pages.users.editEmployer")}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseEditDialog}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                color: "text.primary",
              },
              width: isSmallMobile ? 28 : isMobile ? 32 : 36,
              height: isSmallMobile ? 28 : isMobile ? 32 : 36,
              position: "absolute",
              right: isSmallMobile ? 8 : isMobile ? 12 : 16,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <CloseIcon
              fontSize={
                isSmallMobile ? "small" : isMobile ? "medium" : "medium"
              }
              sx={{
                fontSize: isSmallMobile ? "18px" : isMobile ? "20px" : "24px",
              }}
            />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            px: isSmallMobile ? 1.5 : isMobile ? 2 : 3,
            pb: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
            pt: isSmallMobile ? 1.5 : isMobile ? 2 : 3,
            overflowY: "auto",
            maxHeight: isMobile ? "calc(100vh - 240px)" : "none",
            "&::-webkit-scrollbar": {
              width: isMobile ? "4px" : "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              borderRadius: "4px",
            },
          }}
        >
          {isLoadingEmployerDetails ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                p: isMobile ? 2 : 4,
              }}
            >
              <CircularProgress size={isMobile ? 32 : 40} />
            </Box>
          ) : employerDetails?.data ? (
            <Box>
              {/* Employer Info Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
                  mb: isSmallMobile ? 1.5 : isMobile ? 2 : 3,
                  p: isSmallMobile ? 1.5 : isMobile ? 2 : 2.5,
                  borderRadius: 2,
                  backgroundColor: "rgba(16, 185, 129, 0.05)",
                  border: "1px solid rgba(16, 185, 129, 0.1)",
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "#10b981",
                    width: isSmallMobile ? 48 : isMobile ? 56 : 64,
                    height: isSmallMobile ? 48 : isMobile ? 56 : 64,
                    fontSize: isSmallMobile
                      ? "1rem"
                      : isMobile
                        ? "1.25rem"
                        : "1.5rem",
                    fontWeight: 600,
                    borderRadius: "8px",
                  }}
                >
                  {employerDetails.data.full_name?.charAt(0) || "E"}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant={
                      isSmallMobile ? "body2" : isMobile ? "body1" : "subtitle1"
                    }
                    sx={{
                      fontWeight: 600,
                      color: "text.primary",
                      fontSize: isSmallMobile
                        ? "0.875rem"
                        : isMobile
                          ? "0.9375rem"
                          : "1rem",
                    }}
                  >
                    {employerDetails.data.full_name}
                  </Typography>
                  <Chip
                    label={t("pages.users.employer")}
                    size="small"
                    sx={{
                      bgcolor: "var(--chip-role-employer-bg)",
                      color: "var(--chip-role-employer-text)",
                      fontWeight: 600,
                      mt: 0.5,
                      fontSize: isSmallMobile
                        ? "0.65rem"
                        : isMobile
                          ? "0.7rem"
                          : "0.75rem",
                      height: isSmallMobile
                        ? "20px"
                        : isMobile
                          ? "22px"
                          : "24px",
                    }}
                  />
                </Box>
              </Box>

              <Grid container spacing={isSmallMobile ? 2 : isMobile ? 2.5 : 3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t("pages.users.fullName")}
                    value={editFormData.full_name || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        full_name: e.target.value,
                      })
                    }
                    variant="outlined"
                    size={
                      isSmallMobile ? "small" : isMobile ? "small" : "medium"
                    }
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: isSmallMobile
                          ? "0.875rem"
                          : isMobile
                            ? "0.875rem"
                            : "1rem",
                        minHeight: isSmallMobile
                          ? "44px"
                          : isMobile
                            ? "48px"
                            : "56px",
                        backgroundColor: "var(--theme-input-bg, #ffffff)",
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: isSmallMobile
                          ? "0.75rem"
                          : isMobile
                            ? "0.8125rem"
                            : "0.875rem",
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
                    label={t("pages.users.email")}
                    type="email"
                    value={editFormData.email || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      })
                    }
                    variant="outlined"
                    size={
                      isSmallMobile ? "small" : isMobile ? "small" : "medium"
                    }
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: isSmallMobile
                          ? "0.875rem"
                          : isMobile
                            ? "0.875rem"
                            : "1rem",
                        minHeight: isSmallMobile
                          ? "44px"
                          : isMobile
                            ? "48px"
                            : "56px",
                        backgroundColor: "var(--theme-input-bg, #ffffff)",
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: isSmallMobile
                          ? "0.75rem"
                          : isMobile
                            ? "0.8125rem"
                            : "0.875rem",
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
                      setEditFormData({
                        ...editFormData,
                        mobile_number: e.target.value,
                      })
                    }
                    variant="outlined"
                    size={
                      isSmallMobile ? "small" : isMobile ? "small" : "medium"
                    }
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: isSmallMobile
                          ? "0.875rem"
                          : isMobile
                            ? "0.875rem"
                            : "1rem",
                        minHeight: isSmallMobile
                          ? "44px"
                          : isMobile
                            ? "48px"
                            : "56px",
                        backgroundColor: "var(--theme-input-bg, #ffffff)",
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: isSmallMobile
                          ? "0.75rem"
                          : isMobile
                            ? "0.8125rem"
                            : "0.875rem",
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
                    label={t("pages.users.businessRegistrationId")}
                    value={editFormData.business_registration_id || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        business_registration_id: e.target.value,
                      })
                    }
                    variant="outlined"
                    size={
                      isSmallMobile ? "small" : isMobile ? "small" : "medium"
                    }
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: isSmallMobile
                          ? "0.875rem"
                          : isMobile
                            ? "0.875rem"
                            : "1rem",
                        minHeight: isSmallMobile
                          ? "44px"
                          : isMobile
                            ? "48px"
                            : "56px",
                        backgroundColor: "var(--theme-input-bg, #ffffff)",
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: isSmallMobile
                          ? "0.75rem"
                          : isMobile
                            ? "0.8125rem"
                            : "0.875rem",
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
                    label={t("pages.users.preferredLocation")}
                    value={editFormData.preferred_location || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        preferred_location: e.target.value,
                      })
                    }
                    variant="outlined"
                    size={
                      isSmallMobile ? "small" : isMobile ? "small" : "medium"
                    }
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: isSmallMobile
                          ? "0.875rem"
                          : isMobile
                            ? "0.875rem"
                            : "1rem",
                        minHeight: isSmallMobile
                          ? "44px"
                          : isMobile
                            ? "48px"
                            : "56px",
                        backgroundColor: "var(--theme-input-bg, #ffffff)",
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: isSmallMobile
                          ? "0.75rem"
                          : isMobile
                            ? "0.8125rem"
                            : "0.875rem",
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
            <Typography>Employer details not found</Typography>
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
              fontSize: isSmallMobile
                ? "0.875rem"
                : isMobile
                  ? "0.9375rem"
                  : "0.875rem",
              fontWeight: isMobile ? 500 : 400,
            }}
          >
            {t("pages.users.cancel")}
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            color="primary"
            disabled={isUpdating || isLoadingEmployerDetails}
            startIcon={
              isUpdating ? (
                <CircularProgress
                  size={isSmallMobile ? 16 : isMobile ? 18 : 20}
                />
              ) : (
                <EditIcon />
              )
            }
            fullWidth={isMobile}
            size={isSmallMobile ? "medium" : isMobile ? "large" : "medium"}
            sx={{
              minHeight: isSmallMobile ? "42px" : isMobile ? "48px" : "36px",
              fontSize: isSmallMobile
                ? "0.875rem"
                : isMobile
                  ? "0.9375rem"
                  : "0.875rem",
              fontWeight: isMobile ? 600 : 500,
            }}
          >
            {isUpdating
              ? t("pages.users.saving")
              : t("pages.users.saveChanges")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Employers;
