// src/pages/Referrals/ReferrerManagement.jsx - COMPLETE WITH FIXED IMPORTS

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Loader,
  User,
  Building,
  Award,
  DollarSign,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Hash,
  ChevronDown,
  ChevronUp,
  Download,
  CreditCard,
  Key,
  AlertCircle,
  X,
  Save
} from 'lucide-react';
import { useReferralStore } from '../../stores/referralStore';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../utils/feeFormatter';
import ExportButtons from '../../components/Fees/ExportButtons';
import toast from 'react-hot-toast';

const ReferrerManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    referrers,
    loading,
    pagination,
    filters,
    fetchReferrers,
    createReferrer,
    updateReferrer,
    deleteReferrer,
    generateReferralCode,
    setFilters,
    resetFilters
  } = useReferralStore();

  const [showModal, setShowModal] = useState(false);
  const [editingReferrer, setEditingReferrer] = useState(null);
  const [formData, setFormData] = useState({
    referrerName: '',
    referrerType: 'other',
    referrerContact: '',
    referrerEmail: '',
    referrerDepartment: '',
    bonusPerStudent: 0,
    notes: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  const referrerTypes = [
    { value: 'employee', label: 'Employee', icon: User, color: 'bg-blue-100 text-blue-700' },
    { value: 'agent', label: 'Agent', icon: Users, color: 'bg-green-100 text-green-700' },
    { value: 'student', label: 'Student', icon: User, color: 'bg-purple-100 text-purple-700' },
    { value: 'social_media', label: 'Social Media', icon: Award, color: 'bg-pink-100 text-pink-700' },
    { value: 'advertisement', label: 'Advertisement', icon: Award, color: 'bg-orange-100 text-orange-700' },
    { value: 'walk_in', label: 'Walk-in', icon: User, color: 'bg-gray-100 text-gray-700' },
    { value: 'other', label: 'Other', icon: Building, color: 'bg-gray-100 text-gray-700' }
  ];

  // Load referrers on mount
  useEffect(() => {
    loadReferrers();
  }, []);

  const loadReferrers = async () => {
    await fetchReferrers(1, filters);
  };

  const handleRefresh = () => {
    loadReferrers();
    toast.success('Referrers refreshed');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: localSearch });
    fetchReferrers(1, { ...filters, search: localSearch });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTypeFilter = (type) => {
    const newFilters = { ...filters, type: type === filters.type ? '' : type };
    setFilters(newFilters);
    fetchReferrers(1, newFilters);
  };

  const clearFilters = () => {
    resetFilters();
    setLocalSearch('');
    fetchReferrers(1, { search: '', type: '', isActive: true });
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleOpenModal = (referrer = null) => {
    if (referrer) {
      setEditingReferrer(referrer);
      setFormData({
        referrerName: referrer.referrerName || '',
        referrerType: referrer.referrerType || 'other',
        referrerContact: referrer.referrerContact || '',
        referrerEmail: referrer.referrerEmail || '',
        referrerDepartment: referrer.referrerDepartment || '',
        bonusPerStudent: referrer.bonusPerStudent || 0,
        notes: referrer.notes || '',
        isActive: referrer.isActive !== undefined ? referrer.isActive : true
      });
    } else {
      setEditingReferrer(null);
      setFormData({
        referrerName: '',
        referrerType: 'other',
        referrerContact: '',
        referrerEmail: '',
        referrerDepartment: '',
        bonusPerStudent: 0,
        notes: '',
        isActive: true
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.referrerName.trim()) errors.referrerName = 'Referrer name is required';
    if (!formData.referrerType) errors.referrerType = 'Referrer type is required';
    if (formData.bonusPerStudent < 0) errors.bonusPerStudent = 'Bonus cannot be negative';
    if (formData.referrerEmail && !/^\S+@\S+\.\S+$/.test(formData.referrerEmail)) {
      errors.referrerEmail = 'Enter a valid email address';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let result;
      if (editingReferrer) {
        result = await updateReferrer(editingReferrer._id, formData);
      } else {
        result = await createReferrer(formData);
      }
      
      if (result.success) {
        setShowModal(false);
        loadReferrers();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (referrer) => {
    if (referrer.studentsReferred?.length > 0) {
      toast.error(`Cannot delete ${referrer.referrerName} - they have ${referrer.studentsReferred.length} referred students. Deactivate instead.`);
      return;
    }
    setDeleteConfirm(referrer);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      const result = await deleteReferrer(deleteConfirm._id);
      if (result.success) {
        setDeleteConfirm(null);
        loadReferrers();
      }
    }
  };

  const handleGenerateCode = async (referrer) => {
    if (referrer.referrerCode) {
      toast.info(`${referrer.referrerName} already has code: ${referrer.referrerCode}`);
      return;
    }
    const result = await generateReferralCode(referrer._id);
    if (result.success) {
      loadReferrers();
    }
  };

  const getReferrerTypeDetails = (type) => {
    return referrerTypes.find(t => t.value === type) || referrerTypes[6];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Prepare export data
  const exportData = referrers.map(referrer => ({
    referrerName: referrer.referrerName,
    referrerType: getReferrerTypeDetails(referrer.referrerType)?.label || referrer.referrerType,
    referrerCode: referrer.referrerCode || 'Not generated',
    referrerContact: referrer.referrerContact || 'N/A',
    referrerEmail: referrer.referrerEmail || 'N/A',
    totalReferrals: referrer.totalReferrals || 0,
    bonusPerStudent: referrer.bonusPerStudent || 0,
    bonusEarned: referrer.bonusEarned || 0,
    bonusPaid: referrer.bonusPaid ? 'Yes' : 'No',
    status: referrer.isActive ? 'Active' : 'Inactive',
    created: formatDate(referrer.createdAt)
  }));

  const exportConfig = {
    title: 'Referrer Management Report',
    filename: 'referrer_management',
    columns: [
      { header: 'Referrer Name', accessor: 'referrerName', width: 20 },
      { header: 'Type', accessor: 'referrerType', width: 12 },
      { header: 'Referral Code', accessor: 'referrerCode', width: 12 },
      { header: 'Contact', accessor: 'referrerContact', width: 12 },
      { header: 'Email', accessor: 'referrerEmail', width: 20 },
      { header: 'Total Referrals', accessor: 'totalReferrals', width: 10 },
      { header: 'Bonus/Student (KSh)', accessor: 'bonusPerStudent', width: 12, type: 'currency' },
      { header: 'Bonus Earned (KSh)', accessor: 'bonusEarned', width: 12, type: 'currency' },
      { header: 'Bonus Paid', accessor: 'bonusPaid', width: 10 },
      { header: 'Status', accessor: 'status', width: 10 },
      { header: 'Created', accessor: 'created', width: 12 }
    ],
    summaryFields: [
      { label: 'Total Referrers', value: pagination.results || 0, format: 'number' },
      { label: 'Active Referrers', value: referrers.filter(r => r.isActive).length, format: 'number' },
      { label: 'Total Referrals', value: referrers.reduce((sum, r) => sum + (r.totalReferrals || 0), 0), format: 'number' },
      { label: 'Total Bonus Earned', value: referrers.reduce((sum, r) => sum + (r.bonusEarned || 0), 0), format: 'currency' }
    ]
  };

  if (user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Users className="w-8 h-8 mr-3 text-purple-600" />
                  Referrer Management
                </h1>
                <p className="mt-2 text-gray-600">
                  Create, edit, and manage all referral sources
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <ExportButtons
                data={exportData}
                config={exportConfig}
                filename="referrer_management"
                formats={['csv', 'excel', 'pdf', 'print', 'email']}
                includeDateRange={false}
                buttonStyle="default"
                buttonText="Export"
              />

              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Referrer
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Referrers</p>
                <p className="text-3xl font-bold text-gray-900">{pagination.results || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Referrers</p>
                <p className="text-3xl font-bold text-green-600">
                  {referrers.filter(r => r.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
                <p className="text-3xl font-bold text-blue-600">
                  {referrers.reduce((sum, r) => sum + (r.totalReferrals || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bonus Earned</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(referrers.reduce((sum, r) => sum + (r.bonusEarned || 0), 0))}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
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
                placeholder="Search by name, email, or code..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  filters.type ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {filters.type && <span className="ml-2 w-2 h-2 bg-purple-600 rounded-full"></span>}
              </button>

              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referrer Type
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleTypeFilter('')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    !filters.type ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {referrerTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => handleTypeFilter(type.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                      filters.type === type.value ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {(filters.type || localSearch) && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Referrers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : referrers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No referrers found</h3>
              <p className="text-gray-500 mb-4">
                {filters.search || filters.type ? 'Try adjusting your filters' : 'Get started by adding your first referrer'}
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Referrer
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referrer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referral Code
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referrals
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bonus/Student
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bonus Earned
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {referrers.map((referrer) => {
                    const typeDetails = getReferrerTypeDetails(referrer.referrerType);
                    const TypeIcon = typeDetails.icon;
                    const isExpanded = expandedRows.includes(referrer._id);

                    return (
                      <React.Fragment key={referrer._id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {referrer.referrerName?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {referrer.referrerName}
                                </div>
                                {referrer.referrerEmail && (
                                  <div className="text-xs text-gray-500 flex items-center">
                                    <Mail className="w-3 h-3 mr-1" />
                                    {referrer.referrerEmail}
                                  </div>
                                )}
                              </div>
                            </div>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeDetails.color}`}>
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {typeDetails.label}
                            </span>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {referrer.referrerCode ? (
                              <code className="text-xs font-mono font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                {referrer.referrerCode}
                              </code>
                            ) : (
                              <button
                                onClick={() => handleGenerateCode(referrer)}
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                              >
                                <Key className="w-3 h-3 mr-1" />
                                Generate Code
                              </button>
                            )}
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-lg font-bold text-gray-900">
                              {referrer.totalReferrals || 0}
                            </span>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm text-gray-600">
                              {formatCurrency(referrer.bonusPerStudent || 0)}
                            </span>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-green-600">
                              {formatCurrency(referrer.bonusEarned || 0)}
                            </span>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              referrer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {referrer.isActive ? 'Active' : 'Inactive'}
                            </span>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => toggleRowExpand(referrer._id)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded"
                                title="View details"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleOpenModal(referrer)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                title="Edit referrer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(referrer)}
                                className={`p-1 rounded ${referrer.studentsReferred?.length > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:text-red-800'}`}
                                title={referrer.studentsReferred?.length > 0 ? 'Cannot delete referrer with linked students' : 'Delete referrer'}
                                disabled={referrer.studentsReferred?.length > 0}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                           </td>
                         </tr>

                        {/* Expanded Row - Referred Students */}
                        {isExpanded && referrer.studentsReferred && referrer.studentsReferred.length > 0 && (
                          <tr className="bg-gray-50">
                            <td colSpan="8" className="px-6 py-4">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                  <Users className="w-4 h-4 mr-2 text-purple-600" />
                                  Referred Students ({referrer.studentsReferred.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {referrer.studentsReferred.map((student, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                                      <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                          <span className="text-blue-600 font-medium text-xs">
                                            {student.name?.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                          <p className="text-xs text-gray-500">{student.studentId}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
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
                  Showing page {pagination.current} of {pagination.total} ({pagination.results} total referrers)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchReferrers(pagination.current - 1, filters)}
                    disabled={pagination.current === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchReferrers(pagination.current + 1, filters)}
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

      {/* Add/Edit Referrer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  {editingReferrer ? 'Edit Referrer' : 'Add New Referrer'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Referrer Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referrer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.referrerName}
                    onChange={(e) => setFormData({ ...formData, referrerName: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      formErrors.referrerName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter referrer's full name"
                  />
                  {formErrors.referrerName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.referrerName}</p>
                  )}
                </div>

                {/* Referrer Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referrer Type *
                  </label>
                  <select
                    value={formData.referrerType}
                    onChange={(e) => setFormData({ ...formData, referrerType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {referrerTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Bonus Per Student */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bonus per Student (KSh)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.bonusPerStudent}
                      onChange={(e) => setFormData({ ...formData, bonusPerStudent: parseInt(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="0"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.referrerContact}
                      onChange={(e) => setFormData({ ...formData, referrerContact: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="0712345678"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.referrerEmail}
                      onChange={(e) => setFormData({ ...formData, referrerEmail: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="referrer@example.com"
                    />
                  </div>
                  {formErrors.referrerEmail && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.referrerEmail}</p>
                  )}
                </div>

                {/* Department (for employees) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.referrerDepartment}
                    onChange={(e) => setFormData({ ...formData, referrerDepartment: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Marketing, Sales"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Any additional notes about this referrer..."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingReferrer ? 'Update Referrer' : 'Create Referrer'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Referrer</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{deleteConfirm.referrerName}</strong>?
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReferrerManagement;