import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicOnlyRoute = () => {
  const token = localStorage.getItem('token');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
