"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BlackButton from "@/components/buttons/BlackButton";
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

function HospitalRegisterForm() {
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

      const resp = await axios.post('/api/auth/hospital/register', payload);
      // Redirect to verify OTP with role param
      router.push(`/verify-otp?email=${encodeURIComponent(email)}&role=hospital`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-[400px] gap-4 p-6 bg-white items-center justify-center rounded-xl shadow-md">
      <div className="mb-4 items-center text-2xl font-bold">
        <p>Hospital Admin Registration</p>
      </div>
      <form className="flex flex-col gap-3 w-full" onSubmit={handleSubmit}>
        <input placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} required className="shadow rounded-lg p-2" />
        <div className="flex gap-2">
          <input type="date" value={dateOfBirth} onChange={e=>setDateOfBirth(e.target.value)} required className="shadow rounded-lg p-2" />
          <select value={gender} onChange={e=>setGender(e.target.value)} className="shadow rounded-lg p-2">
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <input placeholder="National ID (NIC)" value={nic} onChange={e=>setNic(e.target.value)} required className="shadow rounded-lg p-2" />
        <input type="email" placeholder="Official email" value={email} onChange={e=>setEmail(e.target.value)} required className="shadow rounded-lg p-2" />
        <input placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} required className="shadow rounded-lg p-2" />
        <input placeholder="Residential address" value={address} onChange={e=>setAddress(e.target.value)} required className="shadow rounded-lg p-2" />
        <div className="flex gap-2">
          <input placeholder="Employee ID" value={employeeId} onChange={e=>setEmployeeId(e.target.value)} required className="shadow rounded-lg p-2 flex-1" />
          <input placeholder="Designation" value={designation} onChange={e=>setDesignation(e.target.value)} required className="shadow rounded-lg p-2 flex-1" />
        </div>
        <input type="date" placeholder="Date of joining" value={dateOfJoining} onChange={e=>setDateOfJoining(e.target.value)} required className="shadow rounded-lg p-2" />
        <select
          value={hospitalId}
          onChange={e=>setHospitalId(e.target.value)}
          required
          disabled={hospitalLoading}
          className="shadow rounded-lg p-2 bg-white"
        >
          <option value="">{hospitalLoading ? "Loading hospitals..." : "Select hospital"}</option>
          {hospitals.map((hospital) => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.name}
            </option>
          ))}
        </select>
        {hospitalFetchError && <p className="text-xs text-red-500">{hospitalFetchError}</p>}
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required className="shadow rounded-lg p-2" />
        <input type="password" placeholder="Confirm password" value={password2} onChange={e=>setPassword2(e.target.value)} required className="shadow rounded-lg p-2" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <BlackButton type="submit" disabled={loading} className="w-full py-2 rounded-lg">
          <span className="text-white font-bold">{loading ? 'Registering...' : 'Register'}</span>
        </BlackButton>
      </form>
    </div>
  );
}

export default HospitalRegisterForm;
