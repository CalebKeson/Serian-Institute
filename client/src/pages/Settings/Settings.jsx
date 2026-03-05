// src/pages/Settings/Settings.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    language: 'english',
    timezone: 'Africa/Nairobi',
    
    // Display Settings
    theme: 'light',
    compactView: false,
    showAvatars: true,
    animationLevel: 'normal',
    
    // Privacy Settings
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowTagging: true,
    
    // Notification Preferences
    emailFrequency: 'daily',
    notifyNewRequests: true,
    notifyAssignments: true,
    notifyDeadlines: true,
    notifySystemUpdates: true
  });

  const [loading, setLoading] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(`user_settings_${user?._id}`);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [user]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (user?._id) {
      localStorage.setItem(`user_settings_${user._id}`, JSON.stringify(settings));
    }
  }, [settings, user]);

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Settings saved successfully!');
      setLoading(false);
    }, 500);
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      emailNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
      language: 'english',
      timezone: 'Africa/Nairobi',
      theme: 'light',
      compactView: false,
      showAvatars: true,
      animationLevel: 'normal',
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowTagging: true,
      emailFrequency: 'daily',
      notifyNewRequests: true,
      notifyAssignments: true,
      notifyDeadlines: true,
      notifySystemUpdates: true
    };
    
    setSettings(defaultSettings);
    toast.success('Settings reset to defaults');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'display', label: 'Display', icon: '🎨' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'account', label: 'Account', icon: '👤' }
  ];

  const timezones = [
    'Africa/Nairobi',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Europe/London',
    'America/New_York',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore'
  ];

  const languages = [
    { value: 'english', label: 'English' },
    { value: 'swahili', label: 'Swahili' },
    { value: 'french', label: 'French' },
    { value: 'spanish', label: 'Spanish' }
  ];

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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Customize your Serian Institute experience and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-6">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
              
              {/* Save Button in Sidebar */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleResetSettings}
                  className="w-full mt-3 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Tab Content */}
              <div className="p-8">
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-8 animate-fadeIn">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-6">General Settings</h2>
                      
                      <div className="space-y-6">
                        {/* Language */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Language
                          </label>
                          <select
                            value={settings.language}
                            onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          >
                            {languages.map((lang) => (
                              <option key={lang.value} value={lang.value}>
                                {lang.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-sm text-gray-500">
                            Choose your preferred language for the interface
                          </p>
                        </div>

                        {/* Timezone */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Timezone
                          </label>
                          <select
                            value={settings.timezone}
                            onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          >
                            {timezones.map((tz) => (
                              <option key={tz} value={tz}>
                                {tz.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                          <p className="text-sm text-gray-500">
                            Set your local timezone for accurate time displays
                          </p>
                        </div>

                        {/* Marketing Emails */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
                            <p className="text-sm text-gray-500">Receive updates about new features and promotions</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.marketingEmails}
                              onChange={(e) => handleSettingChange('general', 'marketingEmails', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Display Settings */}
                {activeTab === 'display' && (
                  <div className="space-y-8 animate-fadeIn">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Display Settings</h2>
                      
                      <div className="space-y-6">
                        {/* Theme */}
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Interface Theme
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                              { id: 'light', label: 'Light', icon: '☀️' },
                              { id: 'dark', label: 'Dark', icon: '🌙' },
                              { id: 'auto', label: 'Auto', icon: '🔄' }
                            ].map((theme) => (
                              <label
                                key={theme.id}
                                className={`cursor-pointer p-4 border-2 rounded-xl transition-all duration-200 ${
                                  settings.theme === theme.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="theme"
                                  value={theme.id}
                                  checked={settings.theme === theme.id}
                                  onChange={(e) => handleSettingChange('display', 'theme', e.target.value)}
                                  className="sr-only"
                                />
                                <div className="flex flex-col items-center">
                                  <span className="text-2xl mb-2">{theme.icon}</span>
                                  <span className="text-sm font-medium text-gray-900">{theme.label}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Animation Level */}
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Animation Level
                          </label>
                          <div className="space-y-2">
                            {[
                              { id: 'minimal', label: 'Minimal', description: 'Few animations for better performance' },
                              { id: 'normal', label: 'Normal', description: 'Balanced animations for smooth experience' },
                              { id: 'full', label: 'Full', description: 'All animations enabled for rich experience' }
                            ].map((level) => (
                              <label
                                key={level.id}
                                className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name="animationLevel"
                                  value={level.id}
                                  checked={settings.animationLevel === level.id}
                                  onChange={(e) => handleSettingChange('display', 'animationLevel', e.target.value)}
                                  className="mt-1 mr-3"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{level.label}</p>
                                  <p className="text-sm text-gray-500">{level.description}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Quick Toggles */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Compact View</p>
                              <p className="text-sm text-gray-500">Show more content in less space</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.compactView}
                                onChange={(e) => handleSettingChange('display', 'compactView', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Show Avatars</p>
                              <p className="text-sm text-gray-500">Display profile pictures throughout the app</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.showAvatars}
                                onChange={(e) => handleSettingChange('display', 'showAvatars', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                  <div className="space-y-8 animate-fadeIn">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Privacy Settings</h2>
                      
                      <div className="space-y-6">
                        {/* Profile Visibility */}
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Profile Visibility
                          </label>
                          <div className="space-y-2">
                            {[
                              { id: 'public', label: 'Public', description: 'Anyone can see your profile' },
                              { id: 'institution', label: 'Institution Only', description: 'Only Serian Institute members can see your profile' },
                              { id: 'private', label: 'Private', description: 'Only you can see your profile' }
                            ].map((option) => (
                              <label
                                key={option.id}
                                className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name="profileVisibility"
                                  value={option.id}
                                  checked={settings.profileVisibility === option.id}
                                  onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                                  className="mt-1 mr-3"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{option.label}</p>
                                  <p className="text-sm text-gray-500">{option.description}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Quick Toggles */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Show Online Status</p>
                              <p className="text-sm text-gray-500">Let others see when you're active</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.showOnlineStatus}
                                onChange={(e) => handleSettingChange('privacy', 'showOnlineStatus', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Allow Tagging</p>
                              <p className="text-sm text-gray-500">Allow others to mention you in comments and notes</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.allowTagging}
                                onChange={(e) => handleSettingChange('privacy', 'allowTagging', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <div className="space-y-8 animate-fadeIn">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
                      
                      <div className="space-y-6">
                        {/* Email Frequency */}
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Email Summary Frequency
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                              { id: 'realtime', label: 'Real-time', icon: '⚡' },
                              { id: 'daily', label: 'Daily Digest', icon: '📅' },
                              { id: 'weekly', label: 'Weekly Report', icon: '📊' }
                            ].map((freq) => (
                              <label
                                key={freq.id}
                                className={`cursor-pointer p-4 border-2 rounded-xl transition-all duration-200 ${
                                  settings.emailFrequency === freq.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="emailFrequency"
                                  value={freq.id}
                                  checked={settings.emailFrequency === freq.id}
                                  onChange={(e) => handleSettingChange('notifications', 'emailFrequency', e.target.value)}
                                  className="sr-only"
                                />
                                <div className="flex flex-col items-center">
                                  <span className="text-2xl mb-2">{freq.icon}</span>
                                  <span className="text-sm font-medium text-gray-900">{freq.label}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Notification Types */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-gray-700">Notification Types</h3>
                          
                          <div className="space-y-3">
                            {[
                              { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                              { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser push notifications' },
                              { key: 'notifyNewRequests', label: 'New Visitor Requests', description: 'When new visitor requests are created' },
                              { key: 'notifyAssignments', label: 'Task Assignments', description: 'When you are assigned new tasks' },
                              { key: 'notifyDeadlines', label: 'Deadline Reminders', description: 'Reminders for upcoming deadlines' },
                              { key: 'notifySystemUpdates', label: 'System Updates', description: 'Important system updates and maintenance' }
                            ].map((notif) => (
                              <div key={notif.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{notif.label}</p>
                                  <p className="text-sm text-gray-500">{notif.description}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={settings[notif.key]}
                                    onChange={(e) => handleSettingChange('notifications', notif.key, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Settings */}
                {activeTab === 'account' && (
                  <div className="space-y-8 animate-fadeIn">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Account Management</h2>
                      
                      <div className="space-y-6">
                        {/* Account Information */}
                        <div className="bg-blue-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-blue-900 mb-4">Account Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-blue-700">Account ID</p>
                              <p className="text-sm text-blue-900 font-mono">{user._id}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-700">Account Type</p>
                              <p className="text-sm text-blue-900 capitalize">{user.role}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-700">Email</p>
                              <p className="text-sm text-blue-900">{user.email}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-700">Status</p>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="border border-red-200 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
                          <p className="text-sm text-red-700 mb-6">
                            These actions are irreversible. Please proceed with caution.
                          </p>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-red-900">Deactivate Account</p>
                                <p className="text-sm text-red-700">Temporarily disable your account</p>
                              </div>
                              <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm">
                                Deactivate
                              </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-red-900">Delete Account</p>
                                <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                              </div>
                              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                                Delete Account
                              </button>
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
        </div>
      </div>
    </Layout>
  );
};

export default Settings;