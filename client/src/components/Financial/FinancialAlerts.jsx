// src/components/Financial/FinancialAlerts.jsx
import React from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const FinancialAlerts = ({ expenseStats, directorSummary, financialSummary }) => {
  const navigate = useNavigate();

  const alerts = [];

  // Budget alerts from expense stats
  const budgetAlerts = expenseStats?.byCategory?.filter(
    cat => cat.percentage && cat.percentage >= 90
  ) || [];

  budgetAlerts.forEach(cat => {
    alerts.push({
      type: 'warning',
      severity: cat.percentage >= 100 ? 'high' : 'medium',
      icon: AlertTriangle,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      title: `Budget Alert: ${cat.categoryName}`,
      message: `${cat.categoryName} category has reached ${cat.percentage.toFixed(0)}% of budget (${formatCurrency(cat.total)} / ${formatCurrency(cat.budget)})`,
      action: () => navigate(`/expenses?category=${cat.categoryId}`),
      actionText: 'View Expenses'
    });
  });

  // Director outstanding alerts
  const directorOutstanding = directorSummary?.totalOutstanding || 0;
  if (directorOutstanding > 0) {
    alerts.push({
      type: 'info',
      severity: directorOutstanding > 100000 ? 'high' : 'medium',
      icon: DollarSign,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      title: 'Director Liabilities',
      message: `Outstanding director balance: ${formatCurrency(directorOutstanding)}. Consider repayment planning.`,
      action: () => navigate('/directors'),
      actionText: 'View Directors'
    });
  }

  // Pending approvals alert
  const pendingExpenses = expenseStats?.byStatus?.find(s => s.status === 'pending')?.count || 0;
  if (pendingExpenses > 0) {
    alerts.push({
      type: 'info',
      severity: pendingExpenses > 5 ? 'high' : 'medium',
      icon: Clock,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      title: 'Pending Approvals',
      message: `${pendingExpenses} expense${pendingExpenses > 1 ? 's' : ''} waiting for approval.`,
      action: () => navigate('/expenses?status=pending'),
      actionText: 'Review Expenses'
    });
  }

  // Income vs Expense ratio alert
  const totalIncome = financialSummary?.income?.total || 0;
  const totalExpenses = financialSummary?.expenses?.total || 0;
  if (totalExpenses > totalIncome && totalIncome > 0) {
    const ratio = (totalExpenses / totalIncome) * 100;
    alerts.push({
      type: 'error',
      severity: 'high',
      icon: AlertCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      title: 'Negative Cash Flow Alert',
      message: `Expenses (${formatCurrency(totalExpenses)}) exceed income (${formatCurrency(totalIncome)}) by ${formatCurrency(totalExpenses - totalIncome)}.`,
      action: () => navigate('/financial/profit-loss'),
      actionText: 'View P&L'
    });
  } else if (totalIncome > 0 && (totalExpenses / totalIncome) > 0.9) {
    alerts.push({
      type: 'warning',
      severity: 'medium',
      icon: TrendingDown,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      title: 'High Expense Ratio',
      message: `Expenses are ${((totalExpenses / totalIncome) * 100).toFixed(0)}% of income. Consider cost optimization.`,
      action: () => navigate('/expenses'),
      actionText: 'Review Expenses'
    });
  }

  // Positive net profit alert (good news)
  const netProfit = totalIncome - totalExpenses;
  if (netProfit > 0 && totalIncome > 0) {
    alerts.push({
      type: 'success',
      severity: 'low',
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      title: 'Positive Net Profit',
      message: `Net profit of ${formatCurrency(netProfit)} (${((netProfit / totalIncome) * 100).toFixed(1)}% margin)`,
      action: () => navigate('/financial/profit-loss'),
      actionText: 'View Details'
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-gray-500" />
            Alerts & Notifications
          </h3>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
          <p className="text-gray-500">No active alerts</p>
          <p className="text-sm text-gray-400 mt-1">All financial metrics look good</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-gray-500" />
          Alerts & Notifications
          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
            {alerts.length}
          </span>
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {alerts.slice(0, 5).map((alert, index) => {
          const Icon = alert.icon;
          return (
            <div key={index} className={`p-4 ${alert.bgColor}`}>
              <div className="flex items-start">
                <div className={`p-1 rounded-full ${alert.bgColor}`}>
                  <Icon className={`w-5 h-5 ${alert.textColor}`} />
                </div>
                <div className="ml-3 flex-1">
                  <h4 className={`text-sm font-medium ${alert.textColor}`}>{alert.title}</h4>
                  <p className={`text-sm ${alert.textColor} opacity-90 mt-1`}>{alert.message}</p>
                  <button
                    onClick={alert.action}
                    className={`mt-2 text-xs font-medium ${alert.textColor} hover:underline flex items-center`}
                  >
                    {alert.actionText}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  alert.severity === 'high' ? 'bg-red-200 text-red-800' :
                  alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-green-200 text-green-800'
                }`}>
                  {alert.severity === 'high' ? 'Urgent' : alert.severity === 'medium' ? 'Attention' : 'Info'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {alerts.length > 5 && (
        <div className="p-3 text-center bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => navigate('/reports')}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            View all {alerts.length} alerts
          </button>
        </div>
      )}
    </div>
  );
};

export default FinancialAlerts;