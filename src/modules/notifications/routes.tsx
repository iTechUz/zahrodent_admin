import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

export const notificationRoutes: RouteObject[] = [
  { path: 'notifications', element: <NotificationsPage /> },
];
