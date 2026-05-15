// src/pages/Dashboard/Dashboard.jsx
import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import Layout from '../../components/Layout/Layout';
import AdminDashboard from './AdminDashboard';
import InstructorDashboard from './InstructorDashboard';

const Dashboard = () => {
  const { user } = useAuthStore();
  
  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }
  
  // Render different dashboard based on user role
  const renderDashboardContent = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'instructor':
        return <InstructorDashboard />;
      case 'student':
        // Student dashboard (to be implemented)
        return <AdminDashboard />; // Fallback
      case 'parent':
        // Parent dashboard (to be implemented)
        return <AdminDashboard />; // Fallback
      case 'receptionist':
        return <AdminDashboard />;
      default:
        return <AdminDashboard />;
    }
  };
  
  return (
    <Layout>
      {renderDashboardContent()}
    </Layout>
  );
};

export default Dashboard;