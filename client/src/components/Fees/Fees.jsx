// src/components/Fees/Fees.jsx - UPDATED TO USE FIXED OUTSTANDING REPORT

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  RefreshCw,
  Plus,
  Wallet,
  Landmark,
  Smartphone,
  AlertCircle,
  Loader,
  Calendar,
  Filter,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { usePaymentStore } from "../../stores/paymentStore";
import { useAuthStore } from "../../stores/authStore";
import { formatCurrency, getPaymentMethodInfo } from "../../utils/feeFormatter";
import PaymentMethodChart from "./PaymentMethodChart";
import OutstandingTable from "./OutstandingTable";
import ExportButtons from "./ExportButtons";
import { feesDashboardExportConfig } from "../../utils/exportConfigs";
import toast from "react-hot-toast";

const Fees = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    payments,
    paymentStats,
    outstandingReport,
    loading,
    fetchPayments,
    fetchPaymentStats,
    fetchOutstandingReport,
    exportPayments,
  } = usePaymentStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    paymentMethod: "",
    paymentFor: "",
    status: "completed",
  });

  // State for calculated totals
  const [calculatedTotals, setCalculatedTotals] = useState({
    totalFees: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    totalPayments: 0,
    collectionRate: 0,
    totalStudents: 0,
    fullyPaidStudents: 0,
    partialStudents: 0,
    unpaidStudents: 0,
  });

  // Get ALL payments
  const allPayments = payments || [];

  // Calculate stats from payments data
  const calculateStatsFromPayments = useCallback(() => {
    if (!allPayments.length) {
      return {
        totalAmount: 0,
        totalPayments: 0,
        averageAmount: 0,
        minAmount: 0,
        maxAmount: 0,
        byMethod: [],
        recentPayments: [],
      };
    }

    const totalAmount = allPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0,
    );
    const totalPayments = allPayments.length;
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;
    const amounts = allPayments.map((p) => p.amount || 0);
    const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0;
    const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;

    const methodMap = new Map();
    allPayments.forEach((payment) => {
      const method = payment.paymentMethod || "other";
      if (!methodMap.has(method)) {
        methodMap.set(method, { total: 0, count: 0 });
      }
      methodMap.get(method).total += payment.amount || 0;
      methodMap.get(method).count++;
    });

    const byMethod = Array.from(methodMap.entries()).map(([method, data]) => {
      const methodInfo = getPaymentMethodInfo(method);
      return {
        method,
        total: data.total,
        count: data.count,
        methodDisplay: methodInfo?.label || method,
        percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
      };
    });

    const recentPayments = [...allPayments]
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
      .slice(0, 10)
      .map((payment) => ({
        ...payment,
        studentName:
          payment.student?.user?.name || payment.studentName || "N/A",
        studentId: payment.student?.studentId || payment.studentId || "N/A",
        courseName: payment.course?.name || payment.courseName || "N/A",
        courseCode: payment.course?.courseCode || payment.courseCode || "N/A",
        paymentMethodDisplay:
          payment.paymentMethodDisplay || payment.paymentMethod,
        payerName: payment.payerName || "N/A",
        receiptNumber: payment.receiptNumber || "N/A",
        paymentDate: payment.paymentDate,
      }));

    return {
      totalAmount,
      totalPayments,
      averageAmount,
      minAmount,
      maxAmount,
      byMethod,
      recentPayments,
    };
  }, [allPayments]);

  // Get stats
  const stats = useMemo(() => {
    const hasStatsData = paymentStats?.totalStats?.[0]?.totalAmount > 0;

    if (hasStatsData) {
      return {
        totalAmount: paymentStats.totalStats[0].totalAmount,
        totalPayments: paymentStats.totalStats[0].totalPayments,
        averageAmount: paymentStats.totalStats[0].averageAmount || 0,
        minAmount: paymentStats.totalStats[0].minAmount || 0,
        maxAmount: paymentStats.totalStats[0].maxAmount || 0,
        byMethod: paymentStats.byMethod || [],
        recentPayments: paymentStats.recentPayments || [],
      };
    }

    return calculateStatsFromPayments();
  }, [paymentStats, allPayments, calculateStatsFromPayments]);

  const recentPayments = stats.recentPayments || [];

  // Calculate total fees from ALL students (now includes completed/graduated)
  const calculateTotalFees = useCallback(() => {
    try {
      const allStudents = outstandingReport?.students || [];

      // If no students, use fallback calculation
      if (allStudents.length === 0) {
        const totalFees = stats.totalAmount || 0;
        const outstandingBalance =
          outstandingReport?.summary?.totalOutstanding || 0;
        const totalPaid = totalFees - outstandingBalance;

        setCalculatedTotals({
          totalFees,
          totalPaid,
          outstandingBalance,
          totalPayments: stats.totalPayments,
          collectionRate:
            totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0,
          totalStudents: 0,
          fullyPaidStudents: 0,
          partialStudents: 0,
          unpaidStudents: 0,
        });
        return;
      }

      let totalFees = 0;
      let totalPaid = 0;
      let totalStudents = 0;
      let fullyPaidStudents = 0;
      let partialStudents = 0;
      let unpaidStudents = 0;

      allStudents.forEach((student) => {
        // Skip students with no fees
        if (!student.totalFees && !student.totalPaid) return;

        totalFees += student.totalFees || 0;
        totalPaid += student.totalPaid || 0;
        totalStudents++;

        const balance = (student.totalFees || 0) - (student.totalPaid || 0);
        if (balance === 0 && (student.totalPaid || 0) > 0) {
          fullyPaidStudents++;
        } else if ((student.totalPaid || 0) > 0 && balance > 0) {
          partialStudents++;
        } else if (
          (student.totalPaid || 0) === 0 &&
          (student.totalFees || 0) > 0
        ) {
          unpaidStudents++;
        }
      });

      const outstandingBalance = totalFees - totalPaid;
      const collectionRate =
        totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0;

      setCalculatedTotals({
        totalFees,
        totalPaid,
        outstandingBalance,
        totalPayments: stats.totalPayments,
        collectionRate,
        totalStudents,
        fullyPaidStudents,
        partialStudents,
        unpaidStudents,
      });

      console.log("📊 Calculated Totals (ALL STUDENTS):", {
        totalFees,
        totalPaid,
        outstandingBalance,
        totalPayments: stats.totalPayments,
        collectionRate,
        totalStudents,
        fullyPaidStudents,
        partialStudents,
        unpaidStudents,
        totalStudentsFromReport: allStudents.length,
      });
    } catch (error) {
      console.error("Error calculating total fees:", error);
    }
  }, [outstandingReport, stats]);

  // Load data on mount and recalculate when data changes
  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (outstandingReport || stats.totalAmount > 0) {
      calculateTotalFees();
    }
  }, [outstandingReport, stats, calculateTotalFees]);

  const loadDashboardData = async () => {
    try {
      console.log("🔄 Loading dashboard data (ALL records)...");

      // Force clear cache before fetching
      const { clearCache, refreshOutstandingReport } =
        usePaymentStore.getState();

      // Clear any stale cache
      clearCache();

      // Fetch fresh data
      const paymentsResult = await fetchPayments({ limit: 100 });
      console.log(
        "📊 Payments fetched:",
        paymentsResult?.data?.length || 0,
        "records",
      );

      const statsResult = await fetchPaymentStats();
      console.log("📊 Stats fetched:", statsResult);

      // Use refreshOutstandingReport to force fresh data
      const outstandingResult = await refreshOutstandingReport();
      console.log(
        "📊 Outstanding report fetched (refreshed):",
        outstandingResult,
      );

      console.log("✅ Dashboard data loaded successfully");
      setIsInitialized(true);

      // Calculate totals after data is loaded
      if (outstandingResult?.data || statsResult?.data) {
        await calculateTotalFees();
      }
    } catch (error) {
      console.error("❌ Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
      setIsInitialized(true);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    toast.loading("Refreshing dashboard...", { id: "refresh" });

    try {
      await Promise.all([
        fetchPayments({ limit: 100 }),
        fetchPaymentStats(),
        fetchOutstandingReport(),
      ]);
      await calculateTotalFees();
      toast.success("Dashboard refreshed", { id: "refresh" });
    } catch (error) {
      toast.error("Failed to refresh", { id: "refresh" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDateRangeApply = () => {
    setShowDatePicker(false);
    if (dateRange.startDate && dateRange.endDate) {
      fetchPayments({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 100,
      });
      fetchPaymentStats({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    }
  };

  const handleDateRangeClear = () => {
    setDateRange({ startDate: "", endDate: "" });
    setShowDatePicker(false);
    fetchPayments({ limit: 100 });
    fetchPaymentStats();
    toast.success("Date filter cleared");
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    fetchPayments({ [key]: value, limit: 100 });
  };

  const clearFilters = () => {
    setFilters({ paymentMethod: "", paymentFor: "", status: "completed" });
    fetchPayments({ limit: 100 });
    toast.success("Filters cleared");
  };

  const handleViewAllPayments = () => {
    navigate("/fees/history");
  };

  const handleViewStudentFees = (studentId) => {
    navigate(`/fees/student/${studentId}`);
  };

  const handleRecordPayment = () => {
    navigate("/fees/record-payment");
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      mpesa: Smartphone,
      cooperative_bank: Landmark,
      family_bank: Landmark,
      cash: Wallet,
      other: CreditCard,
    };
    const Icon = icons[method] || CreditCard;
    return <Icon className="w-4 h-4" />;
  };

  const getMethodInfo = (method) => {
    const info = {
      mpesa: { label: "M-Pesa", bgColor: "bg-green-100", color: "green" },
      cooperative_bank: {
        label: "Co-op Bank",
        bgColor: "bg-blue-100",
        color: "blue",
      },
      family_bank: {
        label: "Family Bank",
        bgColor: "bg-purple-100",
        color: "purple",
      },
      cash: { label: "Cash", bgColor: "bg-yellow-100", color: "yellow" },
      other: { label: "Other", bgColor: "bg-gray-100", color: "gray" },
    };
    return info[method] || info.other;
  };

  // Prepare export data
  const exportData = useMemo(() => {
    const paymentsToExport =
      recentPayments.length > 0 ? recentPayments : allPayments;

    return paymentsToExport.map((payment) => ({
      date: new Date(payment.paymentDate).toLocaleDateString(),
      studentName: payment.studentName || payment.student?.user?.name || "N/A",
      studentId: payment.studentId || payment.student?.studentId || "N/A",
      course: payment.courseName || payment.course?.name || "N/A",
      courseCode: payment.courseCode || payment.course?.courseCode || "N/A",
      amount: payment.amount,
      payerName: payment.payerName || "N/A",
      receiptNumber: payment.receiptNumber || "N/A",
      reference: payment.transactionId || payment.paymentReference || "N/A",
      paymentMethod: payment.paymentMethodDisplay || payment.paymentMethod,
      status: payment.status || "completed",
    }));
  }, [recentPayments, allPayments]);

  const exportSummary = useMemo(
    () => ({
      totalFees: calculatedTotals.totalFees,
      totalCollected: calculatedTotals.totalPaid,
      outstandingBalance: calculatedTotals.outstandingBalance,
      totalPayments: calculatedTotals.totalPayments,
      collectionRate: calculatedTotals.collectionRate,
      totalStudents: calculatedTotals.totalStudents,
      fullyPaidStudents: calculatedTotals.fullyPaidStudents,
      partialStudents: calculatedTotals.partialStudents,
      unpaidStudents: calculatedTotals.unpaidStudents,
    }),
    [calculatedTotals],
  );

  const activeFilterCount =
    Object.values(filters).filter((v) => v && v !== "" && v !== "completed")
      .length +
    (dateRange.startDate ? 1 : 0) +
    (dateRange.endDate ? 1 : 0);

  // Debug log
  console.log("📊 Fees Dashboard Stats:", {
    totalFees: calculatedTotals.totalFees,
    totalPaid: calculatedTotals.totalPaid,
    outstandingBalance: calculatedTotals.outstandingBalance,
    totalPayments: calculatedTotals.totalPayments,
    collectionRate: calculatedTotals.collectionRate,
    totalStudents: calculatedTotals.totalStudents,
    fullyPaidStudents: calculatedTotals.fullyPaidStudents,
    partialStudents: calculatedTotals.partialStudents,
    unpaidStudents: calculatedTotals.unpaidStudents,
    outstandingReportStudents: outstandingReport?.students?.length || 0,
    allPayments: allPayments.length,
  });

  if (!isInitialized && loading && !allPayments.length) {
    return (
      <>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <DollarSign className="w-8 h-8 mr-3 text-green-600" />
                Fees & Payments Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Manage all fee collections, payments, and outstanding balances
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  activeFilterCount > 0
                    ? "bg-green-100 border-green-300 text-green-700"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  dateRange.startDate || dateRange.endDate
                    ? "bg-green-100 border-green-300 text-green-700"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </button>

              <ExportButtons
                data={exportData}
                config={feesDashboardExportConfig}
                filename="fees_dashboard_report"
                formats={["csv", "excel", "pdf", "print", "email"]}
                includeDateRange={false}
                buttonStyle="default"
                buttonText={`Export Report (${exportData.length} records)`}
                customSummaryData={exportSummary}
              />

              <button
                onClick={handleRecordPayment}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Record Payment
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Picker Modal */}
        {showDatePicker && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-3 sm:space-y-0">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleDateRangeApply}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Apply Filter
                </button>
                <button
                  onClick={handleDateRangeClear}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Note: Leave dates empty to show ALL payment records
            </p>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) =>
                    handleFilterChange("paymentMethod", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Methods</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="cooperative_bank">Co-operative Bank</option>
                  <option value="family_bank">Family Bank</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Purpose
                </label>
                <select
                  value={filters.paymentFor}
                  onChange={(e) =>
                    handleFilterChange("paymentFor", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Purposes</option>
                  <option value="tuition">Tuition Fee</option>
                  <option value="registration">Registration Fee</option>
                  <option value="exam_fee">Examination Fee</option>
                  <option value="lab_fee">Skills Lab Fee</option>
                  <option value="materials">Learning Materials</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="">All Statuses</option>
                </select>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center"
                >
                  <X className="w-4 h-4 mr-1" /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Fees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculatedTotals.totalFees)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {calculatedTotals.totalStudents} students enrolled
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculatedTotals.totalPaid)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {calculatedTotals.totalPayments} transactions
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
                <p className="text-sm text-gray-600 mb-1">
                  Outstanding Balance
                </p>
                <p
                  className={`text-2xl font-bold ${
                    calculatedTotals.outstandingBalance > 0
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {formatCurrency(calculatedTotals.outstandingBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {calculatedTotals.partialStudents +
                    calculatedTotals.unpaidStudents}{" "}
                  students owe
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Payments</p>
                <p className="text-2xl font-bold text-blue-600">
                  {calculatedTotals.totalPayments}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {calculatedTotals.fullyPaidStudents} fully paid
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(calculatedTotals.collectionRate)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {calculatedTotals.totalFees > 0
                    ? `${formatCurrency(calculatedTotals.totalPaid)} / ${formatCurrency(calculatedTotals.totalFees)}`
                    : "No fees"}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Student Payment Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Fully Paid</p>
                <p className="text-2xl font-bold text-green-700">
                  {calculatedTotals.fullyPaidStudents}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {calculatedTotals.totalStudents > 0
                    ? Math.round(
                        (calculatedTotals.fullyPaidStudents /
                          calculatedTotals.totalStudents) *
                          100,
                      )
                    : 0}
                  % of students
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Partial Payment</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {calculatedTotals.partialStudents}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {calculatedTotals.totalStudents > 0
                    ? Math.round(
                        (calculatedTotals.partialStudents /
                          calculatedTotals.totalStudents) *
                          100,
                      )
                    : 0}
                  % of students
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg border border-red-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Unpaid</p>
                <p className="text-2xl font-bold text-red-700">
                  {calculatedTotals.unpaidStudents}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {calculatedTotals.totalStudents > 0
                    ? Math.round(
                        (calculatedTotals.unpaidStudents /
                          calculatedTotals.totalStudents) *
                          100,
                      )
                    : 0}
                  % of students
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment Methods
                </h3>
                <button
                  onClick={() => navigate("/fees/reports")}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  View Details →
                </button>
              </div>
              <PaymentMethodChart data={stats.byMethod || []} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                    Recent Payments
                  </h3>
                  <button
                    onClick={handleViewAllPayments}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {recentPayments.length > 0 ? (
                  recentPayments.slice(0, 10).map((payment, index) => {
                    const methodInfo = getMethodInfo(payment.paymentMethod);
                    const studentName =
                      payment.studentName ||
                      payment.student?.user?.name ||
                      "N/A";
                    const courseName =
                      payment.courseName || payment.course?.name || "N/A";
                    const courseCode =
                      payment.courseCode || payment.course?.courseCode || "N/A";

                    return (
                      <div
                        key={index}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 rounded-lg ${methodInfo.bgColor}`}
                            >
                              {getPaymentMethodIcon(payment.paymentMethod)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {studentName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {courseCode} • {courseName}
                              </p>
                              <p className="text-xs text-gray-400">
                                Receipt: {payment.receiptNumber || "N/A"} |
                                Payer: {payment.payerName || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(
                                payment.paymentDate,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No recent payments found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                Outstanding Balances
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total Outstanding
                  </span>
                  <span className="text-xl font-bold text-orange-600">
                    {formatCurrency(calculatedTotals.outstandingBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Collection Rate</span>
                  <span className="text-xl font-bold text-purple-600">
                    {Math.round(calculatedTotals.collectionRate)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Students with Balance
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {calculatedTotals.partialStudents +
                      calculatedTotals.unpaidStudents}
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate("/fees/reports")}
                    className="w-full px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700"
                  >
                    View Outstanding Report
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
              <h3 className="text-sm font-medium text-green-800 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleRecordPayment}
                  className="w-full flex items-center justify-center px-4 py-2 bg-white border border-green-300 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record New Payment
                </button>
                <button
                  onClick={() => navigate("/fees/reports")}
                  className="w-full flex items-center justify-center px-4 py-2 bg-white border border-green-300 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Report
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Payment Methods
              </h3>
              <div className="space-y-2">
                {stats.byMethod?.length > 0 ? (
                  stats.byMethod.map((method, index) => {
                    const methodInfo = getMethodInfo(method.method);
                    const bgColorClass =
                      methodInfo.color === "green"
                        ? "bg-green-500"
                        : methodInfo.color === "blue"
                          ? "bg-blue-500"
                          : methodInfo.color === "purple"
                            ? "bg-purple-500"
                            : methodInfo.color === "yellow"
                              ? "bg-yellow-500"
                              : "bg-gray-500";
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${bgColorClass}`}
                          ></div>
                          <span className="text-sm text-gray-600">
                            {methodInfo.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(method.total)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({method.count})
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 text-sm py-4">
                    No payment data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Outstanding Table - Shows only students with balance > 0 */}
        <div className="mt-6">
          <OutstandingTable
            students={
              outstandingReport?.students?.filter(
                (student) => student.totalBalance > 0,
              ) || []
            }
            loading={loading}
            onViewStudent={handleViewStudentFees}
            onRecordPayment={(student) => {
              const params = new URLSearchParams();
              params.append("studentId", student.studentId);
              navigate(`/fees/record-payment?${params.toString()}`);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Fees;
