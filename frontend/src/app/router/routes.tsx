import type { RouteObject } from "react-router-dom";

import { ApplicationErrorPage } from "../error-boundary/application-error-page";
import { ApplicationLayout } from "../layouts/application-layout";
import { DashboardPage } from "../../pages/dashboard/dashboard-page";
import { FormsPage } from "../../pages/forms/forms-page";
import { FormDetailPage } from "../../pages/forms/form-detail-page";
import { FormBuilderPage } from "../../pages/forms/form-builder-page";
import { WorkspaceFormsPage } from "../../pages/forms/workspace-forms-page";
import { LoginPage } from "../../pages/auth/login-page";
import { RegisterPage } from "../../pages/auth/register-page";
import { WorkspaceDetailPage } from "../../pages/workspaces/workspace-detail-page";
import { ProtectedRoute } from "../../features/authentication/components/protected-route";
import { PublicFormPage } from "../../pages/public/public-form-page";
import { FormResponsesPage } from "../../pages/forms/form-responses-page";
import { SubmissionDetailPage } from "../../pages/forms/submission-detail-page";

export const applicationRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <ApplicationLayout />,
        errorElement: <ApplicationErrorPage />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "forms", element: <FormsPage /> },
          { path: "forms/:formId", element: <FormDetailPage /> },
          { path: "forms/:formId/builder", element: <FormBuilderPage /> },
          { path: "forms/:formId/responses", element: <FormResponsesPage /> },
          { path: "forms/:formId/responses/:submissionId", element: <SubmissionDetailPage /> },
          { path: "workspaces/:workspaceId", element: <WorkspaceDetailPage /> },
          { path: "workspaces/:workspaceId/forms", element: <WorkspaceFormsPage /> },
          {
            path: "*",
            element: <ApplicationErrorPage notFound />,
          },
        ],
      },
    ],
  },
  { path: "/login", element: <LoginPage />, errorElement: <ApplicationErrorPage /> },
  { path: "/register", element: <RegisterPage />, errorElement: <ApplicationErrorPage /> },
  { path: "/f/:slug", element: <PublicFormPage />, errorElement: <ApplicationErrorPage /> },
];
