// src/pages/Profile/Profile.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
      
      // Load avatar from localStorage if exists
      const savedAvatar = localStorage.getItem(`avatar_${user._id}`);
      if (savedAvatar) {
        setAvatarPreview(savedAvatar);
      }
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setAvatar(file);
      setAvatarPreview(base64String);
      
      // Save to localStorage
      if (user?._id) {
        localStorage.setItem(`avatar_${user._id}`, base64String);
        toast.success('Avatar updated successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    // Here you would typically make an API call to update the profile
    // For now, we'll just simulate it
    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    // Validate passwords
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Here you would make an API call to change password
    toast.success('Password changed successfully!');
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const getRoleStats = () => {
    switch(user?.role) {
      case 'admin':
        return [
          { label: 'Total Users', value: '24', icon: '👥', color: 'blue' },
          { label: 'Active Courses', value: '12', icon: '📚', color: 'purple' },
          { label: 'Pending Requests', value: '5', icon: '📋', color: 'yellow' },
          { label: 'System Health', value: '98%', icon: '💚', color: 'green' }
        ];
      case 'receptionist':
        return [
          { label: "Today's Visitors", value: '8', icon: '👥', color: 'blue' },
          { label: 'Pending Requests', value: '3', icon: '⏳', color: 'yellow' },
          { label: 'Completed Today', value: '5', icon: '✅', color: 'green' },
          { label: 'Avg. Wait Time', value: '15m', icon: '⏱️', color: 'purple' }
        ];
      case 'teacher':
        return [
          { label: 'Total Students', value: '45', icon: '👨‍🎓', color: 'blue' },
          { label: 'Active Courses', value: '3', icon: '📚', color: 'purple' },
          { label: 'Pending Grading', value: '12', icon: '📝', color: 'yellow' },
          { label: 'Attendance Rate', value: '94%', icon: '📊', color: 'green' }
        ];
      case 'student':
        return [
          { label: 'Enrolled Courses', value: '5', icon: '📚', color: 'blue' },
          { label: 'Avg. Grade', value: 'A-', icon: '🏆', color: 'green' },
          { label: 'Attendance', value: '96%', icon: '✅', color: 'purple' },
          { label: 'Assignments Due', value: '2', icon: '📅', color: 'yellow' }
        ];
      case 'parent':
        return [
          { label: 'Children', value: '2', icon: '👨‍👩‍👧‍👦', color: 'blue' },
          { label: 'Fee Status', value: 'Paid', icon: '💰', color: 'green' },
          { label: 'Meetings Attended', value: '4', icon: '🤝', color: 'purple' },
          { label: 'Upcoming Events', value: '3', icon: '📅', color: 'yellow' }
        ];
      default:
        return [];
    }
  };

  const getRoleColor = () => {
    switch(user?.role) {
      case 'admin': return 'from-red-500 to-pink-600';
      case 'receptionist': return 'from-blue-500 to-purple-600';
      case 'teacher': return 'from-green-500 to-teal-600';
      case 'student': return 'from-indigo-500 to-blue-600';
      case 'parent': return 'from-purple-500 to-indigo-600';
      default: return 'from-blue-500 to-indigo-600';
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">
              Manage your personal information and account settings
            </p>
          </div>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card & Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Avatar Section */}
                  <div className="relative">
                    <div className={`h-32 w-32 ${getRoleColor()} rounded-full flex items-center justify-center shadow-lg`}>
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt={user.name}
                          className="h-32 w-32 rounded-full object-cover border-4 border-white"
                        />
                      ) : (
                        <span className="text-white text-4xl font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    {isEditing && (
                      <label className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </label>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                    <p className="text-gray-600 mt-1">{user.email}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'receptionist' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'teacher' ? 'bg-green-100 text-green-800' :
                        user.role === 'student' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">Member since 2024</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information Form */}
              <div className="p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Enter your name"
                        />
                      ) : (
                        <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-700">{formData.name || 'Not set'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-700">{formData.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-700">{formData.phone || 'Not set'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-700">{formData.address || 'Not set'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Security & Password</h3>
                <button
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2"
                >
                  {isChangingPassword ? 'Cancel' : 'Change Password'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isChangingPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    )}
                  </svg>
                </button>
              </div>

              {isChangingPassword ? (
                <div className="space-y-6 animate-fadeIn">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter new password"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleChangePassword}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Password</p>
                    <p className="text-sm text-gray-500">Last changed 2 months ago</p>
                  </div>
                  <span className="text-green-600 text-sm font-medium">✓ Secure</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Role Stats */}
          <div className="space-y-8">
            {/* Role Stats */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Dashboard</h3>
              
              <div className="space-y-4">
                {getRoleStats().map((stat, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${
                        stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        stat.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        stat.color === 'green' ? 'bg-green-100 text-green-600' :
                        'bg-yellow-100 text-yellow-600'
                      } group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-xl">{stat.icon}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              
              <div className="space-y-3">
                <a 
                  href="/dashboard" 
                  className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors group"
                >
                  <span>Go to Dashboard</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
                
                <a 
                  href="/help" 
                  className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors group"
                >
                  <span>Help Center</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </a>
                
                <a 
                  href="/contact" 
                  className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors group"
                >
                  <span>Contact Support</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;