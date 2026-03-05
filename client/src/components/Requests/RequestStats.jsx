// src/components/Requests/RequestStats.jsx
import React from 'react';

const RequestStats = ({ stats, loading }) => {
  const statCards = [
    {
      title: 'Total Requests',
      value: stats?.total || 0,
      icon: '📋',
      color: 'blue',
      description: 'All time requests'
    },
    {
      title: "Today's Requests",
      value: stats?.today || 0,
      icon: '📅',
      color: 'green',
      description: 'Requests today'
    },
    {
      title: 'Pending',
      value: stats?.pending || 0,
      icon: '⏳',
      color: 'yellow',
      description: 'Awaiting action'
    },
    {
      title: 'Completed',
      value: stats?.stats?.find(s => s._id === 'completed')?.count || 0,
      icon: '✅',
      color: 'purple',
      description: 'Resolved requests'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.title}
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
              <span className="text-xl">{stat.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestStats;