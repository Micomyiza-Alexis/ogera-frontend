import React, { useState, useEffect, useMemo } from "react";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { useCreateAdminMutation, useGetAllRolesQuery } from "../../services/api/adminApi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "../../components/button";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import * as Yup from "yup";

interface CreateAdminFormValues {
  email: string;
  password: string;
  role: string; // roleName from roles table
  full_name: string;
  mobile_number: string;
}

const CreateAdmin: React.FC = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email(t("pages.admin.validationEmailInvalid"))
      .required(t("pages.admin.validationEmailRequired")),
    password: Yup.string()
      .min(8, t("pages.admin.validationPasswordMin"))
      .required(t("pages.admin.validationPasswordRequired")),
    role: Yup.string()
      .required(t("pages.admin.validationRoleRequired")),
    full_name: Yup.string()
      .min(2, t("pages.admin.validationFullNameMin"))
      .required(t("pages.admin.validationFullNameRequired")),
    mobile_number: Yup.string()
      .min(10, t("pages.admin.validationMobileMin"))
      .max(15, t("pages.admin.validationMobileMax"))
      .optional(),
  });

  const [createAdmin, { isLoading, isError, error, isSuccess, data }] =
    useCreateAdminMutation();

  // Fetch all roles
  const { data: rolesData, isLoading: isLoadingRoles } = useGetAllRolesQuery();

  // Filter roles to only show those with roleType "admin"
  const adminRoles = useMemo(() => {
    if (!rolesData || !Array.isArray(rolesData)) return [];
    return rolesData.filter((role: any) => 
      role.roleType === "admin"
    );
  }, [rolesData]);

  const handleClickShowPassword = () => setShowPassword((prev) => !prev);

  const initialValues: CreateAdminFormValues = {
    email: "",
    password: "",
    role: "",
    full_name: "",
    mobile_number: "",
  };

  const formik = useFormik<CreateAdminFormValues>({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        const payload = {
          email: values.email,
          password: values.password,
          role: values.role,
          full_name: values.full_name,
          mobile_number: values.mobile_number || undefined,
        };
        await createAdmin(payload).unwrap();
      } catch (err) {
        console.error("Create admin error:", err);
      }
    },
  });

  const { resetForm } = formik;

  useEffect(() => {
    if (isError && error) {
      const err = error as FetchBaseQueryError & {
        data?: { message?: string };
      };
      toast.error(err?.data?.message || t("pages.admin.failedToCreateAdmin"));
    }

    if (data && isSuccess) {
      toast.success(data?.message || t("pages.admin.adminCreatedSuccess"));
      resetForm();
      navigate("/dashboard/admin/view");
    }
  }, [isError, error, data, isSuccess, resetForm, navigate, t]);

  return (
    <Container>
      <FormContainer onSubmit={formik.handleSubmit}>
        <Header>
          <IconWrapper>
            <UserPlusIcon className="h-8 w-8 text-purple-600" />
          </IconWrapper>
          <Title>{t("pages.admin.createAdmin")}</Title>
          <Subtitle>
            {t("pages.admin.createAdminSubtitle")}
          </Subtitle>
        </Header>

        {/* Role Selection */}
        <FormGroup>
          <Label htmlFor="role">{t("pages.admin.roleNameLabel")}</Label>
          <Select
            id="role"
            name="role"
            value={formik.values.role}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={isLoadingRoles}
          >
            <option value="">{t("pages.admin.selectRole")}</option>
            {adminRoles.map((role: any) => (
              <option key={role.id} value={role.roleName}>
                {role.roleName}
              </option>
            ))}
          </Select>
          {formik.touched.role && formik.errors.role && (
            <ErrorText>{formik.errors.role}</ErrorText>
          )}
        </FormGroup>

        {/* Full Name */}
        <FormGroup>
          <Label htmlFor="full_name">{t("pages.admin.fullNameLabel")}</Label>
          <Input
            id="full_name"
            name="full_name"
            placeholder={t("pages.admin.fullNamePlaceholder")}
            value={formik.values.full_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.full_name && formik.errors.full_name && (
            <ErrorText>{formik.errors.full_name}</ErrorText>
          )}
        </FormGroup>

        {/* Email */}
        <FormGroup>
          <Label htmlFor="email">{t("pages.admin.emailAddressLabel")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("pages.admin.emailPlaceholder")}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.email && formik.errors.email && (
            <ErrorText>{formik.errors.email}</ErrorText>
          )}
        </FormGroup>

        {/* Password */}
        <FormGroup>
          <Label htmlFor="password">{t("pages.admin.passwordLabel")}</Label>
          <TextField
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={t("pages.admin.passwordPlaceholder")}
            variant="outlined"
            fullWidth
            size="small"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            InputProps={{
              style: { borderRadius: "8px", fontSize: "14px" },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    edge="end"
                    type="button"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {formik.touched.password && formik.errors.password && (
            <ErrorText>{formik.errors.password}</ErrorText>
          )}
        </FormGroup>

        {/* Mobile Number */}
        <FormGroup>
          <Label htmlFor="mobile_number">{t("pages.admin.mobileNumberOptional")}</Label>
          <Input
            id="mobile_number"
            name="mobile_number"
            placeholder={t("pages.admin.mobileNumberPlaceholder")}
            value={formik.values.mobile_number}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9]/g, "");
              formik.setFieldValue("mobile_number", cleaned);
            }}
            onBlur={formik.handleBlur}
          />
          {formik.touched.mobile_number && formik.errors.mobile_number && (
            <ErrorText>{formik.errors.mobile_number}</ErrorText>
          )}
        </FormGroup>

        <Button
          backgroundcolor="#7f56d9"
          type="submit"
          text={isLoading ? t("pages.admin.creating") : t("pages.admin.createAdminButton")}
          disabled={isLoading}
        />
      </FormContainer>
    </Container>
  );
};

export default CreateAdmin;

const Container = styled("div")`
  width: 100%;
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 0;
  background: var(--theme-page-bg);
  transition: background 0.35s ease;
`;

const FormContainer = styled("form")`
  max-width: 100%;
  width: 100%;
  background: var(--theme-card-bg);
  color: var(--theme-text-primary);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--theme-border);
  transition: background 0.35s ease, color 0.35s ease, border-color 0.35s ease;
`;

const Header = styled("div")`
  text-align: center;
  margin-bottom: 32px;
`;

const IconWrapper = styled("div")`
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
`;

const Title = styled("h1")`
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin-bottom: 8px;
  transition: color 0.35s ease;
`;

const Subtitle = styled("p")`
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin: 0;
  transition: color 0.35s ease;
`;

const FormGroup = styled("div")`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
`;

const Label = styled("label")`
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--theme-text-secondary);
  transition: color 0.35s ease;
`;

const Input = styled("input")`
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--theme-border);
  font-size: 14px;
  background: var(--theme-input-bg);
  color: var(--theme-text-primary);
  transition: border-color 0.2s, background 0.35s ease, color 0.35s ease;

  &:focus {
    outline: none;
    border-color: #7f56d9;
  }

  &::placeholder {
    color: var(--theme-text-secondary);
    opacity: 0.8;
  }
`;

const ErrorText = styled("div")`
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
`;

const Select = styled("select")`
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--theme-border);
  font-size: 14px;
  background: var(--theme-input-bg);
  color: var(--theme-text-primary);
  cursor: pointer;
  transition: border-color 0.2s, background 0.35s ease, color 0.35s ease;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #7f56d9;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  option {
    padding: 8px;
    background: var(--theme-card-bg);
    color: var(--theme-text-primary);
  }
`;


