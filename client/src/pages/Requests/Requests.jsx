// src/pages/Requests/Requests.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { useRequestStore } from '../../stores/requestStore';
import CreateRequestForm from '../../components/Requests/CreateRequestForm';
import RequestList from '../../components/Requests/RequestList';
import RequestStats from '../../components/Requests/RequestStats';
import toast from 'react-hot-toast';

const Requests = () => {
  const { requests, stats, fetchRequests, fetchStats, loading } = useRequestStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState('today');
  
  useEffect(() => {
    loadData();
  }, [filter]);
  
  const loadData = async () => {
    const params = {};
    
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      params.startDate = today;
    } else if (filter === 'pending') {
      params.status = 'pending';
    } else if (filter === 'in-progress') {
      params.status = 'in-progress';
    } else if (filter === 'completed') {
      params.status = 'completed';
    }
    
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

  return (
    <Layout>
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Request
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <RequestStats stats={stats} loading={loading} />
        
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
            {['today', 'all', 'pending', 'in-progress', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === f 
                    ? 'bg-blue-100 text-blue-600 font-medium' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'today' ? 'Today' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Request List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Visitor Requests {requests.length > 0 && `(${requests.length})`}
            </h2>
          </div>
          <RequestList requests={requests} loading={loading} />
        </div>
      </div>
      
      {/* Create Request Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Visitor Request</h2>
                <p className="text-gray-600 mt-1">
                  Fill in the visitor details and request information
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CreateRequestForm 
              onSuccess={handleRequestCreated} 
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Requests;