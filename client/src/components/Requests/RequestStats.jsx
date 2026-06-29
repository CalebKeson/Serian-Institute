
import React, { useEffect } from 'react';
import { useEnquiryStore } from '../../stores/enquiryStore';
import { Globe, Mail, Users, TrendingUp, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';

const RequestStats = ({ stats, loading }) => {
  const { 
    sourceBreakdown, 
    fetchSourceBreakdown,
    stats: enquiryStats,
    fetchStats: fetchEnquiryStats,
    loading: enquiryLoading
  } = useEnquiryStore();

  useEffect(() => {
    // Fetch online enquiry stats when component mounts
    fetchEnquiryStats();
    fetchSourceBreakdown();
  }, []);

  // Physical visit stats
  const physicalStats = {
    total: stats?.total || 0,
    today: stats?.today || 0,
    pending: stats?.pending || 0,
    completed: stats?.stats?.find(s => s._id === 'completed')?.count || 0
  };

  // Online enquiry stats
  const onlineStats = {
    total: enquiryStats?.total || 0,
    today: enquiryStats?.today || 0,
    pending: enquiryStats?.pending || 0,
    converted: enquiryStats?.converted || 0
  };

  const statCards = [
    {
      title: 'Total Physical Requests',
      value: physicalStats.total,
      icon: Users,
      color: 'blue',
      description: 'All physical visitor requests'
    },
    {
      title: "Today's Visitors",
      value: physicalStats.today,
      icon: Clock,
      color: 'green',
      description: 'Physical visitors today'
    },
    {
      title: 'Total Online Enquiries',
      value: onlineStats.total,
      icon: Globe,
      color: 'purple',
      description: 'All online enquiries'
    },
    {
      title: 'Pending Enquiries',
      value: onlineStats.pending,
      icon: MessageSquare,
      color: 'yellow',
      description: 'Online enquiries awaiting response'
    },
    {
      title: 'Converted to Visit',
      value: onlineStats.converted,
      icon: CheckCircle,
      color: 'green',
      description: 'Online enquiries converted to physical visits'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600'
  };

  // Source breakdown for display
  const topSources = sourceBreakdown?.sources?.slice(0, 5) || [];

  if (loading || enquiryLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

      {/* Source Breakdown */}
      {topSources.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
            Top Traffic Sources
          </h4>
          <div className="flex flex-wrap gap-3">
            {topSources.map((source, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  {source.sourceDisplay || source.source}
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {source.enquiries || source.count || 0}
                </span>
                {source.enquiryPercentage !== undefined && (
                  <span className="text-xs text-gray-500">
                    ({source.enquiryPercentage}%)
                  </span>
                )}
              </div>
            ))}
            <Link
              to="/enquiry-analytics"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestStats;