// frontend/src/components/Users/UserStats.jsx - COMPLETE

import React from 'react';
import { Users, UserCheck, UserX, UserPlus, Clock, TrendingUp } from 'lucide-react';

const UserStats = ({ stats, loading }) => {
  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'blue',
      description: 'All system users'
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: UserCheck,
      color: 'green',
      description: 'Currently active'
    },
    {
      title: 'Inactive Users',
      value: stats?.inactiveUsers || 0,
      icon: UserX,
      color: 'red',
      description: 'Deactivated accounts'
    },
    {
      title: 'New This Month',
      value: stats?.newThisMonth || 0,
      icon: UserPlus,
      color: 'purple',
      description: 'Joined this month'
    }
  ];

  const roleCards = [
    { role: 'admin', label: 'Admins', count: stats?.byRole?.admin || 0 },
    { role: 'instructor', label: 'Instructors', count: stats?.byRole?.instructor || 0 },
    { role: 'student', label: 'Students', count: stats?.byRole?.student || 0 },
    { role: 'receptionist', label: 'Receptionists', count: stats?.byRole?.receptionist || 0 }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {roleCards.map((role) => (
          <div
            key={role.role}
            className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100"
          >
            <p className="text-xs text-gray-500">{role.label}</p>
            <p className="text-xl font-bold text-gray-900">{role.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserStats;