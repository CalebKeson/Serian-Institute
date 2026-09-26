
import React, { useState, useEffect } from 'react';
import { useRequestStore } from '../../stores/requestStore';
import CreateRequestForm from '../../components/Requests/CreateRequestForm';
import RequestList from '../../components/Requests/RequestList';
import RequestStats from '../../components/Requests/RequestStats';
import { Plus, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Requests = () => {
  const { requests, stats, fetchRequests, fetchStats, loading } = useRequestStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('today');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'physical', 'online'
  
  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter]);
  
  const loadData = async () => {
    const params = {};
    
    // Status filter
    if (statusFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      params.startDate = today;
    } else if (statusFilter === 'pending') {
      params.status = 'pending';
    } else if (statusFilter === 'in-progress') {
      params.status = 'in-progress';
    } else if (statusFilter === 'completed') {
      params.status = 'completed';
    }
    
    // Type filter - FIXED to work properly
    if (typeFilter === 'physical') {
      params.type = 'physical';
    } else if (typeFilter === 'online') {
      params.type = 'online';
    }
    // If typeFilter === 'all', don't pass any type filter
    
    console.log('📊 Fetching requests with params:', params);
    
    await fetchRequests(params);
    await fetchStats();
  };
  
  const handleRequestCreated = () => {
    setShowCreateForm(false);
    loadData();
    toast.success('Visitor request created successfully!');
  };
  
  const handleRefresh = () => {
    loadData();
    toast.success('Requests refreshed!');
  };

  const statusFilterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  const typeFilterOptions = [
    { value: 'all', label: 'All Requests' },
    { value: 'physical', label: 'Physical Visitors' },
    { value: 'online', label: 'Online Enquiries' }
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Visitor Requests</h1>
            <p className="text-gray-600 mt-1">
              Manage and track visitor requests at Serian Institute
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Request
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <RequestStats stats={stats} loading={loading} />
        
        {/* Filters - TWO SEPARATE FILTERS */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              {statusFilterOptions.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    statusFilter === f.value 
                      ? 'bg-blue-100 text-blue-600 font-medium' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            
            <div className="w-px h-8 bg-gray-300 hidden sm:block"></div>
            
            {/* Type Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Type:</span>
              {typeFilterOptions.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setTypeFilter(type.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    typeFilter === type.value 
                      ? 'bg-purple-100 text-purple-600 font-medium' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Request List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Visitor Requests {requests.length > 0 && `(${requests.length})`}
            </h2>
          </div>
          <RequestList 
            requests={requests} 
            loading={loading} 
            currentFilter={typeFilter}
            onFilterChange={setTypeFilter}
          />
        </div>
      </div>
      
      {/* Create Request Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Visitor Request</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Fill in the visitor details and request information
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <CreateRequestForm 
              onSuccess={handleRequestCreated} 
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Requests;