// controllers/financialReport.controller.js
import mongoose from "mongoose";
import IncomeTransaction from "../models/incomeTransaction.model.js";
import Expense from "../models/expense.model.js";
import ExpenseCategory from "../models/expenseCategory.model.js";
import Director from "../models/director.model.js";
import { errorHandler } from "../utils/error.js";

// Helper function to build hierarchical budget data
function buildHierarchicalBudgetData(categories, reportData) {
  // First, build a map of all categories
  const categoryMap = {};
  categories.forEach((cat) => {
    const yearlyData = reportData
      .filter((r) => r.categoryId === cat._id)
      .reduce(
        (acc, r) => {
          acc.budgetAmount += r.budgetAmount;
          acc.actualAmount += r.actualAmount;
          acc.variance += r.variance;
          return acc;
        },
        { budgetAmount: 0, actualAmount: 0, variance: 0 },
      );

    categoryMap[cat._id] = {
      _id: cat._id,
      name: cat.name,
      parentCategory: cat.parentCategory,
      budgetAmount: yearlyData.budgetAmount,
      actualAmount: yearlyData.actualAmount,
      variance: yearlyData.variance,
      variancePercentage:
        yearlyData.budgetAmount > 0
          ? (yearlyData.variance / yearlyData.budgetAmount) * 100
          : 0,
      children: [],
    };
  });

  // Build hierarchy
  const rootCategories = [];
  Object.values(categoryMap).forEach((cat) => {
    if (cat.parentCategory && categoryMap[cat.parentCategory]) {
      categoryMap[cat.parentCategory].children.push(cat);
    } else {
      rootCategories.push(cat);
    }
  });

  return rootCategories;
}

// @desc    Get Profit & Loss Statement
// @route   GET /api/financial/profit-loss
// @access  Private (Admin only)
export const getProfitLoss = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = "monthly" } = req.query;

    if (!startDate || !endDate) {
      return next(errorHandler(400, "Start date and end date are required"));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get income data (all received income)
    const incomeData = await IncomeTransaction.aggregate([
      {
        $match: {
          status: "received",
          incomeDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id:
            groupBy === "monthly"
              ? {
                  year: { $year: "$incomeDate" },
                  month: { $month: "$incomeDate" },
                }
              : {
                  year: { $year: "$incomeDate" },
                  quarter: {
                    $ceil: { $divide: [{ $month: "$incomeDate" }, 3] },
                  },
                },
          totalAmount: { $sum: "$amount" },
          bySourceType: {
            $push: {
              sourceType: "$sourceType",
              amount: "$amount",
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.quarter": 1 } },
    ]);

    // Get expense data (ALL expenses regardless of payment status for P&L)
    const expenseData = await Expense.aggregate([
      {
        $match: {
          expenseDate: { $gte: start, $lte: end },
          status: { $ne: "cancelled" },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id:
            groupBy === "monthly"
              ? {
                  year: { $year: "$expenseDate" },
                  month: { $month: "$expenseDate" },
                }
              : {
                  year: { $year: "$expenseDate" },
                  quarter: {
                    $ceil: { $divide: [{ $month: "$expenseDate" }, 3] },
                  },
                },
          totalAmount: { $sum: "$items.amount" },
          byCategory: {
            $push: {
              category: "$items.category",
              amount: "$items.amount",
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.quarter": 1 } },
    ]);

    // Process income by source type
    const processedIncome = incomeData.map((period) => {
      const sourceMap = {};
      period.bySourceType.forEach((item) => {
        if (!sourceMap[item.sourceType]) {
          sourceMap[item.sourceType] = 0;
        }
        sourceMap[item.sourceType] += item.amount;
      });

      return {
        period:
          groupBy === "monthly"
            ? `${period._id.year}-${String(period._id.month).padStart(2, "0")}`
            : `${period._id.year}-Q${period._id.quarter}`,
        year: period._id.year,
        month: period._id.month,
        quarter: period._id.quarter,
        totalIncome: period.totalAmount,
        breakdown: sourceMap,
      };
    });

    // Process expense by category
    const processedExpenses = expenseData.map((period) => {
      const categoryMap = {};
      period.byCategory.forEach(async (item) => {
        if (!categoryMap[item.category]) {
          categoryMap[item.category] = 0;
        }
        categoryMap[item.category] += item.amount;
      });

      return {
        period:
          groupBy === "monthly"
            ? `${period._id.year}-${String(period._id.month).padStart(2, "0")}`
            : `${period._id.year}-Q${period._id.quarter}`,
        year: period._id.year,
        month: period._id.month,
        quarter: period._id.quarter,
        totalExpenses: period.totalAmount,
        breakdown: categoryMap,
      };
    });

    // Combine income and expenses
    const combinedData = [];
    const allPeriods = new Set([
      ...processedIncome.map((p) => p.period),
      ...processedExpenses.map((p) => p.period),
    ]);

    for (const period of allPeriods) {
      const income = processedIncome.find((p) => p.period === period) || {
        totalIncome: 0,
        breakdown: {},
      };
      const expenses = processedExpenses.find((p) => p.period === period) || {
        totalExpenses: 0,
        breakdown: {},
      };

      combinedData.push({
        period,
        year: income.year || expenses.year,
        month: income.month || expenses.month,
        quarter: income.quarter || expenses.quarter,
        income: income.totalIncome,
        expenses: expenses.totalExpenses,
        profit: income.totalIncome - expenses.totalExpenses,
        profitMargin:
          income.totalIncome > 0
            ? ((income.totalIncome - expenses.totalExpenses) /
                income.totalIncome) *
              100
            : 0,
        incomeBreakdown: income.breakdown,
        expenseBreakdown: expenses.breakdown,
      });
    }

    combinedData.sort((a, b) => a.period.localeCompare(b.period));

    // Calculate totals
    const totals = combinedData.reduce(
      (acc, period) => {
        acc.totalIncome += period.income;
        acc.totalExpenses += period.expenses;
        acc.totalProfit += period.profit;
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0, totalProfit: 0 },
    );

    totals.overallProfitMargin =
      totals.totalIncome > 0
        ? (totals.totalProfit / totals.totalIncome) * 100
        : 0;

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        groupBy,
        breakdown: combinedData,
        summary: totals,
      },
    });
  } catch (error) {
    console.error("Profit & Loss error:", error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get Cash Flow Statement
// @route   GET /api/financial/cash-flow
// @access  Private (Admin only)
export const getCashFlow = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = "monthly" } = req.query;

    if (!startDate || !endDate) {
      return next(errorHandler(400, "Start date and end date are required"));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // ============ CASH INFLOWS ============
    const incomeInflows = await IncomeTransaction.aggregate([
      {
        $match: {
          status: "received",
          incomeDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id:
            groupBy === "monthly"
              ? {
                  year: { $year: "$incomeDate" },
                  month: { $month: "$incomeDate" },
                }
              : {
                  year: { $year: "$incomeDate" },
                  quarter: {
                    $ceil: { $divide: [{ $month: "$incomeDate" }, 3] },
                  },
                },
          total: { $sum: "$amount" },
          bySource: {
            $push: {
              source: "$sourceType",
              amount: "$amount",
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.quarter": 1 } },
    ]);

    // ============ CASH OUTFLOWS ============
    const paidExpenses = await Expense.aggregate([
      {
        $match: {
          status: "paid",
          $or: [
            { paymentDate: { $gte: start, $lte: end } },
            { paidAt: { $gte: start, $lte: end } },
          ],
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id:
            groupBy === "monthly"
              ? {
                  year: { $year: { $ifNull: ["$paymentDate", "$paidAt"] } },
                  month: { $month: { $ifNull: ["$paymentDate", "$paidAt"] } },
                }
              : {
                  year: { $year: { $ifNull: ["$paymentDate", "$paidAt"] } },
                  quarter: {
                    $ceil: {
                      $divide: [
                        { $month: { $ifNull: ["$paymentDate", "$paidAt"] } },
                        3,
                      ],
                    },
                  },
                },
          total: { $sum: "$items.amount" },
          byCategory: {
            $push: {
              category: "$items.category",
              amount: "$items.amount",
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.quarter": 1 } },
    ]);

    // Process and combine cash flow data
    const cashFlowData = [];
    const allPeriods = new Set([
      ...incomeInflows.map(
        (i) => `${i._id.year}-${i._id.month || i._id.quarter}`,
      ),
      ...paidExpenses.map(
        (e) => `${e._id.year}-${e._id.month || e._id.quarter}`,
      ),
    ]);

    for (const periodKey of allPeriods) {
      const inflow = incomeInflows.find(
        (i) => `${i._id.year}-${i._id.month || i._id.quarter}` === periodKey,
      ) || { total: 0, bySource: [] };
      const outflow = paidExpenses.find(
        (e) => `${e._id.year}-${e._id.month || e._id.quarter}` === periodKey,
      ) || { total: 0, byCategory: [] };

      const inflowMap = {};
      inflow.bySource.forEach((item) => {
        if (!inflowMap[item.source]) {
          inflowMap[item.source] = 0;
        }
        inflowMap[item.source] += item.amount;
      });

      const outflowMap = {};
      const categoryIds = [
        ...new Set(outflow.byCategory.map((c) => c.category)),
      ];
      const categories = await ExpenseCategory.find({
        _id: { $in: categoryIds },
      }).select("name");
      const categoryNameMap = {};
      categories.forEach((cat) => {
        categoryNameMap[cat._id] = cat.name;
      });

      outflow.byCategory.forEach((item) => {
        const categoryName = categoryNameMap[item.category] || "Unknown";
        if (!outflowMap[categoryName]) {
          outflowMap[categoryName] = 0;
        }
        outflowMap[categoryName] += item.amount;
      });

      const netCashFlow = inflow.total - outflow.total;

      cashFlowData.push({
        period: periodKey,
        inflows: inflow.total,
        outflows: outflow.total,
        netCashFlow,
        inflowBreakdown: inflowMap,
        outflowBreakdown: outflowMap,
      });
    }

    cashFlowData.sort((a, b) => a.period.localeCompare(b.period));

    const totals = cashFlowData.reduce(
      (acc, period) => {
        acc.totalInflows += period.inflows;
        acc.totalOutflows += period.outflows;
        acc.totalNetCashFlow += period.netCashFlow;
        return acc;
      },
      { totalInflows: 0, totalOutflows: 0, totalNetCashFlow: 0 },
    );

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        groupBy,
        cashFlow: cashFlowData,
        summary: totals,
      },
    });
  } catch (error) {
    console.error("Cash Flow error:", error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get Budget vs Actual Report
// @route   GET /api/financial/budget-vs-actual
// @access  Private (Admin only)
export const getBudgetVsActual = async (req, res, next) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;
    const targetYear = parseInt(year);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Get all active categories
    const allCategories = await ExpenseCategory.find({ isActive: true });
    
    // Get all parent category IDs
    const parentCategoryIds = allCategories
      .filter(cat => cat.parentCategory)
      .map(cat => cat.parentCategory.toString());
    
    // Only include leaf categories for budget calculation
    const budgetCategories = allCategories.filter(cat => 
      !parentCategoryIds.includes(cat._id.toString())
    );
    
    // Get actual expenses for the year
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    
    const actualExpenses = await Expense.aggregate([
      { 
        $match: { 
          expenseDate: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' }
        } 
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            category: '$items.category',
            month: { $month: '$expenseDate' }
          },
          total: { $sum: '$items.amount' }
        }
      }
    ]);

    // Create actual map
    const actualMap = {};
    actualExpenses.forEach(item => {
      const key = `${item._id.category}-${item._id.month}`;
      actualMap[key] = item.total;
    });

    // Build report data
    const reportData = [];
    const recurringData = [];
    const oneTimeData = [];
    
    for (let month = 1; month <= 12; month++) {
      // Determine if this month is in the future (for display purposes)
      const isFutureMonth = (targetYear > currentYear) || 
                            (targetYear === currentYear && month > currentMonth);
      
      for (const cat of budgetCategories) {
        // Get budget amount for this month using the category's method
        let budgetAmount = cat.getBudgetForMonth(targetYear, month);
        
        // For future months, set budget to 0 (optional - remove if you want to show future budgets)
        if (isFutureMonth && cat.budgetType === 'recurring') {
          budgetAmount = 0;
        }
        
        const actualAmount = actualMap[`${cat._id}-${month}`] || 0;
        const variance = actualAmount - budgetAmount;
        const variancePercentage = budgetAmount > 0 
          ? (variance / budgetAmount) * 100 
          : actualAmount > 0 ? 100 : 0;
        
        const reportItem = {
          categoryId: cat._id,
          categoryName: cat.name,
          parentCategory: cat.parentCategory,
          budgetType: cat.budgetType,
          budgetPeriod: cat.budgetPeriod,
          month,
          budgetAmount,
          actualAmount,
          variance,
          variancePercentage: Math.round(variancePercentage),
          status: variance > 0 ? 'over_budget' : variance < 0 ? 'under_budget' : 'on_budget',
          isFutureMonth
        };
        
        reportData.push(reportItem);
        
        if (cat.budgetType === 'recurring') {
          recurringData.push(reportItem);
        } else if (cat.budgetType === 'one-time') {
          oneTimeData.push(reportItem);
        }
      }
    }

    // Calculate totals by month
    const monthlyTotals = {};
    for (let month = 1; month <= 12; month++) {
      const monthData = reportData.filter(r => r.month === month);
      monthlyTotals[month] = {
        month,
        totalBudget: monthData.reduce((sum, r) => sum + r.budgetAmount, 0),
        totalActual: monthData.reduce((sum, r) => sum + r.actualAmount, 0),
        variance: monthData.reduce((sum, r) => sum + r.variance, 0),
        recurringBudget: recurringData.filter(r => r.month === month).reduce((sum, r) => sum + r.budgetAmount, 0),
        recurringActual: recurringData.filter(r => r.month === month).reduce((sum, r) => sum + r.actualAmount, 0),
        oneTimeBudget: oneTimeData.filter(r => r.month === month).reduce((sum, r) => sum + r.budgetAmount, 0),
        oneTimeActual: oneTimeData.filter(r => r.month === month).reduce((sum, r) => sum + r.actualAmount, 0)
      };
    }

    // Calculate yearly totals
    const yearlyTotals = reportData.reduce((acc, r) => {
      acc.totalBudget += r.budgetAmount;
      acc.totalActual += r.actualAmount;
      acc.totalVariance += r.variance;
      
      if (r.budgetType === 'recurring') {
        acc.recurringBudget += r.budgetAmount;
        acc.recurringActual += r.actualAmount;
      } else if (r.budgetType === 'one-time') {
        acc.oneTimeBudget += r.budgetAmount;
        acc.oneTimeActual += r.actualAmount;
      }
      
      return acc;
    }, { 
      totalBudget: 0, 
      totalActual: 0, 
      totalVariance: 0,
      recurringBudget: 0,
      recurringActual: 0,
      oneTimeBudget: 0,
      oneTimeActual: 0
    });

    yearlyTotals.variancePercentage = yearlyTotals.totalBudget > 0
      ? (yearlyTotals.totalVariance / yearlyTotals.totalBudget) * 100
      : 0;

    // Group by category for summary
    const categorySummary = {};
    for (const item of reportData) {
      if (!categorySummary[item.categoryId]) {
        categorySummary[item.categoryId] = {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          parentCategory: item.parentCategory,
          budgetType: item.budgetType,
          budgetPeriod: item.budgetPeriod,
          totalBudget: 0,
          totalActual: 0,
          totalVariance: 0
        };
      }
      categorySummary[item.categoryId].totalBudget += item.budgetAmount;
      categorySummary[item.categoryId].totalActual += item.actualAmount;
      categorySummary[item.categoryId].totalVariance += item.variance;
    }

    const categorySummaryArray = Object.values(categorySummary).map(cat => ({
      ...cat,
      variancePercentage: cat.totalBudget > 0 
        ? (cat.totalVariance / cat.totalBudget) * 100 
        : cat.totalActual > 0 ? 100 : 0
    })).sort((a, b) => b.variancePercentage - a.variancePercentage);

    // Separate recurring and one-time category summaries
    const recurringCategories = categorySummaryArray.filter(c => c.budgetType === 'recurring');
    const oneTimeCategories = categorySummaryArray.filter(c => c.budgetType === 'one-time');

    // Build hierarchical data
    const hierarchicalData = buildHierarchicalBudgetData(budgetCategories, reportData);

    res.json({
      success: true,
      data: {
        year: targetYear,
        period,
        monthlyTotals: Object.values(monthlyTotals).sort((a, b) => a.month - b.month),
        yearlyTotals,
        categorySummary: categorySummaryArray,
        recurringCategories,
        oneTimeCategories,
        hierarchical: hierarchicalData,
        detailed: reportData,
        recurringDetailed: recurringData,
        oneTimeDetailed: oneTimeData
      }
    });
  } catch (error) {
    console.error('Budget vs Actual error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get Financial Summary Dashboard
// @route   GET /api/financial/summary
// @access  Private (Admin only)
export const getFinancialSummary = async (req, res, next) => {
  try {
    const { period = "month", date = new Date().toISOString().split("T")[0] } =
      req.query;

    let startDate, endDate;
    const referenceDate = new Date(date);

    switch (period) {
      case "today":
        startDate = new Date(referenceDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(referenceDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "week":
        startDate = new Date(referenceDate);
        startDate.setDate(referenceDate.getDate() - referenceDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        startDate = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          1,
        );
        endDate = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        break;
      case "quarter":
        const quarter = Math.floor(referenceDate.getMonth() / 3);
        startDate = new Date(referenceDate.getFullYear(), quarter * 3, 1);
        endDate = new Date(
          referenceDate.getFullYear(),
          (quarter + 1) * 3,
          0,
          23,
          59,
          59,
          999,
        );
        break;
      case "year":
        startDate = new Date(referenceDate.getFullYear(), 0, 1);
        endDate = new Date(
          referenceDate.getFullYear(),
          11,
          31,
          23,
          59,
          59,
          999,
        );
        break;
      default:
        startDate = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          1,
        );
        endDate = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
    }

    // Get total income (received)
    const incomeResult = await IncomeTransaction.aggregate([
      {
        $match: {
          status: "received",
          incomeDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          bySource: {
            $push: {
              source: "$sourceType",
              amount: "$amount",
            },
          },
        },
      },
    ]);

    // Get total expenses (PAID only for cash flow summary)
    const expenseResult = await Expense.aggregate([
      {
        $match: {
          status: "paid",
          paymentDate: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          total: { $sum: "$items.amount" },
          byCategory: {
            $push: {
              category: "$items.category",
              amount: "$items.amount",
            },
          },
        },
      },
    ]);

    // Process income by source
    const incomeBySource = {};
    if (incomeResult[0]?.bySource) {
      incomeResult[0].bySource.forEach((item) => {
        if (!incomeBySource[item.source]) {
          incomeBySource[item.source] = 0;
        }
        incomeBySource[item.source] += item.amount;
      });
    }

    // Process expense by category (with category names)
    const expenseByCategory = {};
    if (expenseResult[0]?.byCategory) {
      const categoryIds = [
        ...new Set(expenseResult[0].byCategory.map((c) => c.category)),
      ];
      const categories = await ExpenseCategory.find({
        _id: { $in: categoryIds },
      }).select("name");
      const categoryMap = {};
      categories.forEach((cat) => {
        categoryMap[cat._id] = cat.name;
      });

      expenseResult[0].byCategory.forEach((item) => {
        const categoryName = categoryMap[item.category] || "Unknown";
        if (!expenseByCategory[categoryName]) {
          expenseByCategory[categoryName] = 0;
        }
        expenseByCategory[categoryName] += item.amount;
      });
    }

    const totalIncome = incomeResult[0]?.total || 0;
    const totalExpenses = expenseResult[0]?.total || 0;
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Get director liabilities
    const directors = await Director.find({ isActive: true });
    const directorLiabilities = directors.reduce(
      (sum, d) => sum + (d.totalInvested - d.totalRepaid),
      0,
    );

    res.json({
      success: true,
      data: {
        period: { type: period, startDate, endDate, referenceDate },
        income: {
          total: totalIncome,
          bySource: incomeBySource,
        },
        expenses: {
          total: totalExpenses,
          byCategory: expenseByCategory,
        },
        profit: {
          net: netProfit,
          margin: profitMargin,
        },
        liabilities: {
          director: directorLiabilities,
        },
        summary: {
          cashFlow: totalIncome - totalExpenses,
          operatingRatio:
            totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0,
        },
      },
    });
  } catch (error) {
    console.error("Financial summary error:", error);
    next(errorHandler(500, error.message));
  }
};
