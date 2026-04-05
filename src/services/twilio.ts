import twilio from "twilio";
import { ErrorResponse } from "../utils/errorResponse";

type SendOtpResult = {
  delivery: "twilio" | "development";
  sid?: string;
};

const isDevelopment = process.env.NODE_ENV === "development";

const getRequiredEnv = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

const normalizePhoneNumber = (mobileNo: string): string => {
  if (mobileNo.startsWith("+")) {
    return mobileNo;
  }

  const digitsOnly = mobileNo.replace(/\D/g, "");

  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  return `+${digitsOnly}`;
};

const getTwilioClient = () => {
  const accountSid = getRequiredEnv("TWILIO_ACCOUNT_SID");
  const authToken = getRequiredEnv("TWILIO_AUTH_TOKEN");

  if (!accountSid || !authToken) {
    return null;
  }

  return twilio(accountSid, authToken);
};

export const sendOTPViaTwilio = async (
  mobileNo: string,
  otp: string,
  context: "registration" | "login"
): Promise<SendOtpResult> => {
  const client = getTwilioClient();
  const from = getRequiredEnv("TWILIO_PHONE_NUMBER");
  const to = normalizePhoneNumber(mobileNo);

  if (!client || !from) {
    if (isDevelopment) {
      console.warn("Twilio is not fully configured. Falling back to development OTP logging.");
      console.log(`OTP for ${to} (${context}): ${otp}`);

      return { delivery: "development" };
    }

    throw new ErrorResponse("SMS service is not configured", 500);
  }

  try {
    const message = await client.messages.create({
      body: `Your OTT verification code is ${otp}. It expires in 5 minutes.`,
      from,
      to,
    });

    return {
      delivery: "twilio",
      sid: message.sid,
    };
  } catch (error) {
    console.error("Twilio send error:", error);
    throw new ErrorResponse("Failed to send OTP SMS", 502);
  }
};
