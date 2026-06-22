"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type HospitalOption = {
  id: number;
  name: string;
  address?: string;
  contact_numbers?: string;
  email?: string;
};

const SL_NIC_REGEX = /^(?:\d{9}[VvXx]|\d{12})$/;
const SL_PHONE_REGEX = /^(?:\+94|0)?7\d{8}$/;

export default function HospitalRegisterForm() {
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("Male");
  const [nic, setNic] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [hospitalLoading, setHospitalLoading] = useState(true);
  const [hospitalFetchError, setHospitalFetchError] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const loadHospitals = async () => {
      try {
        const response = await axios.get("/api/hospital/active");
        const options = Array.isArray(response.data) ? response.data : [];

        if (isMounted) {
          setHospitals(options);
          setHospitalFetchError(options.length === 0 ? "No active hospitals are available right now." : "");
        }
      } catch (fetchError) {
        console.error("Failed to fetch active hospitals", fetchError);
        if (isMounted) {
          setHospitals([]);
          setHospitalFetchError("Unable to load hospitals. Please refresh and try again.");
        }
      } finally {
        if (isMounted) {
          setHospitalLoading(false);
        }
      }
    };

    loadHospitals();

    return () => {
      isMounted = false;
    };
  }, []);

  const validate = () => {
    if (fullName.trim().length < 2) return "Full name must be at least 2 characters.";
    if (!dateOfBirth) return "Date of birth is required.";
    if (!SL_NIC_REGEX.test(nic.trim())) return "Enter a valid NIC number.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Enter a valid email.";
    if (!SL_PHONE_REGEX.test(phone.replace(/\s|-/g, ''))) return "Enter a valid Sri Lankan mobile number.";
    if (address.trim().length < 5) return "Address must be at least 5 characters.";
    if (!employeeId.trim()) return "Employee ID is required.";
    if (!designation.trim()) return "Designation is required.";
    if (!dateOfJoining) return "Date of joining is required.";
    if (!hospitalId) return "Please select a hospital.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== password2) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const vErr = validate();
    if (vErr) { setError(vErr); return; }
    setLoading(true);
    try {
      const payload = {
        full_name: fullName,
        date_of_birth: dateOfBirth,
        gender,
        nic_number: nic,
        email,
        phone,
        address,
        employee_id: employeeId,
        designation,
        date_of_joining: dateOfJoining,
        hospital_id: hospitalId ? Number(hospitalId) : undefined,
        password,
        password2,
      };

      await axios.post('/api/auth/hospital/register', payload);
      router.push(`/verify-otp?email=${encodeURIComponent(email)}&role=hospital`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white/95 border border-slate-100 rounded-3xl shadow-xl p-6 sm:p-8 backdrop-blur-md">
      <form className="space-y-6" onSubmit={handleSubmit}>
        
        {/* Section 1: Personal Information */}
        <div>
          <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4 pb-1.5 border-b border-slate-100">
            Personal Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Full Name</label>
              <input
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">NIC Number</label>
              <input
                placeholder="Enter National ID"
                value={nic}
                onChange={(e) => setNic(e.target.value)}
                required
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Phone Number</label>
              <input
                placeholder="e.g. 0771234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Residential Address</label>
              <input
                placeholder="Enter your home address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Hospital Association */}
        <div>
          <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4 pb-1.5 border-b border-slate-100">
            Employment Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Employee ID</label>
              <input
                placeholder="Enter work ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Designation</label>
              <input
                placeholder="e.g. Operations Manager"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Date of Joining</label>
              <input
                type="date"
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
                required
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Select Hospital</label>
              <select
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                required
                disabled={loading || hospitalLoading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              >
                <option value="">{hospitalLoading ? "Loading hospitals..." : "Select hospital"}</option>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </option>
                ))}
              </select>
              {hospitalFetchError && <p className="text-xs text-red-500 mt-1">{hospitalFetchError}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Credentials */}
        <div>
          <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4 pb-1.5 border-b border-slate-100">
            Account Credentials
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Official Email Address</label>
              <input
                type="email"
                placeholder="Enter official email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Password</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={() => router.push("/hospital/login")}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 py-3 text-sm font-semibold text-slate-600 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] flex justify-center items-center rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Registering...
              </span>
            ) : (
              "Submit Application"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
