// src/components/Expenses/CategoryTable.jsx
import React, { useState } from "react";
import {
  FolderTree,
  Folder,
  FolderOpen,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import BudgetProgress from "./BudgetProgress";
import { formatCurrency } from "../../utils/feeFormatter";

const CategoryTable = ({ categories, loading, onEdit, onDelete }) => {
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const toggleExpand = (categoryId) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const flattenCategories = (categories, level = 0) => {
    let result = [];
    categories.forEach((cat) => {
      result.push({
        ...cat,
        level,
        isExpanded: expandedCategories.includes(cat._id),
      });
      if (
        cat.children &&
        cat.children.length > 0 &&
        expandedCategories.includes(cat._id)
      ) {
        result = [...result, ...flattenCategories(cat.children, level + 1)];
      }
    });
    return result;
  };

  const sortedCategories = [...flattenCategories(categories)].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (
      sortConfig.key === "budgetAmount" ||
      sortConfig.key === "totalSpent" ||
      sortConfig.key === "budgetUtilization"
    ) {
      aVal = a[sortConfig.key] || 0;
      bVal = b[sortConfig.key] || 0;
    }

    if (sortConfig.direction === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const getStatusBadge = (status) => {
    const badges = {
      over_budget: { color: "bg-red-100 text-red-800", label: "Over Budget" },
      warning: { color: "bg-yellow-100 text-yellow-800", label: "Warning" },
      good: { color: "bg-green-100 text-green-800", label: "Good" },
      unused: { color: "bg-gray-100 text-gray-800", label: "Unused" },
    };
    const config = badges[status] || badges.good;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center space-x-4 p-4 border-b border-gray-200"
          >
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderTree className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No categories found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding a new expense category.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-8"></th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center space-x-1">
                <span>Category</span>
                {sortConfig.key === "name" &&
                  (sortConfig.direction === "asc" ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  ))}
              </div>
            </th>
            <th
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => handleSort("budgetAmount")}
            >
              <div className="flex items-center justify-end space-x-1">
                <DollarSign className="w-3 h-3" />
                <span>Budget</span>
                {sortConfig.key === "budgetAmount" &&
                  (sortConfig.direction === "asc" ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  ))}
              </div>
            </th>
            <th
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => handleSort("totalSpent")}
            >
              <div className="flex items-center justify-end space-x-1">
                <span>Spent</span>
                {sortConfig.key === "totalSpent" &&
                  (sortConfig.direction === "asc" ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  ))}
              </div>
            </th>
            <th
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => handleSort("budgetUtilization")}
            >
              <div className="flex items-center justify-end space-x-1">
                <span>Utilization</span>
                {sortConfig.key === "budgetUtilization" &&
                  (sortConfig.direction === "asc" ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  ))}
              </div>
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedCategories.map((category) => (
            <tr
              key={category._id}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="pl-6 pr-2 py-4">
                {category.children && category.children.length > 0 && (
                  <button
                    onClick={() => toggleExpand(category._id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedCategories.includes(category._id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>
                )}
              </td>
              <td className="px-6 py-4">
                <div
                  className="flex items-center space-x-2"
                  style={{ paddingLeft: `${category.level * 24}px` }}
                >
                  {category.children && category.children.length > 0 ? (
                    <FolderOpen className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Folder className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                    {category.description && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {category.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                {formatCurrency(category.budgetAmount || 0)}
              </td>
              <td className="px-6 py-4 text-right text-sm font-medium text-red-600">
                {formatCurrency(category.totalSpent || 0)}
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-end">
                  <BudgetProgress category={category} compact />
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                {getStatusBadge(category.status)}
              </td>
              <td className="px-6 py-4 text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onEdit(category)}
                    className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                    title="Edit category"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(category)}
                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryTable;
