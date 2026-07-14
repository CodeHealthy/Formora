import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { applicationRoutes } from "./routes";

const router = createBrowserRouter(applicationRoutes);

export function ApplicationRouter() {
  return <RouterProvider router={router} />;
}
