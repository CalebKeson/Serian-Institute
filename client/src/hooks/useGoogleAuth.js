// src/hooks/useGoogleAuth.js - UPDATED VERSION
import { useState } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  browserPopupRedirectResolver 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebaseConfig';
import { useAuthStore } from '../stores/authStore';

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { googleLogin } = useAuthStore();

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting Google sign-in...');
      console.log('Firebase config:', {
        apiKey: auth.app.options.apiKey ? '✓ Present' : '✗ Missing',
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId
      });

      // Sign in with Firebase
      const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      const user = result.user;
      
      console.log('Google user authenticated:', {
        email: user.email,
        name: user.displayName,
        uid: user.uid
      });
      
      // Extract user data
      const googleData = {
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        photo: user.photoURL || ''
      };
      
      // Send to backend
      console.log('Sending to backend...');
      const loginResult = await googleLogin(googleData);
      
      if (!loginResult.success) {
        throw new Error(loginResult.message || 'Backend authentication failed');
      }
      
      console.log('Google auth successful!');
      return { success: true, user: googleData };
    } catch (error) {
      console.error('Google sign-in error details:', {
        code: error.code,
        message: error.message,
        fullError: error
      });
      
      // Handle specific Firebase errors
      let userMessage = 'Failed to sign in with Google';
      
      switch (error.code) {
        case 'auth/operation-not-allowed':
          userMessage = 'Google sign-in is not enabled. Please contact support.';
          break;
        case 'auth/popup-blocked':
          userMessage = 'Popup was blocked by browser. Please allow popups for this site.';
          break;
        case 'auth/popup-closed-by-user':
          userMessage = 'Sign-in was cancelled.';
          break;
        case 'auth/network-request-failed':
          userMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/unauthorized-domain':
          userMessage = 'This domain is not authorized for Firebase authentication.';
          break;
        default:
          userMessage = error.message || 'Google sign-in failed';
      }
      
      setError(userMessage);
      return { success: false, message: userMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Google sign-out error:', error);
    }
  };

  return {
    signInWithGoogle,
    signOut,
    loading,
    error,
    clearError: () => setError(null)
  };
};