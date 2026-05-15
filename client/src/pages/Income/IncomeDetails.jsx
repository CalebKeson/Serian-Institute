// src/pages/Income/IncomeDetails.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  Edit,
  Trash2,
  Printer,
  Download,
  Loader,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Building,
  Heart,
  Coffee,
  Landmark,
  Wallet,
  PieChart,
  Link as LinkIcon
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useIncomeStore } from '../../stores/incomeStore';
import { useAuthStore } from '../../stores/authStore';
import AllocationModal from '../../components/Income/AllocationModal';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const IncomeDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const {
    currentIncomeTransaction,
    fetchIncomeTransaction,
    deleteIncomeTransaction,
    loading
  } = useIncomeStore();

  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load income data on mount
  useEffect(() => {
    if (id) {
      loadIncome();
    }
  }, [id]);

  const loadIncome = async () => {
    setRefreshing(true);
    await fetchIncomeTransaction(id);
    setRefreshing(false);
  };

  const handleBack = () => {
    navigate('/income');
  };

  const handleEdit = () => {
    navigate(`/income/edit/${id}`);
  };

  const handleDelete = async () => {
    const result = await deleteIncomeTransaction(id);
    if (result.success) {
      navigate('/income');
    }
    setDeleteConfirm(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!currentIncomeTransaction) return;

    const headers = ['Field', 'Value'];
    const data = [
      ['Transaction Number', currentIncomeTransaction.transactionNumber],
      ['Source Type', currentIncomeTransaction.sourceType],
      ['Amount', formatCurrency(currentIncomeTransaction.amount)],
      ['Date', formatDate(currentIncomeTransaction.incomeDate)],
      ['Payment Method', currentIncomeTransaction.paymentMethod],
      ['Reference', currentIncomeTransaction.reference || 'N/A'],
      ['Description', currentIncomeTransaction.description || 'N/A'],
      ['Status', currentIncomeTransaction.status],
      ['Allocated Amount', formatCurrency(currentIncomeTransaction.allocatedAmount || 0)],
      ['Unallocated Amount', formatCurrency(currentIncomeTransaction.unallocatedAmount || 0)]
    ];

    if (currentIncomeTransaction.sourceType === 'director_investment') {
      data.push(['Director', currentIncomeTransaction.directorId?.name || 'N/A']);
      data.push(['Investment Type', currentIncomeTransaction.investmentType || 'N/A']);
      data.push(['Repayment Terms', currentIncomeTransaction.repaymentTerms || 'N/A']);
      if (currentIncomeTransaction.interestRate) {
        data.push(['Interest Rate', `${currentIncomeTransaction.interestRate}%`]);
      }
    }

    if (currentIncomeTransaction.sourceType === 'grant') {
      data.push(['Donor Name', currentIncomeTransaction.donorName || 'N/A']);
      data.push(['Donor Type', currentIncomeTransaction.donorType || 'N/A']);
      data.push(['Grant Reference', currentIncomeTransaction.grantReference || 'N/A']);
      data.push(['Grant Period', currentIncomeTransaction.grantPeriod || 'N/A']);
    }

    if (currentIncomeTransaction.sourceType === 'donation') {
      data.push(['Donor Name', currentIncomeTransaction.donorName || 'N/A']);
      data.push(['Donor Type', currentIncomeTransaction.donorType || 'N/A']);
    }

    data.push(['Recorded By', currentIncomeTransaction.recordedBy?.name || 'System']);
    data.push(['Recorded At', formatDateTime(currentIncomeTransaction.createdAt)]);

    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income_${currentIncomeTransaction.transactionNumber}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Income details exported');
  };

  const getSourceIcon = (sourceType) => {
    const icons = {
      fees: Wallet,
      director_investment: Landmark,
      grant: Heart,
      donation: Heart,
      auxiliary: Coffee,
      other: FileText
    };
    const Icon = icons[sourceType] || TrendingUp;
    return Icon;
  };

  const getSourceColor = (sourceType) => {
    const colors = {
      fees: 'text-blue-600 bg-blue-100',
      director_investment: 'text-purple-600 bg-purple-100',
      grant: 'text-pink-600 bg-pink-100',
      donation: 'text-red-600 bg-red-100',
      auxiliary: 'text-orange-600 bg-orange-100',
      other: 'text-gray-600 bg-gray-100'
    };
    return colors[sourceType] || 'text-green-600 bg-green-100';
  };

  const getSourceLabel = (sourceType) => {
    const labels = {
      fees: 'Student Fees',
      director_investment: 'Director Investment',
      grant: 'Grant',
      donation: 'Donation',
      auxiliary: 'Auxiliary Income',
      other: 'Other Income'
    };
    return labels[sourceType] || sourceType;
  };

  const getStatusBadge = (status) => {
    const badges = {
      received: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Received' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      committed: { color: 'bg-blue-100 text-blue-800', icon: TrendingUp, label: 'Committed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' }
    };
    const config = badges[status] || badges.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading && !currentIncomeTransaction && !refreshing) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  if (!currentIncomeTransaction && !loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Income not found</h3>
          <p className="mt-1 text-sm text-gray-500">The income transaction you're looking for doesn't exist.</p>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Back to Income
          </button>
        </div>
      </Layout>
    );
  }

  const Icon = getSourceIcon(currentIncomeTransaction?.sourceType);
  const sourceColorClass = getSourceColor(currentIncomeTransaction?.sourceType);
  const allocationPercentage = currentIncomeTransaction?.amount > 0
    ? ((currentIncomeTransaction.allocatedAmount || 0) / currentIncomeTransaction.amount) * 100
    : 0;
  const canAllocate = currentIncomeTransaction?.status === 'received' && currentIncomeTransaction?.unallocatedAmount > 0;
  const canEdit = currentIncomeTransaction?.status !== 'cancelled' && currentIncomeTransaction?.allocatedAmount === 0;
  const canDelete = currentIncomeTransaction?.allocatedAmount === 0 && currentIncomeTransaction?.status !== 'cancelled';

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
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
                  <Icon className="w-8 h-8 mr-3 text-green-600" />
                  Income Details
                </h1>
                <p className="mt-2 text-gray-600">
                  {currentIncomeTransaction?.transactionNumber}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>

              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>

              {canEdit && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-white">
              <div className="mt-3">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delete Income Transaction
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this income transaction?
                    </p>
                    <p className="text-sm font-mono text-gray-700 mt-1">
                      {currentIncomeTransaction?.transactionNumber}
                    </p>
                    {currentIncomeTransaction?.allocatedAmount > 0 && (
                      <p className="text-sm text-red-500 mt-2">
                        ⚠️ Warning: This income has been allocated to expenses ({formatCurrency(currentIncomeTransaction.allocatedAmount)}).
                        Deleting it will affect linked expenses.
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Banner */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Status:</span>
            {getStatusBadge(currentIncomeTransaction?.status)}
          </div>
          {canAllocate && (
            <button
              onClick={() => setShowAllocateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PieChart className="w-4 h-4 mr-2" />
              Allocate to Expenses
            </button>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Transaction Number</p>
                    <p className="font-mono text-gray-900">{currentIncomeTransaction?.transactionNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(currentIncomeTransaction?.amount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Income Date</p>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {formatDate(currentIncomeTransaction?.incomeDate)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <div className="flex items-center text-gray-900">
                      <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                      {currentIncomeTransaction?.paymentMethod?.replace('_', ' ') || 'N/A'}
                    </div>
                  </div>
                </div>

                {currentIncomeTransaction?.reference && (
                  <div>
                    <p className="text-sm text-gray-500">Reference / Transaction ID</p>
                    <p className="text-gray-900 font-mono text-sm">{currentIncomeTransaction.reference}</p>
                  </div>
                )}

                {currentIncomeTransaction?.description && (
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-gray-900">{currentIncomeTransaction.description}</p>
                  </div>
                )}

                {currentIncomeTransaction?.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{currentIncomeTransaction.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Source Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${sourceColorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Source Details</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${sourceColorClass}`}>
                    {getSourceLabel(currentIncomeTransaction?.sourceType)}
                  </span>
                </div>

                {/* Director Investment Details */}
                {currentIncomeTransaction?.sourceType === 'director_investment' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <User className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">{currentIncomeTransaction.directorId?.name}</p>
                        <p className="text-sm text-gray-500">{currentIncomeTransaction.directorId?.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Investment Type</p>
                        <p className="font-medium text-gray-900 capitalize">{currentIncomeTransaction.investmentType || 'Equity'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Repayment Terms</p>
                        <p className="font-medium text-gray-900 capitalize">{currentIncomeTransaction.repaymentTerms || 'Shares'}</p>
                      </div>
                    </div>
                    {currentIncomeTransaction.interestRate && (
                      <div>
                        <p className="text-sm text-gray-500">Interest Rate</p>
                        <p className="font-medium text-gray-900">{currentIncomeTransaction.interestRate}%</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Grant Details */}
                {currentIncomeTransaction?.sourceType === 'grant' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-pink-50 rounded-lg">
                      <p className="text-sm text-gray-500">Donor</p>
                      <p className="font-medium text-gray-900">{currentIncomeTransaction.donorName}</p>
                      <p className="text-sm text-gray-500 capitalize">{currentIncomeTransaction.donorType}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Grant Reference</p>
                        <p className="font-mono text-gray-900">{currentIncomeTransaction.grantReference || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Grant Period</p>
                        <p className="text-gray-900">{currentIncomeTransaction.grantPeriod || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Donation Details */}
                {currentIncomeTransaction?.sourceType === 'donation' && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-500">Donor</p>
                    <p className="font-medium text-gray-900">{currentIncomeTransaction.donorName}</p>
                    <p className="text-sm text-gray-500 capitalize">{currentIncomeTransaction.donorType}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Allocation Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-purple-600" />
                  Allocation Status
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount</span>
                  <span className="font-bold text-gray-900">{formatCurrency(currentIncomeTransaction?.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Allocated to Expenses</span>
                  <span className="font-bold text-purple-600">{formatCurrency(currentIncomeTransaction?.allocatedAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Unallocated</span>
                  <span className={`font-bold ${currentIncomeTransaction?.unallocatedAmount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    {formatCurrency(currentIncomeTransaction?.unallocatedAmount || 0)}
                  </span>
                </div>

                <div className="pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-purple-500"
                      style={{ width: `${Math.min(100, allocationPercentage)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    {allocationPercentage.toFixed(1)}% allocated
                  </p>
                </div>

                {canAllocate && (
                  <button
                    onClick={() => setShowAllocateModal(true)}
                    className="w-full mt-4 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Allocate to Expenses
                  </button>
                )}
              </div>
            </div>

            {/* Linked Expenses Card (if any) */}
            {currentIncomeTransaction?.linkedExpenses && currentIncomeTransaction.linkedExpenses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <LinkIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Linked Expenses
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {currentIncomeTransaction.linkedExpenses.map((expense, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/expenses/${expense._id}`)}>
                      <p className="font-medium text-gray-900">{expense.expenseNumber}</p>
                      <p className="text-sm text-gray-500 truncate">{expense.vendor} - {expense.description}</p>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-gray-400">{formatDate(expense.expenseDate)}</span>
                        <span className="text-sm font-medium text-red-600">{formatCurrency(expense.allocatedAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Metadata</h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Recorded By</p>
                  <p className="text-sm text-gray-900">{currentIncomeTransaction?.recordedBy?.name || 'System'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recorded At</p>
                  <p className="text-sm text-gray-900">{formatDateTime(currentIncomeTransaction?.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">{formatDateTime(currentIncomeTransaction?.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Transaction ID</p>
                  <p className="text-xs font-mono text-gray-500 break-all">{currentIncomeTransaction?._id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation Modal */}
      <AllocationModal
        isOpen={showAllocateModal}
        onClose={() => setShowAllocateModal(false)}
        income={currentIncomeTransaction}
        onSuccess={() => {
          setShowAllocateModal(false);
          loadIncome();
        }}
      />
    </Layout>
  );
};

export default IncomeDetails;