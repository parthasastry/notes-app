import React from 'react';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import amplifyConfig from './config/aws-config';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Auth from './components/auth/Auth';
import RequireAuth from './components/auth/RequireAuth';
import Navigation from './components/layout/Navigation';
import Home from './components/layout/Home';
import Notes from './components/notes/Notes';

// Initialize Amplify
Amplify.configure(amplifyConfig);

// Simple route handler - redirect authenticated users to notes
const RouteHandler = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Home />;
  }

  return <Navigate to="/notes" replace />;
};

const AppContent = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/" element={<RouteHandler />} />
          <Route
            path="/notes"
            element={
              <RequireAuth>
                <Notes />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;