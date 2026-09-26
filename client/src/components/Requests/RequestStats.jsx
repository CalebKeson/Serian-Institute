
import React, { useEffect, useState } from 'react';
import { useEnquiryStore } from '../../stores/enquiryStore';
import { requestAPI } from '../../services/requestAPI';
import { Globe, Users, TrendingUp, MessageSquare, Clock, User } from 'lucide-react';
import { Link } from 'react-router';

const RequestStats = ({ stats, loading }) => {
  const { 
    sourceBreakdown, 
    fetchSourceBreakdown,
    loading: enquiryLoading
  } = useEnquiryStore();

  const [physicalCount, setPhysicalCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch source breakdown for analytics
    fetchSourceBreakdown();
    
    // Fetch counts by type
    fetchTypeCounts();
  }, []);

  const fetchTypeCounts = async () => {
    setIsLoading(true);
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch physical requests (type: 'physical')
      const physicalResponse = await requestAPI.getAllRequests({ 
        type: 'physical', 
        limit: 1000 
      });
      const physicalRequests = physicalResponse.data?.data || [];
      console.log('📊 Physical requests:', physicalRequests.length);
      
      // Fetch online requests (type: 'online')
      const onlineResponse = await requestAPI.getAllRequests({ 
        type: 'online', 
        limit: 1000 
      });
      const onlineRequests = onlineResponse.data?.data || [];
      console.log('📊 Online requests:', onlineRequests.length);
      
      // Set counts
      setPhysicalCount(physicalRequests.length);
      setOnlineCount(onlineRequests.length);
      
      // Count today's requests (both physical and online)
      const todayPhysical = physicalRequests.filter(r => 
        r.createdAt?.split('T')[0] === today
      ).length;
      const todayOnline = onlineRequests.filter(r => 
        r.createdAt?.split('T')[0] === today
      ).length;
      setTodayCount(todayPhysical + todayOnline);
      
      // Count pending requests (both physical and online)
      const pendingPhysical = physicalRequests.filter(r => r.status === 'pending').length;
      const pendingOnline = onlineRequests.filter(r => r.status === 'pending').length;
      setPendingCount(pendingPhysical + pendingOnline);
      
      console.log('📊 Stats calculated:', {
        physical: physicalRequests.length,
        online: onlineRequests.length,
        today: todayPhysical + todayOnline,
        pending: pendingPhysical + pendingOnline
      });
      
    } catch (error) {
      console.error('Error fetching type counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use the stats from the Request API for total
  const totalRequests = stats?.total || 0;

  const statCards = [
    {
      title: 'Total Requests',
      value: totalRequests,
      icon: Users,
      color: 'blue',
      description: 'Physical + Online combined'
    },
    {
      title: "Today's Requests",
      value: todayCount,
      icon: Clock,
      color: 'green',
      description: 'Both physical and online'
    },
    {
      title: 'Total Physical Requests',
      value: physicalCount,
      icon: User,
      color: 'indigo',
      description: 'All physical visitor requests'
    },
    {
      title: 'Total Online Enquiries',
      value: onlineCount,
      icon: Globe,
      color: 'purple',
      description: 'All online enquiries'
    },
    {
      title: 'Pending Enquiries',
      value: pendingCount,
      icon: MessageSquare,
      color: 'yellow',
      description: 'Awaiting action'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };

  // Source breakdown for display
  const topSources = sourceBreakdown?.sources?.slice(0, 5) || [];

  if (loading || enquiryLoading || isLoading) {
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