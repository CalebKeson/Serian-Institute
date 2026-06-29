// frontend/src/components/Referral/ReferralSelector.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Building, Users, Award, X, Check, Loader, Hash, UserPlus } from 'lucide-react';
import { useReferralStore } from '../../stores/referralStore';

const ReferralSelector = ({ 
  value, 
  onChange, 
  placeholder = "Search for referrer...",
  label = "Referred By",
  required = false,
  allowCreate = true,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferrer, setSelectedReferrer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const { referrers, fetchReferrers, createReferrer, loading } = useReferralStore();

  // Load referrers when dropdown opens
  useEffect(() => {
    if (isOpen && referrers.length === 0 && !loading) {
      fetchReferrers(1, { search: searchTerm, limit: 20 });
    }
  }, [isOpen]);

  // Filter referrers based on search
  useEffect(() => {
    if (isOpen && searchTerm.length > 1) {
      const timer = setTimeout(() => {
        fetchReferrers(1, { search: searchTerm, limit: 20 });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set selected referrer from value prop
  useEffect(() => {
    if (value && referrers.length > 0 && !selectedReferrer) {
      const found = referrers.find(r => r._id === value || r.referrerCode === value);
      if (found) {
        setSelectedReferrer(found);
      }
    }
  }, [value, referrers]);

  const handleSelectReferrer = (referrer) => {
    setSelectedReferrer(referrer);
    setIsOpen(false);
    setSearchTerm('');
    if (onChange) {
      onChange({
        referrerId: referrer._id,
        referrerName: referrer.referrerName,
        referrerType: referrer.referrerType,
        referrerCode: referrer.referrerCode
      });
    }
  };

  const handleClear = () => {
    setSelectedReferrer(null);
    setSearchTerm('');
    if (onChange) {
      onChange(null);
    }
  };

  const handleCreateNew = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await createReferrer({
        referrerName: searchTerm,
        referrerType: 'other',
        notes: 'Created during student registration'
      });
      
      if (result.success) {
        handleSelectReferrer(result.data);
        toast.success(`Referrer "${searchTerm}" created`);
      }
    } catch (error) {
      console.error('Error creating referrer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getReferrerTypeIcon = (type) => {
    const icons = {
      employee: <Building className="w-4 h-4" />,
      agent: <Users className="w-4 h-4" />,
      student: <User className="w-4 h-4" />,
      social_media: <Award className="w-4 h-4" />,
      advertisement: <Award className="w-4 h-4" />,
      walk_in: <User className="w-4 h-4" />,
      other: <User className="w-4 h-4" />
    };
    return icons[type] || <User className="w-4 h-4" />;
  };

  const getReferrerTypeLabel = (type) => {
    const labels = {
      employee: 'Employee',
      agent: 'Agent',
      student: 'Student',
      social_media: 'Social Media',
      advertisement: 'Advertisement',
      walk_in: 'Walk-in',
      other: 'Other'
    };
    return labels[type] || type;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {selectedReferrer ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              {getReferrerTypeIcon(selectedReferrer.referrerType)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {selectedReferrer.referrerName}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="capitalize">{getReferrerTypeLabel(selectedReferrer.referrerType)}</span>
                {selectedReferrer.referrerCode && (
                  <>
                    <span>•</span>
                    <code className="text-purple-600">{selectedReferrer.referrerCode}</code>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <Loader className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading referrers...</p>
                </div>
              ) : referrers.length > 0 ? (
                <div>
                  {referrers.map((referrer) => (
                    <button
                      key={referrer._id}
                      type="button"
                      onClick={() => handleSelectReferrer(referrer)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {getReferrerTypeIcon(referrer.referrerType)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {referrer.referrerName}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span className="capitalize">{getReferrerTypeLabel(referrer.referrerType)}</span>
                            {referrer.referrerCode && (
                              <>
                                <span>•</span>
                                <code className="text-purple-600">{referrer.referrerCode}</code>
                              </>
                            )}
                            <span>•</span>
                            <span>{referrer.totalReferrals || 0} referrals</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchTerm.length > 1 && allowCreate ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500 mb-2">
                    No referrers found matching "{searchTerm}"
                  </p>
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create "{searchTerm}"
                      </>
                    )}
                  </button>
                </div>
              ) : searchTerm.length > 1 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No referrers found</p>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">Type at least 2 characters to search</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReferralSelector;