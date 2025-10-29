import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatProvider } from './contexts/ChatContext';
import { CourseGroupProvider } from './contexts/CourseGroupContext';
import { useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import DemoLogin from './components/DemoLogin';
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/profile/Profile';
import Navbar from './components/common/Navbar';
import { CoursesProvider } from './contexts/CoursesContext';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import GroupChat from "./components/dashboard/GroupChat";
import StudyGroups from './components/dashboard/StudyGroups';
import ChatPage from './components/chat/ChatPage';
import MessagingWidget from './components/chat/MessagingWidget';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
};

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Toast Container for global popups */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
        />

        <Routes>
          <Route 
            path="/demo-login" 
            element={
              <PublicRoute>
                <DemoLogin />
              </PublicRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Navbar />
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/study-groups" element={<Navigate to="/dashboard" />} />
          <Route path="/group-chat/:groupId" element={<Navigate to="/chat/:groupId" />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Navbar />
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat/:groupId" 
            element={
              <ProtectedRoute>
                <Navbar />
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
        <MessagingWidget />
      </div>
    </Router>
  );
}


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CourseGroupProvider>
          <ChatProvider>
            <CoursesProvider>
              <AppContent />
            </CoursesProvider>
          </ChatProvider>
        </CourseGroupProvider>
      </AuthProvider>
    </ThemeProvider>
    
  );
}

export default App;
