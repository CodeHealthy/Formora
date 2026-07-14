import type { RouteObject } from "react-router-dom";

import { ApplicationErrorPage } from "../error-boundary/application-error-page";
import { ApplicationLayout } from "../layouts/application-layout";
import { DashboardPage } from "../../pages/dashboard/dashboard-page";
import { FormsPage } from "../../pages/forms/forms-page";
import { LoginPage } from "../../pages/auth/login-page";
import { RegisterPage } from "../../pages/auth/register-page";
import { WorkspaceDetailPage } from "../../pages/workspaces/workspace-detail-page";
import { ProtectedRoute } from "../../features/authentication/components/protected-route";

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
          { path: "workspaces/:workspaceId", element: <WorkspaceDetailPage /> },
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
];
