// src/components/Expenses/OneTimeBudgetList.jsx
import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/feeFormatter';
import OneTimeBudgetModal from './OneTimeBudgetModal';

const OneTimeBudgetList = ({ category, onUpdate, readOnly = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const oneTimeBudgets = category?.oneTimeBudgets || [];

  const getStatusBadge = (status) => {
    const badges = {
      planned: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Planned' },
      actual: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' }
    };
    const config = badges[status] || badges.planned;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const totalAmount = oneTimeBudgets
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.amount, 0);

  const handleAdd = () => {
    setEditingBudget(null);
    setShowModal(true);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBudget(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    if (onUpdate) onUpdate();
  };

  if (oneTimeBudgets.length === 0 && readOnly) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm">No one-time budgets defined</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700">One-Time Budgets</h4>
          <p className="text-xs text-gray-500 mt-1">
            Total: {formatCurrency(totalAmount)} | {oneTimeBudgets.length} items
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {oneTimeBudgets.map((budget) => (
          <div
            key={budget._id}
            className={`p-3 rounded-lg border ${
              budget.status === 'cancelled' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
            } hover:shadow-sm transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className={`text-sm font-medium ${
                    budget.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-gray-900'
                  }`}>
                    {budget.description}
                  </p>
                  {getStatusBadge(budget.status)}
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {formatCurrency(budget.amount)}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(budget.date)}
                  </span>
                </div>
                {budget.notes && (
                  <p className="text-xs text-gray-400 mt-2">
                    {budget.notes}
                  </p>
                )}
              </div>
              {!readOnly && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="p-1 text-gray-400 hover:text-purple-600 rounded hover:bg-purple-50 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this one-time budget?')) {
                        onUpdate(budget._id, null, 'delete');
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <OneTimeBudgetModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        categoryId={category?._id}
        budget={editingBudget}
      />
    </div>
  );
};

export default OneTimeBudgetList;