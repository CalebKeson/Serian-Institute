// src/components/Users/DeleteUserModal.jsx - COMPLETE FIXED VERSION

import React from 'react';
import { X, Trash2, AlertCircle } from 'lucide-react';

const DeleteUserModal = ({ user, onClose, onConfirm, loading }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Are you sure?</p>
                <p className="text-sm text-red-700 mt-1">
                  You are about to delete the user{' '}
                  <span className="font-semibold">{user.name}</span>.
                  This action cannot be undone.
                </p>
                {user.role === 'student' && user.studentInfo && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ This user has a student record. Deleting will also remove the student profile.
                  </p>
                )}
                {user.role === 'admin' && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ This is an admin account. Please confirm you want to delete it.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">Name:</span>
              <span className="font-medium text-gray-900">{user.name}</span>
              <span className="text-gray-500">Email:</span>
              <span className="font-medium text-gray-900">{user.email}</span>
              <span className="text-gray-500">Role:</span>
              <span className="font-medium text-gray-900 capitalize">{user.role}</span>
              <span className="text-gray-500">Status:</span>
              <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(user._id)}
              disabled={loading}
              className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;