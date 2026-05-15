// src/components/Expenses/ExpenseItemsForm.jsx
import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  DollarSign,
  Package,
  Tag,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const ExpenseItemsForm = ({ items, onChange, categories, errors = {} }) => {
  const [newItem, setNewItem] = useState({
    category: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    amount: 0
  });

  const handleAddItem = () => {
    if (!newItem.category || !newItem.description || newItem.amount <= 0) {
      return;
    }

    // FIXED: Use a temporary ID that won't be sent to backend
    // The backend will generate its own _id
    onChange([...items, { 
      ...newItem, 
      tempId: Date.now().toString()  // Use tempId for React keys instead of _id
    }]);
    
    setNewItem({
      category: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : updatedItems[index].quantity;
      const unitPrice = field === 'unitPrice' ? parseFloat(value) || 0 : updatedItems[index].unitPrice;
      updatedItems[index][field] = parseFloat(value) || 0;
      updatedItems[index].amount = quantity * unitPrice;
    } else {
      updatedItems[index][field] = value;
    }
    
    onChange(updatedItems);
  };

  const handleNewItemChange = (field, value) => {
    let updatedNewItem = { ...newItem, [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : newItem.quantity;
      const unitPrice = field === 'unitPrice' ? parseFloat(value) || 0 : newItem.unitPrice;
      updatedNewItem.amount = quantity * unitPrice;
    }
    
    setNewItem(updatedNewItem);
  };

  const flattenCategories = (categories, level = 0) => {
    let result = [];
    categories.forEach(cat => {
      result.push({ ...cat, level });
      if (cat.children && cat.children.length > 0) {
        result = [...result, ...flattenCategories(cat.children, level + 1)];
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories || []);

  return (
    <div className="space-y-4">
      {/* Existing Items Table */}
      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={item.tempId || index}>
                  <td className="px-4 py-2">
                    <select
                      value={item.category}
                      onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select Category</option>
                      {flatCategories.map(cat => (
                        <option key={cat._id} value={cat._id} style={{ paddingLeft: `${cat.level * 20}px` }}>
                          {' '.repeat(cat.level * 2)}{cat.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500"
                      placeholder="Item description"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="1"
                      step="1"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-red-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">KSh</span>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-28 pl-10 pr-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add New Item Form */}
      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Plus className="w-4 h-4 mr-1" />
          Add Expense Item
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select
              value={newItem.category}
              onChange={(e) => handleNewItemChange('category', e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select Category</option>
              {flatCategories.map(cat => (
                <option key={cat._id} value={cat._id} style={{ paddingLeft: `${cat.level * 20}px` }}>
                  {' '.repeat(cat.level * 2)}{cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <input
              type="text"
              value={newItem.description}
              onChange={(e) => handleNewItemChange('description', e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500"
              placeholder="Item description"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quantity</label>
            <input
              type="number"
              value={newItem.quantity}
              onChange={(e) => handleNewItemChange('quantity', e.target.value)}
              min="1"
              step="1"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">KSh</span>
              <input
                type="number"
                value={newItem.unitPrice}
                onChange={(e) => handleNewItemChange('unitPrice', e.target.value)}
                min="0"
                step="0.01"
                className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!newItem.category || !newItem.description || newItem.amount <= 0}
              className="w-full px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </button>
          </div>
        </div>
        
        {newItem.amount > 0 && (
          <div className="mt-2 text-right text-sm text-gray-500">
            Amount: {formatCurrency(newItem.amount)}
          </div>
        )}
      </div>

      {/* Error Messages */}
      {Object.keys(errors).some(key => key.startsWith('item_')) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2" />
            <p className="text-sm text-red-700">
              Please fill in all required fields for each expense item.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseItemsForm;