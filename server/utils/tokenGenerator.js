import crypto from 'crypto';

export const generateResetToken = () => {
  // Generate random token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash token for database storage
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  // Set expiration to 5 minutes from now
  const resetPasswordExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
  
  return {
    resetToken,        // Plain token to send in email
    hashedToken,       // Hashed version for database
    resetPasswordExpire
  };
};