// src/pages/Income/RecordIncome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Save,
  X,
  User,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  AlertCircle,
  Loader,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Building,
  Mail,
  Phone,
  Hash,
  Receipt
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useIncomeStore } from '../../stores/incomeStore';
import { useDirectorStore } from '../../stores/directorStore';
import { useAuthStore } from '../../stores/authStore';
import IncomeSourceSelector from '../../components/Income/IncomeSourceSelector';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const RecordIncome = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createIncomeTransaction, loading } = useIncomeStore();
  const { directors, fetchDirectors, loading: directorsLoading } = useDirectorStore();

  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState('');
  const [selectedDirector, setSelectedDirector] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    incomeDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    reference: '',
    description: '',
    notes: '',
    // Director-specific
    investmentType: 'equity',
    repaymentTerms: 'shares',
    interestRate: '',
    // Grant/Donation-specific
    donorName: '',
    donorType: 'individual',
    grantReference: '',
    grantPeriod: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [directorSearch, setDirectorSearch] = useState('');
  const [showDirectorDropdown, setShowDirectorDropdown] = useState(false);

  // Load directors for dropdown
  useEffect(() => {
    if (sourceType === 'director_investment') {
      fetchDirectors();
    }
  }, [sourceType]);

  // Check if user is admin
  if (user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  const filteredDirectors = directors.filter(d => {
    if (!directorSearch) return true;
    const searchLower = directorSearch.toLowerCase();
    return (
      d.name?.toLowerCase().includes(searchLower) ||
      d.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleSourceSelect = (source) => {
    setSourceType(source);
    setStep(2);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/income');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDirectorSelect = (director) => {
    setSelectedDirector(director);
    setDirectorSearch('');
    setShowDirectorDropdown(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!sourceType) {
      newErrors.sourceType = 'Please select an income source';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.incomeDate) {
      newErrors.incomeDate = 'Income date is required';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    if (sourceType === 'director_investment') {
      if (!selectedDirector) {
        newErrors.director = 'Please select a director';
      }
      if (formData.investmentType === 'loan' && !formData.interestRate) {
        newErrors.interestRate = 'Interest rate is required for loans';
      }
    }

    if (sourceType === 'grant') {
      if (!formData.donorName) {
        newErrors.donorName = 'Donor name is required';
      }
    }

    if (sourceType === 'donation') {
      if (!formData.donorName) {
        newErrors.donorName = 'Donor name is required';
      }
    }

    if (sourceType === 'auxiliary' || sourceType === 'other') {
      if (!formData.description) {
        newErrors.description = 'Description is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const incomeData = {
        sourceType,
        amount: parseFloat(formData.amount),
        incomeDate: formData.incomeDate,
        paymentMethod: formData.paymentMethod,
        reference: formData.reference,
        description: formData.description || `${sourceType.replace('_', ' ')} income`,
        notes: formData.notes
      };

      // Add source-specific fields
      if (sourceType === 'director_investment') {
        incomeData.directorId = selectedDirector._id;
        incomeData.investmentType = formData.investmentType;
        incomeData.repaymentTerms = formData.repaymentTerms;
        if (formData.interestRate) incomeData.interestRate = parseFloat(formData.interestRate);
      } else if (sourceType === 'grant') {
        incomeData.donorName = formData.donorName;
        incomeData.donorType = formData.donorType;
        incomeData.grantReference = formData.grantReference;
        incomeData.grantPeriod = formData.grantPeriod;
      } else if (sourceType === 'donation') {
        incomeData.donorName = formData.donorName;
        incomeData.donorType = formData.donorType;
      }

      const result = await createIncomeTransaction(incomeData);

      if (result.success) {
        toast.success('Income recorded successfully!');
        navigate(`/income/${result.data._id}`);
      }
    } catch (error) {
      console.error('Error recording income:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Select Income Source</h2>
        <p className="text-sm text-gray-600 mt-1">
          Choose the type of income you want to record
        </p>
      </div>
      <div className="p-6">
        <IncomeSourceSelector
          selected={sourceType}
          onSelect={handleSourceSelect}
          disabled={[]}
        />
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
        <button
          onClick={() => navigate('/income')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Source Type Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Income Source:</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {sourceType === 'director_investment' ? 'Director Investment' :
               sourceType === 'grant' ? 'Grant' :
               sourceType === 'donation' ? 'Donation' :
               sourceType === 'auxiliary' ? 'Auxiliary Income' :
               sourceType === 'other' ? 'Other Income' : sourceType}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-sm text-green-600 hover:text-green-700"
          >
            Change
          </button>
        </div>

        {/* Director Investment Fields */}
        {sourceType === 'director_investment' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Director *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={directorSearch}
                  onChange={(e) => {
                    setDirectorSearch(e.target.value);
                    setShowDirectorDropdown(true);
                  }}
                  onFocus={() => setShowDirectorDropdown(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Search director by name or email..."
                />
                {showDirectorDropdown && filteredDirectors.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredDirectors.map(director => (
                      <button
                        key={director._id}
                        type="button"
                        onClick={() => handleDirectorSelect(director)}
                        className="w-full px-4 py-2 text-left hover:bg-green-50 transition-colors border-b border-gray-100"
                      >
                        <p className="font-medium text-gray-900">{director.name}</p>
                        <p className="text-xs text-gray-500">{director.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.director && (
                <p className="mt-1 text-sm text-red-600">{errors.director}</p>
              )}
            </div>

            {selectedDirector && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800">Selected Director</p>
                <p className="text-sm text-gray-900">{selectedDirector.name}</p>
                <p className="text-xs text-gray-500">{selectedDirector.email}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Type
                </label>
                <select
                  name="investmentType"
                  value={formData.investmentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="equity">Equity</option>
                  <option value="loan">Loan</option>
                  <option value="donation">Donation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repayment Terms
                </label>
                <select
                  name="repaymentTerms"
                  value={formData.repaymentTerms}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="shares">Shares (Dividend-based)</option>
                  <option value="dividends">Dividends Only</option>
                  <option value="interest">Interest Only</option>
                  <option value="lump_sum">Lump Sum Repayment</option>
                </select>
              </div>
            </div>

            {formData.investmentType === 'loan' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., 5.0"
                />
                {errors.interestRate && (
                  <p className="mt-1 text-sm text-red-600">{errors.interestRate}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Grant Fields */}
        {sourceType === 'grant' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Donor Name *
              </label>
              <input
                type="text"
                name="donorName"
                value={formData.donorName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Ministry of Education, World Bank"
              />
              {errors.donorName && (
                <p className="mt-1 text-sm text-red-600">{errors.donorName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Donor Type
              </label>
              <select
                name="donorType"
                value={formData.donorType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="individual">Individual</option>
                <option value="organization">Organization</option>
                <option value="government">Government</option>
                <option value="ngo">NGO</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grant Reference
              </label>
              <input
                type="text"
                name="grantReference"
                value={formData.grantReference}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., GR-2024-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grant Period
              </label>
              <input
                type="text"
                name="grantPeriod"
                value={formData.grantPeriod}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 2024-2025"
              />
            </div>
          </div>
        )}

        {/* Donation Fields */}
        {sourceType === 'donation' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Donor Name *
              </label>
              <input
                type="text"
                name="donorName"
                value={formData.donorName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., John Doe, ABC Foundation"
              />
              {errors.donorName && (
                <p className="mt-1 text-sm text-red-600">{errors.donorName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Donor Type
              </label>
              <select
                name="donorType"
                value={formData.donorType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="individual">Individual</option>
                <option value="organization">Organization</option>
                <option value="alumni">Alumni</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}

        {/* Common Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Income Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                name="incomeDate"
                value={formData.incomeDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                  errors.incomeDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.incomeDate && (
              <p className="mt-1 text-sm text-red-600">{errors.incomeDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'mpesa', label: 'M-Pesa' },
                { value: 'cash', label: 'Cash' },
                { value: 'other', label: 'Other' }
              ].map(method => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value }))}
                  className={`p-2 border rounded-lg text-sm font-medium transition-all ${
                    formData.paymentMethod === method.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-700 hover:border-green-300'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
            {errors.paymentMethod && (
              <p className="mt-2 text-sm text-red-600">{errors.paymentMethod}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference / Transaction ID
            </label>
            <div className="relative">
              <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Bank reference, M-Pesa transaction ID, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Brief description of this income..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4 inline mr-1" />
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            {isSubmitting || loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Record Income
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <DollarSign className="w-8 h-8 mr-3 text-green-600" />
                Record Income
              </h1>
              <p className="mt-2 text-gray-600">
                {step === 1 ? 'Select the type of income to record' : 'Enter income details'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 1 ? 'border-green-600 bg-green-50' : 'border-gray-300'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Select Source</span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-green-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 2 ? 'border-green-600 bg-green-50' : 'border-gray-300'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Enter Details</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </div>
    </Layout>
  );
};

export default RecordIncome;