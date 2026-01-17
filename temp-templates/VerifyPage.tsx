'use client';

import { useState } from 'react';
import { verifyOTP, resendOTP } from './authService';

export default function VerifyPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  const handleVerify = async () => {
    const result = await verifyOTP(email, otp);
    if (result.error) {
      alert(result.error);
    } else {
      alert(result.message); // "Account verified successfully"
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <input 
        type="email" 
        placeholder="Email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded"
      />
      <input 
        type="text" 
        placeholder="OTP" 
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="border p-2 rounded"
      />
      <button onClick={handleVerify} className="bg-blue-500 text-white p-2 rounded">
        Verify
      </button>
      <button onClick={() => resendOTP(email)} className="text-blue-500 underline">
        Resend Code
      </button>
    </div>
  );
}
