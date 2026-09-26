export const createVerificationId = (registrationNumber) => {
  return registrationNumber
    .trim()
    .replace(/\//g, "-")
    .replace(/\s+/g, "")
    .toUpperCase();
};

export const normalizeVerificationId = (verificationId) => {
  return verificationId
    .trim()
    .replace(/\//g, "-")
    .replace(/\s+/g, "")
    .toUpperCase();
};