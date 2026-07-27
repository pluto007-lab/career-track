import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { CompanyFormPage } from "./pages/CompanyFormPage";
import { CompanyListPage } from "./pages/CompanyListPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ErrorPage } from "./pages/ErrorPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { CompanyEvaluationPage } from "./pages/CompanyEvaluationPage";
import { ApplicantProfilePage } from "./pages/ApplicantProfilePage";
import { CompanyMotivationPage } from "./pages/CompanyMotivationPage";
import { ApplicationManagementPage } from "./pages/ApplicationManagementPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "companies", element: <CompanyListPage /> },
      { path: "applications", element: <ApplicationManagementPage /> },
      { path: "companies/new", element: <CompanyFormPage /> },
      { path: "companies/:companyId/edit", element: <CompanyFormPage /> },
      {
        path: "companies/:companyId/evaluate",
        element: <CompanyEvaluationPage />,
      },
      {
        path: "companies/:companyId/motivation",
        element: <CompanyMotivationPage />,
      },
      {
        path: "settings/profile",
        element: <ApplicantProfilePage />,
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
});
