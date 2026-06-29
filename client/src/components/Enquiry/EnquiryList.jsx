// components/Enquiry/EnquiryList.jsx - MOVED TO COMPONENTS/ENQUIRY

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import Layout from '../Layout/Layout';
import { useEnquiryStore } from '../../stores/enquiryStore';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  Globe,
  Mail,
  Phone,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Loader,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const EnquiryList = () => {
  const navigate = useNavigate();
  const {
    enquiries,
    loading,
    pagination,
    filters,
    fetchEnquiries,
    deleteEnquiry,
    convertToVisit,
    setFilters,
    resetFilters,
    setPage
  } = useEnquiryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');

  useEffect(() => {
    loadEnquiries();
  }, [filters]);

  const loadEnquiries = async () => {
    await fetchEnquiries();
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterApply = () => {
    setFilters({ 
      ...filters, 
      status: filterStatus,
      source: filterSource
    });
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    resetFilters();
    setFilterStatus('');
    setFilterSource('');
    setSearchTerm('');
    setShowFilters(false);
  };

  const handleConvertToVisit = async (id) => {
    if (window.confirm('Convert this online enquiry to a physical visitor request?')) {
      const result = await convertToVisit(id);
      if (result.success) {
        toast.success('Enquiry converted to visit successfully!');
        loadEnquiries();
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      const result = await deleteEnquiry(id);
      if (result.success) {
        toast.success('Enquiry deleted successfully');
        loadEnquiries();
      }
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/requests/${id}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'in-progress': { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getSourceDisplay = (source) => {
    const map = {
      google: 'Google',
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      tiktok: 'TikTok',
      twitter: 'Twitter',
      referral: 'Referral',
      direct: 'Direct',
      advertisement: 'Advert',
      other: 'Other'
    };
    return map[source] || source || 'Unknown';
  };

  const getSourceColor = (source) => {
    const map = {
      google: 'bg-blue-100 text-blue-700',
      facebook: 'bg-blue-100 text-blue-700',
      instagram: 'bg-pink-100 text-pink-700',
      linkedin: 'bg-blue-100 text-blue-700',
      tiktok: 'bg-black/10 text-black',
      twitter: 'bg-blue-100 text-blue-700',
      referral: 'bg-purple-100 text-purple-700',
      direct: 'bg-gray-100 text-gray-700',
      advertisement: 'bg-orange-100 text-orange-700'
    };
    return map[source] || 'bg-gray-100 text-gray-700';
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Calculate stats
  const totalEnquiries = enquiries.length;
  const pendingCount = enquiries.filter(e => e.status === 'pending').length;
  const convertedCount = enquiries.filter(e => e.convertedToVisit).length;
  const sourceCounts = enquiries.reduce((acc, e) => {
    const source = e.source || 'direct';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const topSource = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1)[0];

  const activeFilterCount = (filterStatus ? 1 : 0) + (filterSource ? 1 : 0) + (searchTerm ? 1 : 0);

  if (loading && !enquiries.length) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Globe className="w-8 h-8 mr-3 text-blue-600" />
                Online Enquiries
              </h1>
              <p className="mt-2 text-gray-600">
                Manage all online enquiries submitted through the website
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadEnquiries}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Enquiries</p>
                <p className="text-3xl font-bold text-gray-900">{totalEnquiries}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Converted to Visit</p>
                <p className="text-3xl font-bold text-green-600">{convertedCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Top Source</p>
                <p className="text-2xl font-bold text-purple-600">
                  {topSource ? getSourceDisplay(topSource[0]) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {topSource ? `${topSource[1]} enquiries` : 'No data'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  activeFilterCount > 0
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source
                  </label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Sources</option>
                    <option value="google">Google</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="tiktok">TikTok</option>
                    <option value="twitter">Twitter</option>
                    <option value="referral">Referral</option>
                    <option value="direct">Direct</option>
                    <option value="advertisement">Advertisement</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={handleFilterApply}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enquiries Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : enquiries.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No enquiries found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No online enquiries have been submitted yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enquirer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enquiries.map((enquiry) => {
                    const isExpanded = expandedId === enquiry._id;
                    
                    return (
                      <React.Fragment key={enquiry._id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{enquiry.visitorName}</p>
                              <p className="text-sm text-gray-500 flex items-center">
                                <Mail className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                {enquiry.visitorEmail}
                              </p>
                              <p className="text-sm text-gray-500 flex items-center">
                                <Phone className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                {enquiry.visitorPhone}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(enquiry.source)}`}>
                              {getSourceDisplay(enquiry.source)}
                            </span>
                            {enquiry.utmSource && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 mt-1">
                                UTM: {enquiry.utmSource}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(enquiry.status)}
                            {enquiry.convertedToVisit && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 mt-1">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Converted
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-500">
                              {formatDate(enquiry.submittedAt || enquiry.createdAt)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => toggleExpand(enquiry._id)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleViewDetails(enquiry._id)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {!enquiry.convertedToVisit && (
                                <button
                                  onClick={() => handleConvertToVisit(enquiry._id)}
                                  className="text-green-600 hover:text-green-800 p-1 rounded"
                                  title="Convert to Visit"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(enquiry._id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Row - Message Details */}
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan="5" className="px-6 py-4">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700">Message</h4>
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
                                    {enquiry.message || enquiry.description}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Enquiry Type:</span>
                                    <p className="font-medium text-gray-700">{enquiry.enquiryTypeDisplay || enquiry.enquiryType}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Preferred Contact:</span>
                                    <p className="font-medium text-gray-700">{enquiry.preferredContactMethod || 'Email'}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Best Time:</span>
                                    <p className="font-medium text-gray-700">{enquiry.bestTimeToContact || 'Anytime'}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Device:</span>
                                    <p className="font-medium text-gray-700">{enquiry.device || 'N/A'}</p>
                                  </div>
                                </div>
                                {enquiry.utmSource && (
                                  <div className="text-xs text-gray-500">
                                    <span className="font-medium">UTM:</span> 
                                    Source: {enquiry.utmSource} | 
                                    Medium: {enquiry.utmMedium || 'N/A'} | 
                                    Campaign: {enquiry.utmCampaign || 'N/A'}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.total > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.current} of {pagination.total} ({pagination.results} total enquiries)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(pagination.current + 1)}
                    disabled={pagination.current === pagination.total}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EnquiryList;