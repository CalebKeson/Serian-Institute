// frontend/src/pages/Reports/ReferralReport.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Users,
  Trophy,
  Award,
  TrendingUp,
  Download,
  RefreshCw,
  Filter,
  Search,
  Loader,
  User,
  Building,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Hash,
  Mail,
  Phone
} from 'lucide-react';
import { useReferralStore } from '../../stores/referralStore';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../utils/feeFormatter';
import ExportButtons from '../../components/Fees/ExportButtons';
import toast from 'react-hot-toast';

const ReferralReport = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    referrers,
    leaderboard,
    referralStats,
    loading,
    fetchReferrers,
    fetchLeaderboard,
    fetchReferralStats,
    recordBonusPayment,
    pagination
  } = useReferralStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [expandedRows, setExpandedRows] = useState([]);
  const [bonusModal, setBonusModal] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchReferrers(1, { search: searchTerm, type: typeFilter }),
      fetchLeaderboard({ limit: 10 }),
      fetchReferralStats()
    ]);
  };

  const handleRefresh = () => {
    loadData();
    toast.success('Data refreshed');
  };

  const handleBack = () => {
    navigate('/reports');
  };

  const handleSearch = () => {
    fetchReferrers(1, { search: searchTerm, type: typeFilter });
  };

  const handleTypeFilter = (type) => {
    setTypeFilter(type);
    fetchReferrers(1, { search: searchTerm, type });
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRecordBonus = async (referrer) => {
    setBonusModal(referrer);
  };

  const handleConfirmBonus = async (referrerId, amount, reference) => {
    const result = await recordBonusPayment(referrerId, {
      amount,
      paymentReference: reference,
      notes: `Bonus payment for ${referrer.totalReferrals} referrals`
    });
    
    if (result.success) {
      setBonusModal(null);
      loadData();
    }
  };

  const handleViewReferrerDetails = (referrerId) => {
    navigate(`/referrals/${referrerId}`);
  };

  const getReferrerTypeLabel = (type) => {
    const labels = {
      employee: 'Employee',
      agent: 'Agent',
      student: 'Student',
      social_media: 'Social Media',
      advertisement: 'Advertisement',
      walk_in: 'Walk-in',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getReferrerTypeIcon = (type) => {
    const icons = {
      employee: Building,
      agent: Users,
      student: User,
      social_media: Award,
      advertisement: Award,
      walk_in: User,
      other: User
    };
    const Icon = icons[type] || User;
    return <Icon className="w-4 h-4" />;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Award className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  // Prepare export data
  const exportData = referrers.map(referrer => ({
    referrerName: referrer.referrerName,
    referrerType: getReferrerTypeLabel(referrer.referrerType),
    referrerCode: referrer.referrerCode || 'N/A',
    totalReferrals: referrer.totalReferrals || 0,
    bonusEarned: referrer.bonusEarned || 0,
    bonusPerStudent: referrer.bonusPerStudent || 0,
    bonusPaid: referrer.bonusPaid ? 'Yes' : 'No',
    status: referrer.isActive ? 'Active' : 'Inactive'
  }));

  const exportConfig = {
    title: 'Referral Report',
    filename: 'referral_report',
    columns: [
      { header: 'Referrer Name', accessor: 'referrerName', width: 20 },
      { header: 'Type', accessor: 'referrerType', width: 12 },
      { header: 'Referral Code', accessor: 'referrerCode', width: 12 },
      { header: 'Total Referrals', accessor: 'totalReferrals', width: 10 },
      { header: 'Bonus Earned (KSh)', accessor: 'bonusEarned', width: 15, type: 'currency' },
      { header: 'Bonus per Student (KSh)', accessor: 'bonusPerStudent', width: 15, type: 'currency' },
      { header: 'Bonus Paid', accessor: 'bonusPaid', width: 10 },
      { header: 'Status', accessor: 'status', width: 10 }
    ],
    summaryFields: [
      { label: 'Total Referrers', value: referralStats?.totalReferrers || 0, format: 'number' },
      { label: 'Total Referrals', value: referralStats?.totalReferrals || 0, format: 'number' },
      { label: 'Total Bonus Earned', value: referralStats?.totalBonusEarned || 0, format: 'currency' },
      { label: 'Total Bonus Paid', value: referralStats?.totalBonusPaid || 0, format: 'currency' },
      { label: 'Unpaid Bonus', value: (referralStats?.totalBonusEarned || 0) - (referralStats?.totalBonusPaid || 0), format: 'currency' }
    ]
  };

  if (loading && !referrers.length) {
    return (
      <>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading referral data...</p>
          </div>
        </div>
      </>
    );
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
                  Referral Report
                </h1>
                <p className="mt-2 text-gray-600">
                  Track referrers, referrals, and bonus payments
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
                filename="referral_report"
                formats={['csv', 'excel', 'pdf', 'print', 'email']}
                includeDateRange={false}
                buttonStyle="default"
                buttonText="Export Report"
              />
            </div>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Referrers</p>
                <p className="text-3xl font-bold text-gray-900">
                  {referralStats?.totalReferrers || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
                <p className="text-3xl font-bold text-green-600">
                  {referralStats?.totalReferrals || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bonus Earned</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(referralStats?.totalBonusEarned || 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unpaid Bonus</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency((referralStats?.totalBonusEarned || 0) - (referralStats?.totalBonusPaid || 0))}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'leaderboard'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('referrers')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'referrers'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              All Referrers
            </button>
          </nav>
        </div>

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                Top Referrers
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {leaderboard.length > 0 ? (
                leaderboard.map((referrer, index) => {
                  const rank = referrer.rank || index + 1;
                  const rankIcon = getRankIcon(rank);
                  
                  return (
                    <div key={referrer._id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 text-center">
                            {rankIcon || (
                              <span className="text-lg font-bold text-gray-400">#{rank}</span>
                            )}
                          </div>
                          <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {referrer.referrerName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {referrer.referrerName}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span className="capitalize">{getReferrerTypeLabel(referrer.referrerType)}</span>
                              {referrer.referrerDepartment && (
                                <>
                                  <span>•</span>
                                  <span>{referrer.referrerDepartment}</span>
                                </>
                              )}
                              {referrer.referrerCode && (
                                <>
                                  <span>•</span>
                                  <code className="text-purple-600">{referrer.referrerCode}</code>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Referrals</p>
                            <p className="text-xl font-bold text-gray-900">
                              {referrer.totalReferrals}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Bonus Earned</p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(referrer.bonusEarned)}
                            </p>
                          </div>
                          <div className="text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              referrer.bonusPaid 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {referrer.bonusPaid ? 'Bonus Paid' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No referrers found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Referrers Tab */}
        {activeTab === 'referrers' && (
          <>
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search referrers by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => handleTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">All Types</option>
                    <option value="employee">Employee</option>
                    <option value="agent">Agent</option>
                    <option value="student">Student</option>
                    <option value="social_media">Social Media</option>
                    <option value="advertisement">Advertisement</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="other">Other</option>
                  </select>

                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Referrers Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                        Code
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referrals
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bonus Earned
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bonus per Student
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
                    {referrers.length > 0 ? (
                      referrers.map((referrer) => {
                        const isExpanded = expandedRows.includes(referrer._id);
                        
                        return (
                          <React.Fragment key={referrer._id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
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
                                      <div className="text-xs text-gray-500">
                                        {referrer.referrerEmail}
                                      </div>
                                    )}
                                    {referrer.referrerContact && (
                                      <div className="text-xs text-gray-400">
                                        {referrer.referrerContact}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {getReferrerTypeIcon(referrer.referrerType)}
                                  <span className="ml-1 capitalize">{getReferrerTypeLabel(referrer.referrerType)}</span>
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <code className="text-xs font-mono font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                  {referrer.referrerCode || 'Not generated'}
                                </code>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="text-lg font-bold text-gray-900">
                                  {referrer.totalReferrals || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="text-sm font-medium text-green-600">
                                  {formatCurrency(referrer.bonusEarned || 0)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="text-sm text-gray-600">
                                  {formatCurrency(referrer.bonusPerStudent || 0)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  referrer.isActive 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {referrer.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => toggleRowExpand(referrer._id)}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                                    title="View details"
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                  
                                  {referrer.totalReferrals > 0 && !referrer.bonusPaid && (
                                    <button
                                      onClick={() => handleRecordBonus(referrer)}
                                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                      title="Record bonus payment"
                                    >
                                      <DollarSign className="w-4 h-4" />
                                    </button>
                                  )}
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
                                              <p className="text-sm font-medium text-gray-900">
                                                {student.name}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {student.studentId}
                                              </p>
                                              <p className="text-xs text-gray-400">
                                                Referred: {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : 'N/A'}
                                              </p>
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
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-lg font-medium text-gray-900 mb-2">No referrers found</p>
                          <p className="text-sm">
                            {searchTerm || typeFilter
                              ? 'Try adjusting your search or filters'
                              : 'No referrers have been added yet'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total > 1 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page {pagination.current} of {pagination.total} ({pagination.results} total referrers)
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchReferrers(pagination.current - 1, { search: searchTerm, type: typeFilter })}
                        disabled={pagination.current === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => fetchReferrers(pagination.current + 1, { search: searchTerm, type: typeFilter })}
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
          </>
        )}
      </div>

      {/* Bonus Payment Modal */}
      {bonusModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Record Bonus Payment</h3>
              <button
                onClick={() => setBonusModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Referrer</p>
                <p className="font-medium text-gray-900">{bonusModal.referrerName}</p>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-500">Referrals:</span>
                  <span className="font-bold">{bonusModal.totalReferrals}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bonus Earned:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(bonusModal.bonusEarned)}
                  </span>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleConfirmBonus(
                  bonusModal._id,
                  parseFloat(formData.get('amount')),
                  formData.get('reference')
                );
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount (KSh)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    defaultValue={bonusModal.bonusEarned}
                    step="100"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Reference
                  </label>
                  <input
                    type="text"
                    name="reference"
                    placeholder="e.g., BONUS-001, M-PESA Reference"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setBonusModal(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReferralReport;