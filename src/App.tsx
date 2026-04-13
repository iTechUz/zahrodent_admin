import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useRoutes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { ProtectedRoute, GlobalSearch } from "@/components";
import { useStore } from "@/store/useStore";
import { LoadingScreen } from "@/shared/components";

// Module Routes
import {
  authRoutes,
  dashboardRoutes,
  patientRoutes,
  bookingRoutes,
  doctorRoutes,
  financeRoutes,
  serviceRoutes,
  analyticsRoutes,
  notificationRoutes,
  settingRoutes
} from "@/modules";

import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated } = useStore();

  const routes = useRoutes([
    // Auth routes (not protected, but redirect if authenticated)
    ...authRoutes.map(route => ({
      ...route,
      element: isAuthenticated ? <Navigate to="/" replace /> : route.element
    })),
    
    // Protected routes
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <DashboardLayout />,
          children: [
            ...dashboardRoutes,
            ...bookingRoutes,
            ...patientRoutes,
            ...doctorRoutes,
            ...financeRoutes,
            ...serviceRoutes,
            ...analyticsRoutes,
            ...notificationRoutes,
            ...settingRoutes,
          ],
        },
      ],
    },
    
    // Global routes
    { path: "*", element: <NotFound /> },
  ]);

  return (
    <>
      {isAuthenticated && <GlobalSearch />}
      <Suspense fallback={<LoadingScreen />}>
        {routes}
      </Suspense>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
