import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import CheckInOut from './pages/CheckInOut';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import EditInvoice from './pages/EditInvoice';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<ProtectedRoute ownerOnly><Dashboard /></ProtectedRoute>} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/check-in" element={<CheckInOut />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/invoices/:id/edit" element={<EditInvoice />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/reports" element={<ProtectedRoute ownerOnly><Reports /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute ownerOnly><Users /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute ownerOnly><Settings /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
