export interface SendOtpRequest {
  phoneNumber: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  sessionId?: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
  sessionId?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: any;
}
