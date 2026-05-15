// src/pages/Directors/DirectorDetails.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  TrendingUp,
  Wallet,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  DollarSign,
  Loader,
  Printer,
  Download
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useDirectorStore } from '../../stores/directorStore';
import { useAuthStore } from '../../stores/authStore';
import InvestmentModal from '../../components/Directors/InvestmentModal';
import RepaymentModal from '../../components/Directors/RepaymentModal';
import InvestmentHistoryTable from '../../components/Directors/InvestmentHistoryTable';
import RepaymentHistoryTable from '../../components/Directors/RepaymentHistoryTable';
import { formatCurrency, formatDate } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const DirectorDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const {
    currentDirector,
    fetchDirector,
    deleteDirector,
    loading
  } = useDirectorStore();

  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('investments');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Load director data on mount
  useEffect(() => {
    if (id) {
      loadDirector();
    }
  }, [id]);

  const loadDirector = async () => {
    await fetchDirector(id);
  };

  const handleBack = () => {
    navigate('/directors');
  };

  const handleEdit = () => {
    navigate(`/directors/edit/${id}`);
  };

  const handleDelete = async () => {
    const result = await deleteDirector(id);
    if (result.success) {
      navigate('/directors');
    }
  };

  const handleAddInvestment = () => {
    setShowInvestmentModal(true);
  };

  const handleAddRepayment = () => {
    setShowRepaymentModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!currentDirector) return;

    const headers = ['Date', 'Type', 'Amount', 'Interest Rate', 'Repayment Terms', 'Reference'];
    const investmentData = currentDirector.investments?.map(inv => [
      formatDate(inv.incomeDate),
      inv.investmentType || 'Investment',
      inv.amount,
      inv.interestRate || 'N/A',
      inv.repaymentTerms || 'N/A',
      inv.reference || 'N/A'
    ]) || [];

    const csvContent = [headers, ...investmentData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDirector.name}_investments.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Investment history exported');
  };

  if (loading && !currentDirector) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!currentDirector && !loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Director not found</h3>
          <p className="mt-1 text-sm text-gray-500">The director you're looking for doesn't exist.</p>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Directors
          </button>
        </div>
      </Layout>
    );
  }

  const hasInvestments = (currentDirector?.totalInvested || 0) > 0;
  const repaymentPercentage = currentDirector?.totalInvested > 0
    ? ((currentDirector.totalRepaid / currentDirector.totalInvested) * 100).toFixed(1)
    : 0;

  const investments = currentDirector?.investments || [];
  const recentTransactions = currentDirector?.recentTransactions || [];

  return (
    <Layout>
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
                  <User className="w-8 h-8 mr-3 text-blue-600" />
                  Director Profile
                </h1>
                <p className="mt-2 text-gray-600">
                  Detailed information about {currentDirector?.name}
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

              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>

              {user?.role === 'admin' && (
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
                    Delete Director
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete <span className="font-semibold">{currentDirector?.name}</span>?
                    </p>
                    {hasInvestments && (
                      <p className="text-sm text-red-500 mt-2">
                        ⚠️ Warning: This director has invested {formatCurrency(currentDirector.totalInvested)}. 
                        This action cannot be undone.
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {currentDirector?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentDirector?.name}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentDirector?.role === 'chairman' ? 'bg-red-100 text-red-800' :
                      currentDirector?.role === 'secretary' ? 'bg-blue-100 text-blue-800' :
                      currentDirector?.role === 'treasurer' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {currentDirector?.role?.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentDirector?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {currentDirector?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 md:mt-0 flex space-x-3">
                <button
                  onClick={handleAddInvestment}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record Investment
                </button>

                {hasInvestments && (
                  <button
                    onClick={handleAddRepayment}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transition-all"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Record Repayment
                  </button>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{currentDirector?.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{currentDirector?.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>
                  {currentDirector?.address?.street}, {currentDirector?.address?.city}, {currentDirector?.address?.state}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Invested</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(currentDirector?.totalInvested || 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Repaid</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(currentDirector?.totalRepaid || 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Wallet className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Outstanding</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(currentDirector?.outstandingBalance || 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Repayment Rate</p>
            <p className="text-2xl font-bold text-purple-600">{repaymentPercentage}%</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-purple-500"
                style={{ width: `${repaymentPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('investments')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'investments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Investment History
            </button>
            <button
              onClick={() => setActiveTab('repayments')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'repayments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Repayment History
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Notes & Information
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'investments' && (
          <div className="space-y-6">
            {investments.length > 0 ? (
              <InvestmentHistoryTable investments={investments} />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Investments Yet</h3>
                <p className="text-gray-500">Record the first investment for this director.</p>
                <button
                  onClick={handleAddInvestment}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record Investment
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'repayments' && (
          <div className="space-y-6">
            {currentDirector?.totalRepaid > 0 ? (
              <RepaymentHistoryTable director={currentDirector} />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Repayments Yet</h3>
                <p className="text-gray-500">Record the first repayment when available.</p>
                {hasInvestments && (
                  <button
                    onClick={handleAddRepayment}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Record Repayment
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
            {currentDirector?.notes ? (
              <p className="text-gray-700 whitespace-pre-wrap">{currentDirector.notes}</p>
            ) : (
              <p className="text-gray-500 italic">No additional notes for this director.</p>
            )}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Shareholding</p>
                  <p className="font-medium text-gray-900">{currentDirector?.shareholding || 0}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Joined on</p>
                  <p className="font-medium text-gray-900">{formatDate(currentDirector?.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-medium text-gray-900">{formatDate(currentDirector?.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created By</p>
                  <p className="font-medium text-gray-900">{currentDirector?.createdBy?.name || 'System'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Section */}
        {recentTransactions.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-gray-500" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.sourceType === 'director_investment' ? 'Investment' : 'Transaction'}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.incomeDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(transaction.amount)}</p>
                    <p className="text-xs text-gray-500">{transaction.reference || 'No reference'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <InvestmentModal
        isOpen={showInvestmentModal}
        onClose={() => setShowInvestmentModal(false)}
        directorId={id}
        onSuccess={() => {
          setShowInvestmentModal(false);
          loadDirector();
        }}
      />

      <RepaymentModal
        isOpen={showRepaymentModal}
        onClose={() => setShowRepaymentModal(false)}
        director={currentDirector}
        onSuccess={() => {
          setShowRepaymentModal(false);
          loadDirector();
        }}
      />
    </Layout>
  );
};

export default DirectorDetails;