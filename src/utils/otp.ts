// Generate a random 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get OTP expiry time (5 minutes from now)
export const getOTPExpiry = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
};

// Verify if OTP is valid and not expired
export const isOTPValid = (otp: string | null | undefined, otpExpiry: Date | null | undefined): boolean => {
  if (!otp || !otpExpiry) {
    return false;
  }
  return new Date() <= otpExpiry;
};
