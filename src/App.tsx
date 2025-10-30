// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// ย้าย Import มาใช้ 'lazy'
const PlanPage = lazy(() => import('./pages/PlanPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// ProtectedRoute (เหมือนเดิม)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }

  return (
    // 3. [สำคัญ!] หุ้ม <Routes> ด้วย <Suspense>
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Loading from Suspense...</div>}>
      <Routes>
        <Route 
          path="/" 
          element={
            user ? <Navigate to="/plan" /> : <Navigate to="/login" />
          } 
        />
        <Route path="/login" element={<AuthPage />} />
        <Route 
          path="/plan" 
          element={
            <ProtectedRoute>
              <PlanPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Suspense>
  );
};

export default App;