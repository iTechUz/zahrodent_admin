import { Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/api/query-client";
import { BrowserRouter, useRoutes, Navigate, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { ProtectedRoute, GlobalSearch } from "@/components";
import { useStore } from "@/store/useStore";
import { LoadingScreen } from "@/shared/components";
import { useSocket } from "@/shared/hooks/useSocket";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";

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
  settingRoutes,
  userRoutes,
  leadsRoutes
} from "@/modules";

import NotFound from "./pages/NotFound.tsx";

const queryClient = createQueryClient();

const AppRoutes = () => {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const authReady = useAuthBootstrap();
  const navigate = useNavigate();
  useSocket({ onOpenLead: () => navigate('/leads') });

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
            ...userRoutes,
            ...leadsRoutes,
          ],
        },
      ],
    },
    
    // Global routes
    { path: "*", element: <NotFound /> },
  ]);

  // a stored token without a cached user is being verified (GET /auth/me)
  if (!authReady) return <LoadingScreen />;

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
