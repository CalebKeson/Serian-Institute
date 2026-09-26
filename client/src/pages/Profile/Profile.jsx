// frontend/src/pages/Profile/Profile.jsx - COMPLETE WORKING VERSION

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../stores/authStore';
import { useUserStore } from '../../stores/userStore';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Save, 
  X, 
  Camera, 
  Shield, 
  Briefcase, 
  GraduationCap, 
  Users, 
  Clock, 
  CheckCircle,
  LogOut,
  ChevronRight,
  Settings,
  Bell,
  Lock,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  Loader,
  UserCheck,
  Globe,
  Fingerprint
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, changePassword } = useAuthStore();
  const { 
    profile, 
    profileLoading, 
    getProfile, 
    updateProfile 
  } = useUserStore();
  
  // Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef(null);
  
  // Password change state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: ''
  });

  // Load profile on mount
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Load avatar from localStorage
  useEffect(() => {
    if (user?._id) {
      const savedAvatar = localStorage.getItem(`avatar_${user._id}`);
      if (savedAvatar) {
        setAvatarPreview(savedAvatar);
      }
    }
  }, [user?._id]);

  const loadProfile = async () => {
    const result = await getProfile();
    if (result.success && result.data) {
      const userData = result.data.user || result.data;
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        bio: userData.bio || ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setAvatarPreview(base64String);
      if (user?._id) {
        localStorage.setItem(`avatar_${user._id}`, base64String);
        toast.success('Profile picture updated!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setIsEditing(false);
        // Update auth store user data
        const updatedUser = {
          ...user,
          ...formData
        };
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully!');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      bio: user?.bio || ''
    });
    setIsEditing(false);
  };

  // ============ FIXED: Password Change - No redirect loop ============
  const handleChangePassword = async () => {
    // Validation
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (result.success) {
        // Reset form
        setShowChangePassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Stay on page - no redirect!
        toast.success('Password changed successfully!');
      }
    } catch (error) {
      // Error already handled in store
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleColor = () => {
    switch(user?.role) {
      case 'admin': return 'from-red-500 to-pink-600';
      case 'instructor': return 'from-blue-500 to-indigo-600';
      case 'student': return 'from-emerald-500 to-teal-600';
      case 'parent': return 'from-purple-500 to-violet-600';
      case 'receptionist': return 'from-amber-500 to-orange-600';
      default: return 'from-blue-500 to-indigo-600';
    }
  };

  const getRoleLabel = () => {
    switch(user?.role) {
      case 'admin': return 'Administrator';
      case 'instructor': return 'Instructor';
      case 'student': return 'Student';
      case 'parent': return 'Parent';
      case 'receptionist': return 'Receptionist';
      default: return 'User';
    }
  };

  const getRoleIcon = () => {
    switch(user?.role) {
      case 'admin': return <Shield className="w-5 h-5" />;
      case 'instructor': return <Briefcase className="w-5 h-5" />;
      case 'student': return <GraduationCap className="w-5 h-5" />;
      case 'parent': return <Users className="w-5 h-5" />;
      case 'receptionist': return <UserCheck className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  if (profileLoading && !profile) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-500">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your personal information and account security</p>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Cover / Header Section */}
          <div className={`bg-gradient-to-r ${getRoleColor()} px-8 py-10 relative`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-gray-600">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* User Info */}
              <div className="flex-1 text-white">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold">{user?.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm border border-white/30 flex items-center gap-1.5`}>
                    {getRoleIcon()}
                    {getRoleLabel()}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-white/80 text-sm flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </span>
                  {user?.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4" />
                      {user?.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Member since {new Date(user?.createdAt || Date.now()).getFullYear()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium shadow-lg disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            {/* Tabs - Only Profile & Security */}
            <div className="flex gap-6 border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'security'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                Security
              </button>
            </div>

            {/* ============ PROFILE TAB ============ */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Personal Info */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                          {formData.name || 'Not set'}
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Enter your email"
                        />
                      ) : (
                        <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-700 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {formData.email}
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-700 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {formData.phone || 'Not set'}
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Address
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Enter your address"
                        />
                      ) : (
                        <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-700 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {formData.address || 'Not set'}
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Bio / About
                      </label>
                      {isEditing ? (
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                          placeholder="Tell us a little about yourself..."
                        />
                      ) : (
                        <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-700 min-h-[80px]">
                          {formData.bio || 'No bio provided yet.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Role Info & Quick Actions */}
                <div className="space-y-6">
                  {/* Role Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getRoleIcon()}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Your Role</p>
                        <p className="font-semibold text-gray-900">{getRoleLabel()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Account Status</span>
                        <span className="font-medium text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Active
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Member Since</span>
                        <span className="font-medium text-gray-700">
                          {new Date(user?.createdAt || Date.now()).getFullYear()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">User ID</span>
                        <span className="font-mono text-xs text-gray-600 truncate max-w-[120px]">
                          {user?._id?.slice(-8)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => navigate('/settings')}
                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Account Settings
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigate('/notifications')}
                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
                      >
                        <span className="flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          Notifications
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm text-red-600"
                      >
                        <span className="flex items-center gap-2">
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </span>
                        <ChevronRight className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============ SECURITY TAB - FIXED LAYOUT (Full Width) ============ */}
            {activeTab === 'security' && (
              <div className="max-w-3xl mx-auto">
                <div className="space-y-6">
                  {/* Password Change Section */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-600" />
                        Password & Security
                      </h3>
                    </div>

                    <div className="p-6">
                      {!showChangePassword ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Password</p>
                            <p className="text-sm text-gray-500">Last changed 2 months ago</p>
                          </div>
                          <button
                            onClick={() => setShowChangePassword(true)}
                            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            Change Password
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Current Password */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Current Password
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter current password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* New Password */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              New Password
                            </label>
                            <div className="relative">
                              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type={showNewPassword ? 'text' : 'password'}
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter new password (min. 6 characters)"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Password must be at least 6 characters
                              </p>
                            )}
                          </div>

                          {/* Confirm Password */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Confirm new password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Passwords do not match
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={() => {
                                setShowChangePassword(false);
                                setPasswordData({
                                  currentPassword: '',
                                  newPassword: '',
                                  confirmPassword: ''
                                });
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleChangePassword}
                              disabled={isChangingPassword}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {isChangingPassword ? (
                                <>
                                  <Loader className="w-4 h-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <Key className="w-4 h-4" />
                                  Update Password
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        Two-Factor Authentication
                      </h3>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">2FA Security</p>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Session Management */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-gray-600" />
                        Active Sessions
                      </h3>
                    </div>

                    <div className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Fingerprint className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Current Session</p>
                              <p className="text-sm text-gray-500">Chrome • Nairobi, Kenya</p>
                            </div>
                          </div>
                          <span className="text-xs text-green-600 font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;