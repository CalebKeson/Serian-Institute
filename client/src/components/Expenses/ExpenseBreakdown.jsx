// src/components/Expenses/ExpenseBreakdown.jsx
import React, { useState } from 'react';
import {
  Package,
  Tag,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const ExpenseBreakdown = ({ items, loading = false }) => {
  const [expandedItems, setExpandedItems] = useState([]);
  const [showAllItems, setShowAllItems] = useState(false);

  const toggleItemExpand = (itemId) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getCategoryColor = (categoryName) => {
    const colors = {
      'Academic': 'bg-blue-100 text-blue-800',
      'Administrative': 'bg-purple-100 text-purple-800',
      'Facilities': 'bg-yellow-100 text-yellow-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Technology': 'bg-indigo-100 text-indigo-800',
      'Student Services': 'bg-green-100 text-green-800',
      'Miscellaneous': 'bg-gray-100 text-gray-800'
    };
    return colors[categoryName] || 'bg-gray-100 text-gray-800';
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const displayedItems = showAllItems ? items : items.slice(0, 5);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No items</h3>
        <p className="mt-1 text-sm text-gray-500">No breakdown items have been added.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedItems.map((item, index) => {
              const isExpanded = expandedItems.includes(item._id || index);
              const categoryColor = getCategoryColor(item.category?.name);

              return (
                <React.Fragment key={item._id || index}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {item.description}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColor}`}>
                        {item.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {item.quantity || 1}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {formatCurrency(item.unitPrice || item.amount / (item.quantity || 1))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleItemExpand(item._id || index)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                        title="View details"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row - Additional Details */}
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan="6" className="px-4 py-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Category</p>
                            <p className="font-medium text-gray-900">{item.category?.name || 'N/A'}</p>
                            {item.category?.description && (
                              <p className="text-xs text-gray-500 mt-1">{item.category.description}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Unit Price</p>
                            <p className="font-medium text-gray-900">{formatCurrency(item.unitPrice || item.amount / (item.quantity || 1))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                            <p className="font-medium text-gray-900">{formatCurrency(item.amount)}</p>
                          </div>
                          {item.notes && (
                            <div className="col-span-2">
                              <p className="text-xs text-gray-500 mb-1">Additional Notes</p>
                              <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                                {item.notes}
                              </p>
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
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td colSpan="4" className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                Total
              </td>
              <td className="px-4 py-3 text-right text-lg font-bold text-red-600">
                {formatCurrency(totalAmount)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Show More / Show Less Button */}
      {items.length > 5 && (
        <div className="text-center">
          <button
            onClick={() => setShowAllItems(!showAllItems)}
            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center justify-center mx-auto"
          >
            {showAllItems ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show All ({items.length} items)
              </>
            )}
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">Total Items</p>
          <p className="text-lg font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Categories</p>
          <p className="text-lg font-bold text-gray-900">
            {new Set(items.map(i => i.category?._id)).size}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Average Item</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(totalAmount / items.length)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Largest Item</p>
          <p className="text-lg font-bold text-red-600">
            {formatCurrency(Math.max(...items.map(i => i.amount)))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExpenseBreakdown;