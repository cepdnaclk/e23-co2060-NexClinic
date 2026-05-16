'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import GreenButton from '@/components/buttons/GreenButton';
import BlackButton from '@/components/buttons/BlackButton';
import { handlePatientSessionExpired } from '@/lib/patientSession';
import { Patient } from '@/data/patients';

type PatientProfileResponse = {
  patient: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    city: string;
    postalCode?: string;
    country?: string;
    profileImage: string;
  };
  health: {
    bloodType: string;
    allergies: string;
    medications: string;
    medicalHistory: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
  };
};

const DRAFT_STORAGE_KEY = 'patient-profile-draft';

const defaultFormData: Patient = {
  id: '',
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: 'other',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  bloodType: '',
  allergies: '',
  medications: '',
  medicalHistory: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  profileImage: '/images/user.png',
  lastUpdated: new Date().toISOString().split('T')[0],
};

function mapProfileToForm(profile: PatientProfileResponse | null): Patient {
  if (!profile) {
    return defaultFormData;
  }

  return {
    ...defaultFormData,
    name: profile.patient.fullName || '',
    email: profile.patient.email || '',
    phone: profile.patient.phone || '',
    dateOfBirth: profile.patient.dateOfBirth || '',
    gender: (profile.patient.gender as Patient['gender']) || 'other',
    address: profile.patient.address || '',
    city: profile.patient.city || '',
    postalCode: profile.patient.postalCode || '',
    country: profile.patient.country || '',
    bloodType: profile.health.bloodType || '',
    allergies: profile.health.allergies || '',
    medications: profile.health.medications || '',
    medicalHistory: profile.health.medicalHistory || '',
    emergencyContactName: profile.emergencyContact.name || '',
    emergencyContactPhone: profile.emergencyContact.phone || '',
    emergencyContactRelation: profile.emergencyContact.relation || '',
    insuranceProvider: profile.insurance.provider || '',
    insurancePolicyNumber: profile.insurance.policyNumber || '',
  };
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function FieldCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm shadow-emerald-100/20 backdrop-blur-sm">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function UserEditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfileResponse | null>(null);
  const [formData, setFormData] = useState<Patient>(defaultFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/patient/profile', {
          method: 'GET',
          cache: 'no-store',
        });

        if (response.status === 401) {
          handlePatientSessionExpired(router);
          return;
        }

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          throw new Error(errorPayload?.error || 'Failed to load profile details');
        }

        const data: PatientProfileResponse = await response.json();
        setProfile(data);

        const draftRaw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (draftRaw) {
          const draft = JSON.parse(draftRaw) as Patient;
          setFormData({
            ...mapProfileToForm(data),
            ...draft,
          });
        } else {
          setFormData(mapProfileToForm(data));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile details');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const profileImage = useMemo(() => {
    return formData.profileImage?.trim() ? formData.profileImage : '/images/user.png';
  }, [formData.profileImage]);

  const initials = useMemo(() => {
    const parts = formData.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'P';
    }
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
  }, [formData.name]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((previous) => ({
        ...previous,
        profileImage: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmitProfile();
  };

  const handleSubmitProfile = async () => {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/patient/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          bloodType: formData.bloodType,
          allergies: formData.allergies,
          medications: formData.medications,
          medicalHistory: formData.medicalHistory,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          emergencyContactRelation: formData.emergencyContactRelation,
          insuranceProvider: formData.insuranceProvider,
          insurancePolicyNumber: formData.insurancePolicyNumber,
        }),
      });

      if (response.status === 401) {
        handlePatientSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Could not save your profile changes.');
      }

      const updatedProfile = payload as PatientProfileResponse;
      const nextFormData = {
        ...mapProfileToForm(updatedProfile),
        profileImage: formData.profileImage,
      };

      setProfile(updatedProfile);
      setFormData(nextFormData);
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      window.localStorage.removeItem('patient-profile-draft-saved-at');
      setNotice('Your profile has been updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraftOnly = () => {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      window.localStorage.setItem('patient-profile-draft-saved-at', new Date().toISOString());
      setNotice('Your changes were saved as a draft on this device.');
    } catch {
      setError('Could not save the draft in this browser.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setNotice('');
    setError('');

    if (profile) {
      setFormData(mapProfileToForm(profile));
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.14),_transparent_24%),linear-gradient(180deg,#eefbf6_0%,#f7fcfa_45%,#ffffff_100%)] pb-10">
      <div className="absolute inset-0 bg-[url('/images/user-registration-bg.jpg')] bg-cover bg-center bg-no-repeat opacity-[0.08]" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/82 to-white/95" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-100/50 to-transparent" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" />
      <div className="absolute right-0 top-36 h-80 w-80 rounded-full bg-teal-200/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <div className="relative mb-8 overflow-hidden rounded-[2.5rem] border border-emerald-200/40 bg-[url('/images/user-registration-bg.jpg')] bg-cover bg-center bg-no-repeat shadow-[0_20px_60px_rgba(16,185,129,0.15)]">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 via-emerald-500/85 to-teal-600/85 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-emerald-900/10" />
          <div className="relative px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-white backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-white" />
              PATIENT PROFILE EDITOR
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-5xl">
              Update your profile with confidence
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/95 sm:text-lg">
              Keep your contact, health, and emergency details organized in a calm, easy-to-scan editor.
            </p>
          </div>
        </div>

        <div className="mb-6 flex justify-end">
          <BlackButton className="rounded-full px-6 py-3" onClick={() => router.push('/user-self/profile')}>
            Back to Profile
          </BlackButton>
        </div>

        <form onSubmit={handleSaveDraft} className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/88 shadow-[0_24px_70px_rgba(16,185,129,0.12)] backdrop-blur">
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  Secure draft workspace
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  {loading ? 'Syncing profile data' : 'Ready to edit'}
                </span>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                  Local changes only
                </span>
              </div>

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-[1.75rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-1 shadow-xl shadow-emerald-200/40">
                    <div className="relative overflow-hidden rounded-[1.5rem] bg-white p-1">
                      <Image
                        src={profileImage}
                        alt="Patient profile preview"
                        width={120}
                        height={120}
                        className="h-[120px] w-[120px] rounded-[1.25rem] object-cover"
                      />
                      {!profileImage.startsWith('data:') && !profileImage.trim() && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-[1.25rem] bg-emerald-600 text-3xl font-bold text-white">
                          {initials}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Profile photo</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">{formData.name || 'Your name'}</h2>
                    <p className="mt-1 text-sm text-slate-600">{formData.email || 'email@example.com'}</p>
                    <p className="mt-1 text-xs text-slate-500">A simple, calm place to update personal details.</p>
                  </div>
                </div>

                <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
                  Change photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              {loading ? (
                <div className="mt-7 rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-sm text-slate-600">
                  Loading your current profile details...
                </div>
              ) : (
                <>
                  {error ? <p className="mt-6 text-sm font-medium text-rose-600">{error}</p> : null}
                  {notice ? <p className="mt-6 text-sm font-medium text-emerald-700">{notice}</p> : null}

                  <div className="mt-7 space-y-7">
                    <section>
                      <SectionHeader
                        title="Personal details"
                        description="These are the basics used across your patient dashboard and appointments."
                      />

                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FieldCard label="Full name">
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="Enter your full name"
                          />
                        </FieldCard>

                        <FieldCard label="Email address">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="you@example.com"
                          />
                        </FieldCard>

                        <FieldCard label="Phone number">
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="+1 555 123 4567"
                          />
                        </FieldCard>

                        <FieldCard label="Date of birth">
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none focus:ring-0"
                          />
                        </FieldCard>

                        <FieldCard label="Gender">
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none focus:ring-0"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </FieldCard>

                        <FieldCard label="Blood type">
                          <input
                            type="text"
                            name="bloodType"
                            value={formData.bloodType}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="O+, A-, etc."
                          />
                        </FieldCard>
                      </div>
                    </section>

                    <section>
                      <SectionHeader
                        title="Address information"
                        description="Add the details that help care teams keep records accurate and up to date."
                      />

                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FieldCard label="Street address">
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="123 Main Street"
                          />
                        </FieldCard>

                        <FieldCard label="City">
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="Colombo"
                          />
                        </FieldCard>

                        <FieldCard label="Postal code">
                          <input
                            type="text"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="10001"
                          />
                        </FieldCard>

                        <FieldCard label="Country">
                          <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="Sri Lanka"
                          />
                        </FieldCard>
                      </div>
                    </section>

                    <section>
                      <SectionHeader
                        title="Health notes"
                        description="Keep the essentials visible for faster visits and clearer care handoffs."
                      />

                      <div className="mt-5 space-y-4">
                        <FieldCard label="Allergies">
                          <textarea
                            name="allergies"
                            value={formData.allergies}
                            onChange={handleChange}
                            rows={3}
                            className="w-full resize-none border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="List any known allergies"
                          />
                        </FieldCard>

                        <FieldCard label="Current medications">
                          <textarea
                            name="medications"
                            value={formData.medications}
                            onChange={handleChange}
                            rows={3}
                            className="w-full resize-none border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="List current medications"
                          />
                        </FieldCard>

                        <FieldCard label="Medical history">
                          <textarea
                            name="medicalHistory"
                            value={formData.medicalHistory}
                            onChange={handleChange}
                            rows={3}
                            className="w-full resize-none border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="Share anything clinically important"
                          />
                        </FieldCard>
                      </div>
                    </section>

                    <section>
                      <SectionHeader
                        title="Emergency contact"
                        description="A quick backup contact helps the care team respond faster when needed."
                      />

                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FieldCard label="Contact name">
                          <input
                            type="text"
                            name="emergencyContactName"
                            value={formData.emergencyContactName}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="Jane Doe"
                          />
                        </FieldCard>

                        <FieldCard label="Contact phone">
                          <input
                            type="tel"
                            name="emergencyContactPhone"
                            value={formData.emergencyContactPhone}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="+1 555 123 4568"
                          />
                        </FieldCard>

                        <FieldCard label="Relation">
                          <input
                            type="text"
                            name="emergencyContactRelation"
                            value={formData.emergencyContactRelation}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="Spouse, sibling, parent"
                          />
                        </FieldCard>
                      </div>
                    </section>

                    <section>
                      <SectionHeader
                        title="Insurance"
                        description="Keep coverage details current so your records stay ready for appointments."
                      />

                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FieldCard label="Insurance provider">
                          <input
                            type="text"
                            name="insuranceProvider"
                            value={formData.insuranceProvider}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="Blue Cross"
                          />
                        </FieldCard>

                        <FieldCard label="Policy number">
                          <input
                            type="text"
                            name="insurancePolicyNumber"
                            value={formData.insurancePolicyNumber}
                            onChange={handleChange}
                            className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            placeholder="BC123456789"
                          />
                        </FieldCard>
                      </div>
                    </section>

                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="max-w-xl text-sm text-slate-600">
                        Profile details sync to your account. Your uploaded photo preview still stays on this device for now.
                      </p>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <BlackButton type="button" className="w-full rounded-full px-6 py-3 sm:w-auto" onClick={handleSaveDraftOnly}>
                          Save Draft
                        </BlackButton>
                        <BlackButton type="button" className="w-full rounded-full px-6 py-3 sm:w-auto" onClick={handleReset}>
                          Reset
                        </BlackButton>
                        <GreenButton type="submit" className="w-full rounded-full px-6 py-3 sm:w-auto" disabled={saving}>
                          {saving ? 'Saving...' : 'Save Changes'}
                        </GreenButton>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            {/* <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/85 shadow-[0_18px_50px_rgba(16,185,129,0.12)] backdrop-blur-sm">
              <div className="bg-[url('/images/user-registration-bg.jpg')] bg-cover bg-center bg-no-repeat p-6">
                <div className="rounded-[1.5rem] border border-white/70 bg-white/78 p-5 text-slate-900 shadow-lg backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Helpful summary</p>
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-sm text-slate-600">Profile completeness</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">Comfortably editable</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Current name</p>
                      <p className="mt-1 break-words text-lg font-semibold text-slate-900">{formData.name || 'Not set yet'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Current email</p>
                      <p className="mt-1 break-words text-lg font-semibold text-slate-900">{formData.email || 'Not set yet'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}

            <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-lg shadow-emerald-100/40">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">How this works</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>1. Review and update your details in a calm, grouped layout.</li>
                <li>2. Upload a new profile image if you want the dashboard to feel more personal.</li>
                <li>3. Save a draft on this device while the profile sync endpoint is unavailable.</li>
              </ul>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-lg shadow-emerald-100/40">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Quick preview</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Name</p>
                  <p className="mt-1 break-words text-base font-semibold text-slate-900">{formData.name || 'Your full name'}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Blood type</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{formData.bloodType || 'Not specified'}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Emergency contact</p>
                  <p className="mt-1 break-words text-base font-semibold text-slate-900">
                    {formData.emergencyContactName || 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
