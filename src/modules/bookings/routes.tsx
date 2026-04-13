import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const BookingsPage = lazy(() => import('./pages/BookingsPage'));

export const bookingRoutes: RouteObject[] = [
  { path: 'bookings', element: <BookingsPage /> },
];
