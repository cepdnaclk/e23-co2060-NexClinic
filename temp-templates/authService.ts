// Define expected API Response types
interface ApiResponse {
  message?: string;
  error?: string;
}

const API_BASE_URL = "http://127.0.0.1:8000/api/users";

/**
 * Verify User OTP
 */
export const verifyOTP = async (
  email: string,
  otp: string,
): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Ensures backend receives JSON
      },
      // JSON.stringify is critical here to match the type check in your Django view
      body: JSON.stringify({ email, otp }),
    });

    const data: ApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Verification failed");
    }

    return data;
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return { error: error.message };
  }
};

/**
 * Resend OTP
 */
export const resendOTP = async (email: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/resend-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data: ApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Resend failed");
    }

    return data;
  } catch (error: any) {
    console.error("Resend OTP Error:", error);
    return { error: error.message };
  }
};
