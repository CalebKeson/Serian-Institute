// frontend/src/components/Instructors/SalaryPaymentModal.jsx
import React, { useState } from "react";
import { DollarSign, X, Calendar, CreditCard } from "lucide-react";
import { useInstructorStore } from "../../stores/instructorStore";
import { formatSalary } from "../../utils/instructorDataFormatter";
import toast from "react-hot-toast";

const SalaryPaymentModal = ({ instructor, onClose, onSuccess }) => {
  const { recordSalaryPayment, loading } = useInstructorStore();
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paidForMonth: "",
    paymentMethod: "Bank Transfer",
    transactionReference: "",
    notes: ""
  });
  const [errors, setErrors] = useState({});

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!paymentData.amount || paymentData.amount <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }
    
    if (!paymentData.paidForMonth) {
      newErrors.paidForMonth = "Please select the month";
    }
    
    if (paymentData.amount > instructor.salary) {
      newErrors.amount = `Amount cannot exceed monthly salary (${formatSalary(instructor.salary)})`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const result = await recordSalaryPayment(instructor._id, {
      amount: parseFloat(paymentData.amount),
      paidForMonth: paymentData.paidForMonth,
      paymentMethod: paymentData.paymentMethod,
      transactionReference: paymentData.transactionReference,
      notes: paymentData.notes
    });
    
    if (result.success) {
      toast.success(`Salary payment of ${formatSalary(paymentData.amount)} recorded successfully!`);
      onSuccess();
      onClose();
    }
  };

  const totalPaid = instructor.salaryPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remainingBalance = (instructor.salary || 0) - totalPaid;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <DollarSign className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Record Salary Payment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructor Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Instructor</p>
          <p className="font-medium text-gray-900">{instructor.user?.name}</p>
          <p className="text-sm text-gray-500">{instructor.employeeId}</p>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly Salary:</span>
              <span className="font-medium text-gray-900">{formatSalary(instructor.salary)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Total Paid:</span>
              <span className="font-medium text-green-600">{formatSalary(totalPaid)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Remaining Balance:</span>
              <span className={`font-medium ${remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatSalary(remainingBalance)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                KSh
              </span>
              <input
                type="number"
                name="amount"
                value={paymentData.amount}
                onChange={handleChange}
                placeholder="0.00"
                className={`w-full pl-12 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Paid For Month */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paid For Month *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="paidForMonth"
                value={paymentData.paidForMonth}
                onChange={handleChange}
                placeholder="e.g., January 2024"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.paidForMonth ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.paidForMonth && (
              <p className="mt-1 text-sm text-red-600">{errors.paidForMonth}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Example: {currentMonth} {currentYear}
            </p>
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                name="paymentMethod"
                value={paymentData.paymentMethod}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
            </div>
          </div>

          {/* Transaction Reference */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Reference (Optional)
            </label>
            <input
              type="text"
              name="transactionReference"
              value={paymentData.transactionReference}
              onChange={handleChange}
              placeholder="e.g., TRX-12345"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={paymentData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Additional notes about this payment..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Processing..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalaryPaymentModal;