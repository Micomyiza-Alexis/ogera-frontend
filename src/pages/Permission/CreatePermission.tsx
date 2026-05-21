import React, { useEffect } from "react";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import {
  useCreatePermissionMutation,
  useGetAllRoutesQuery,
} from "../../services/api/adminApi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { styled } from "@mui/material/styles";
import Button from "../../components/button";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import * as Yup from "yup";

interface CreatePermissionFormValues {
  api_name: string;
  route: string;
  permission: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}

const CreatePermission: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    api_name: Yup.string()
      .min(2, t("pages.permission.validationApiNameMin"))
      .max(100, t("pages.permission.validationApiNameMax"))
      .required(t("pages.permission.validationApiNameRequired"))
      .matches(
        /^[a-zA-Z0-9_-]+$/,
        t("pages.permission.validationApiNameMatch")
      ),
    route: Yup.string()
      .required(t("pages.permission.validationRouteRequired"))
      .matches(/^\//, t("pages.permission.validationRouteStart")),
    permission: Yup.object({
      view: Yup.boolean().required(),
      create: Yup.boolean().required(),
      edit: Yup.boolean().required(),
      delete: Yup.boolean().required(),
    }).required(),
  });

  const [createPermission, { isLoading, isError, error, isSuccess, data }] =
    useCreatePermissionMutation();

  const { data: routesData, isLoading: isLoadingRoutes } = useGetAllRoutesQuery();

  const availableRoutes = routesData?.data || [];

  const initialValues: CreatePermissionFormValues = {
    api_name: "",
    route: "",
    permission: {
      view: false,
      create: false,
      edit: false,
      delete: false,
    },
  };

  const formik = useFormik<CreatePermissionFormValues>({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        const payload = {
          api_name: values.api_name.trim(),
          route: values.route.trim(),
          permission: values.permission,
        };
        await createPermission(payload).unwrap();
      } catch (err) {
        console.error("Create permission error:", err);
      }
    },
  });

  const { resetForm } = formik;

  useEffect(() => {
    if (isError && error) {
      const err = error as FetchBaseQueryError & {
        data?: { error?: string; message?: string };
      };
      toast.error(
        err?.data?.error || err?.data?.message || t("pages.permission.failedToCreatePermission")
      );
    }

    if (data && isSuccess) {
      toast.success(data?.message || t("pages.permission.permissionCreatedSuccess"));
      resetForm();
      navigate("/dashboard/permission/view");
    }
  }, [isError, error, data, isSuccess, resetForm, navigate, t]);

  const updatePermission = (
    permissionType: "view" | "create" | "edit" | "delete",
    value: boolean
  ) => {
    formik.setFieldValue(`permission.${permissionType}`, value);
  };

  return (
    <Container>
      <FormContainer onSubmit={formik.handleSubmit}>
        <Header>
          <IconWrapper>
            <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
          </IconWrapper>
          <Title>{t("pages.permission.createPermission")}</Title>
          <Subtitle>
            {t("pages.permission.createPermissionSubtitle")}
          </Subtitle>
        </Header>

        {/* API Name */}
        <FormGroup>
          <Label htmlFor="api_name">{t("pages.permission.apiNameLabel")}</Label>
          <Input
            id="api_name"
            name="api_name"
            placeholder={t("pages.permission.apiNamePlaceholder")}
            value={formik.values.api_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.api_name && formik.errors.api_name && (
            <ErrorText>{formik.errors.api_name}</ErrorText>
          )}
          <HelperText>
            {t("pages.permission.apiNameHelper")}
          </HelperText>
        </FormGroup>

        {/* Route */}
        <FormGroup>
          <Label htmlFor="route">{t("pages.permission.routeLabel")}</Label>
          <Select
            id="route"
            name="route"
            value={formik.values.route}
            onChange={(e) => {
              formik.setFieldValue("route", e.target.value);
            }}
            onBlur={formik.handleBlur}
            disabled={isLoadingRoutes}
          >
            <option value="">{t("pages.permission.selectRoute")}</option>
            {availableRoutes.map((route: string) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
          </Select>
          {formik.touched.route && formik.errors.route && (
            <ErrorText>{formik.errors.route}</ErrorText>
          )}
          <HelperText>
            {t("pages.permission.routeHelper")}
          </HelperText>
        </FormGroup>

        {/* Permissions */}
        <FormGroup>
          <Label>{t("pages.permission.permissionsLabel")}</Label>
          <PermissionCheckboxes>
            <CheckboxGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={formik.values.permission.view}
                  onChange={(e) => updatePermission("view", e.target.checked)}
                />
                <span>{t("pages.permission.view")}</span>
              </CheckboxLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={formik.values.permission.create}
                  onChange={(e) => updatePermission("create", e.target.checked)}
                />
                <span>{t("pages.permission.create")}</span>
              </CheckboxLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={formik.values.permission.edit}
                  onChange={(e) => updatePermission("edit", e.target.checked)}
                />
                <span>{t("pages.permission.update")}</span>
              </CheckboxLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={formik.values.permission.delete}
                  onChange={(e) => updatePermission("delete", e.target.checked)}
                />
                <span>{t("pages.permission.delete")}</span>
              </CheckboxLabel>
            </CheckboxGroup>
          </PermissionCheckboxes>
          <HelperText>
            {t("pages.permission.permissionsHelper")}
          </HelperText>
        </FormGroup>

        <Button
          backgroundcolor="#7f56d9"
          type="submit"
          text={isLoading ? t("pages.permission.creating") : t("pages.permission.createPermissionButton")}
          disabled={isLoading}
        />
      </FormContainer>
    </Container>
  );
};

export default CreatePermission;

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

const HelperText = styled("div")`
  font-size: 12px;
  color: var(--theme-text-secondary);
  margin-top: 4px;
  transition: color 0.35s ease;
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

const PermissionCheckboxes = styled("div")`
  margin-top: 12px;
`;

const CheckboxGroup = styled("div")`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const CheckboxLabel = styled("label")`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--theme-text-secondary);
  transition: color 0.35s ease;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #7f56d9;
  }

  span {
    user-select: none;
  }
`;


