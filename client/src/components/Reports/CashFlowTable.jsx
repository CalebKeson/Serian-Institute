// src/components/Reports/CashFlowTable.jsx
import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const CashFlowTable = ({ data, groupBy, period }) => {
  const [expandedPeriods, setExpandedPeriods] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  const togglePeriodExpand = (periodName) => {
    setExpandedPeriods(prev =>
      prev.includes(periodName)
        ? prev.filter(p => p !== periodName)
        : [...prev, periodName]
    );
  };

  if (!data || !data.cashFlow || data.cashFlow.length === 0) {
    return (
      <div className="text-center py-12">
        <Wallet className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-500">No cash flow data available for the selected period</p>
      </div>
    );
  }

  const summary = data.summary || {
    totalInflows: 0,
    totalOutflows: 0,
    totalNetCashFlow: 0
  };

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Inflows</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(summary.totalInflows)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Outflows</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(summary.totalOutflows)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Net Cash Flow</p>
            <p className={`text-xl font-bold ${summary.totalNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.totalNetCashFlow)}
            </p>
          </div>
        </div>
      </div>

      {/* Cash Flow Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inflows
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outflows
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Flow
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Closing Balance
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.cashFlow.map((periodData, index) => {
              const isExpanded = expandedPeriods.includes(periodData.period);
              return (
                <React.Fragment key={index}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {periodData.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600">
                      {formatCurrency(periodData.inflows)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                      {formatCurrency(periodData.outflows)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                      periodData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(periodData.netCashFlow)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                      {formatCurrency(periodData.closingBalance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => togglePeriodExpand(periodData.period)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row - Inflow/Outflow Breakdown */}
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan="6" className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Inflow Breakdown */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                              Cash Inflows
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(periodData.inflowBreakdown || {}).map(([source, amount]) => (
                                <div key={source} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600 capitalize">{source.replace('_', ' ')}</span>
                                  <span className="font-medium text-green-600">{formatCurrency(amount)}</span>
                                </div>
                              ))}
                              {Object.keys(periodData.inflowBreakdown || {}).length === 0 && (
                                <p className="text-sm text-gray-500 italic">No cash inflows</p>
                              )}
                            </div>
                          </div>

                          {/* Outflow Breakdown */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
                              Cash Outflows
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(periodData.outflowBreakdown || {}).map(([category, amount]) => (
                                <div key={category} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">{category}</span>
                                  <span className="font-medium text-red-600">{formatCurrency(amount)}</span>
                                </div>
                              ))}
                              {Object.keys(periodData.outflowBreakdown || {}).length === 0 && (
                                <p className="text-sm text-gray-500 italic">No cash outflows</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr className="border-t border-gray-200">
              <td className="px-6 py-3 text-sm font-medium text-gray-900">TOTAL</td>
              <td className="px-6 py-3 text-right text-sm font-bold text-green-600">
                {formatCurrency(summary.totalInflows)}
              </td>
              <td className="px-6 py-3 text-right text-sm font-bold text-red-600">
                {formatCurrency(summary.totalOutflows)}
              </td>
              <td className={`px-6 py-3 text-right text-sm font-bold ${summary.totalNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.totalNetCashFlow)}
              </td>
              <td className="px-6 py-3 text-right text-sm font-bold text-blue-600">
                {formatCurrency(data.closingBalance)}
              </td>
              <td className="px-6 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Show/Hide Details Button */}
      <div className="text-center">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center mx-auto"
        >
          <Eye className="w-4 h-4 mr-1" />
          {showDetails ? 'Hide Details' : 'Show Detailed Breakdown'}
        </button>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && data.cashFlow && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Period Cash Flow Analysis</h3>
          {data.cashFlow.map((periodData, index) => (
            <div key={index} className="mb-6 last:mb-0">
              <h4 className="text-sm font-medium text-gray-700 mb-3">{periodData.period}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">Inflow Sources</p>
                  <div className="space-y-1">
                    {Object.entries(periodData.inflowBreakdown || {}).map(([source, amount]) => (
                      <div key={source} className="flex justify-between text-sm">
                        <span className="capitalize">{source.replace('_', ' ')}</span>
                        <span>{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">Outflow Categories</p>
                  <div className="space-y-1">
                    {Object.entries(periodData.outflowBreakdown || {}).map(([category, amount]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span>{category}</span>
                        <span>{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-400 text-center pt-4 border-t border-gray-200">
        Generated on {new Date().toLocaleDateString()} | Period: {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
      </div>
    </div>
  );
};

export default CashFlowTable;