// src/pages/Expenses/ExpenseDetails.jsx
// Add this to your existing ExpenseDetails component

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import {
  ArrowLeft,
  Receipt,
  Building,
  Calendar,
  CreditCard,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Printer,
  Download,
  Loader,
  User,
  Check,
  X,
  Plus,
  Send, // ADD THIS IMPORT for Submit icon
} from "lucide-react";
import Layout from "../../components/Layout/Layout";
import { useExpenseStore } from "../../stores/expenseStore";
import { useAuthStore } from "../../stores/authStore";
import ExpenseBreakdown from "../../components/Expenses/ExpenseBreakdown";
import ApprovalModal from "../../components/Expenses/ApprovalModal";
import FundingSourceModal from "../../components/Expenses/FundingSourceModal";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../../utils/feeFormatter";
import toast from "react-hot-toast";

const ExpenseDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useAuthStore();
  const {
    currentExpense,
    fetchExpense,
    deleteExpense,
    approveExpense,
    payExpense,
    submitForApproval, // ADD THIS
    loading,
  } = useExpenseStore();

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load expense data on mount
  useEffect(() => {
    if (id) {
      loadExpense();
    }
  }, [id, location.state?.refresh]);

  const loadExpense = async () => {
    setRefreshing(true);
    const result = await fetchExpense(id); // This should call the API
    if (result.success) {
      console.log("Expense loaded:", result.data.status); // Debug log
    }
    setRefreshing(false);
  };

  const handleBack = () => {
    navigate("/expenses");
  };

  const handleEdit = () => {
    navigate(`/expenses/edit/${id}`);
  };

  const handleDelete = async () => {
    const result = await deleteExpense(id);
    if (result.success) {
      navigate("/expenses");
    }
    setDeleteConfirm(false);
  };

  // ADD THIS: Submit for approval handler
  const handleSubmitForApproval = async () => {
    const result = await submitForApproval(id);
    if (result.success) {
      await loadExpense();
    }
  };

  const handleApprove = async (comments) => {
    const result = await approveExpense(id, comments);
    if (result.success) {
      setShowApproveModal(false);
      loadExpense();
    }
  };

  const handlePay = async (data) => {
    // Ensure paymentDate is included in the data
    const payData = {
      ...data,
      paymentDate: data.paymentDate || new Date().toISOString().split("T")[0],
    };

    const result = await payExpense(id, payData);
    if (result.success) {
      setShowPayModal(false);
      await loadExpense(); // Refresh to show updated status
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!currentExpense) return;

    const headers = ["Item", "Category", "Quantity", "Unit Price", "Amount"];
    const itemsData =
      currentExpense.items?.map((item) => [
        item.description,
        item.category?.name || "N/A",
        item.quantity || 1,
        item.unitPrice || item.amount,
        item.amount,
      ]) || [];

    const csvContent = [
      ["EXPENSE DETAILS"],
      [`Expense #: ${currentExpense.expenseNumber}`],
      [`Vendor: ${currentExpense.vendor}`],
      [`Description: ${currentExpense.description}`],
      [`Date: ${formatDate(currentExpense.expenseDate)}`],
      [`Total Amount: ${formatCurrency(currentExpense.totalAmount)}`],
      [`Status: ${currentExpense.status}`],
      [],
      ["BREAKDOWN"],
      ...headers,
      ...itemsData,
      [],
      [`Total: ${formatCurrency(currentExpense.totalAmount)}`],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense_${currentExpense.expenseNumber}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Expense details exported");
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: {
        color: "bg-gray-100 text-gray-800",
        icon: FileText,
        label: "Draft",
      },
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        label: "Pending Approval",
      },
      approved: {
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
        label: "Approved",
      },
      paid: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Paid",
      },
      cancelled: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Cancelled",
      },
    };
    const config = badges[status] || badges.draft;
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        <Icon className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    );
  };

  const getPaymentMethodDisplay = (method) => {
    const methods = {
      bank_transfer: "Bank Transfer",
      mpesa: "M-Pesa",
      cash: "Cash",
      cheque: "Cheque",
      other: "Other",
    };
    return methods[method] || method;
  };

  // UPDATED: Button visibility conditions
  const canSubmit = currentExpense?.status === "draft";
  const canApprove =
    currentExpense?.status === "pending" && user?.role === "admin";
  const canPay =
    currentExpense?.status === "approved" && user?.role === "admin";
  const canEdit = currentExpense?.status === "draft" && user?.role === "admin";
  const canDelete = currentExpense?.status !== "paid" && user?.role === "admin";

  if (loading && !currentExpense && !refreshing) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </Layout>
    );
  }

  if (!currentExpense && !loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Expense not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The expense you're looking for doesn't exist.
          </p>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Back to Expenses
          </button>
        </div>
      </Layout>
    );
  }

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
                  <Receipt className="w-8 h-8 mr-3 text-red-600" />
                  Expense Details
                </h1>
                <p className="mt-2 text-gray-600">
                  {currentExpense?.expenseNumber} • {currentExpense?.vendor}
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
                    Delete Expense
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this expense?
                    </p>
                    <p className="text-sm font-mono text-gray-700 mt-1">
                      {currentExpense?.expenseNumber}
                    </p>
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

        {/* Status Banner - UPDATED with Submit button */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Status:</span>
            {getStatusBadge(currentExpense?.status)}
          </div>
          <div className="flex space-x-3">
            {/* NEW: Submit for Approval Button */}
            {canSubmit && (
              <button
                onClick={handleSubmitForApproval}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit for Approval
              </button>
            )}
            {canApprove && (
              <button
                onClick={() => setShowApproveModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve Expense
              </button>
            )}
            {canPay && (
              <button
                onClick={() => setShowPayModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Mark as Paid
              </button>
            )}
          </div>
        </div>

        {/* Rest of your component remains the same... */}
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Basic Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Expense Number</p>
                    <p className="font-mono text-gray-900">
                      {currentExpense?.expenseNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(currentExpense?.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Vendor</p>
                    <p className="font-medium text-gray-900">
                      {currentExpense?.vendor}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="text-gray-900">
                      {getPaymentMethodDisplay(currentExpense?.paymentMethod)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Expense Date</p>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {formatDate(currentExpense?.expenseDate)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Date</p>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {currentExpense?.paymentDate
                        ? formatDate(currentExpense.paymentDate)
                        : "Not paid yet"}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-900 mt-1">
                    {currentExpense?.description}
                  </p>
                </div>

                {currentExpense?.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                      {currentExpense?.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Breakdown Items Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Expense Breakdown
                </h2>
              </div>
              <div className="p-6">
                <ExpenseBreakdown items={currentExpense?.items || []} />
              </div>
            </div>

            {/* Funding Sources Card (if paid) */}
            {currentExpense?.fundingSources &&
              currentExpense.fundingSources.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Funding Sources
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {currentExpense.fundingSources.map((source, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {source.sourceType === "fees"
                                ? "Student Fees"
                                : source.sourceType === "director_investment"
                                  ? "Director Investment"
                                  : source.sourceType === "grant"
                                    ? "Grant"
                                    : source.sourceType === "donation"
                                      ? "Donation"
                                      : "Other Income"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Transaction:{" "}
                              {source.incomeTransactionId?.transactionNumber ||
                                "N/A"}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(source.amount)}
                          </p>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">
                            Total Funded
                          </span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(
                              currentExpense.fundingSources.reduce(
                                (sum, s) => sum + s.amount,
                                0,
                              ),
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Approval Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Approval & Payment
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <div className="flex items-center mt-1">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {currentExpense?.createdBy?.name || "System"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateTime(currentExpense?.createdAt)}
                  </p>
                </div>

                {currentExpense?.submittedBy && (
                  <div>
                    <p className="text-sm text-gray-500">Submitted By</p>
                    <div className="flex items-center mt-1">
                      <Send className="w-4 h-4 text-purple-500 mr-2" />
                      <span className="text-gray-900">
                        {currentExpense.submittedBy?.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(currentExpense.submittedAt)}
                    </p>
                  </div>
                )}

                {currentExpense?.approvedBy && (
                  <div>
                    <p className="text-sm text-gray-500">Approved By</p>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-gray-900">
                        {currentExpense.approvedBy?.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(currentExpense.approvedAt)}
                    </p>
                  </div>
                )}

                {currentExpense?.paidBy && (
                  <div>
                    <p className="text-sm text-gray-500">Paid By</p>
                    <div className="flex items-center mt-1">
                      <DollarSign className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-gray-900">
                        {currentExpense.paidBy?.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(currentExpense.paidAt)}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDateTime(currentExpense?.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 p-6">
              <h3 className="text-sm font-medium text-red-800 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {canSubmit && (
                  <button
                    onClick={handleSubmitForApproval}
                    className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit for Approval
                  </button>
                )}
                {canApprove && (
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Expense
                  </button>
                )}
                {canPay && (
                  <button
                    onClick={() => setShowPayModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </button>
                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ApprovalModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onApprove={handleApprove}
        expense={currentExpense}
        loading={loading}
      />

      <FundingSourceModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        onPay={handlePay}
        expense={currentExpense}
        loading={loading}
      />
    </Layout>
  );
};

export default ExpenseDetails;
