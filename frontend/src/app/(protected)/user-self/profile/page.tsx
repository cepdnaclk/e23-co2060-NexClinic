'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GreenButton from '@/components/buttons/GreenButton';
import { handlePatientSessionExpired } from '@/lib/patientSession';

type PatientProfileResponse = {
    patient: {
        fullName: string;
        email: string;
        phone: string;
        dateOfBirth: string;
        gender: string;
        address: string;
        city: string;
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

type DetailCardProps = {
    label: string;
    value: string;
    accentClassName?: string;
};

function DetailCard({ label, value, accentClassName = 'from-emerald-500 to-teal-500' }: DetailCardProps) {
    return (
        <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm shadow-emerald-100/40">
            <div className={`h-1.5 w-14 rounded-full bg-gradient-to-r ${accentClassName}`} />
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-2 break-words text-lg font-bold text-slate-900">{value}</p>
        </div>
    );
}

export default function UserProfile() {
    const router = useRouter();
    const [profileData, setProfileData] = useState<PatientProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
                setProfileData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load profile details');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [router]);

    const patientName = profileData?.patient.fullName || 'Patient';
    const patientEmail = profileData?.patient.email || 'Not available';
    const patientPhone = profileData?.patient.phone || 'Not available';
    const patientCity = profileData?.patient.city || 'Not specified';
    const patientAddress = profileData?.patient.address || 'Not specified';
    const patientGender = profileData?.patient.gender || 'Not specified';
    const patientDob = profileData?.patient.dateOfBirth || 'Not specified';
    const bloodType = profileData?.health.bloodType || 'Unknown';
    const allergies = profileData?.health.allergies || 'None reported';
    const medications = profileData?.health.medications || 'None reported';
    const medicalHistory = profileData?.health.medicalHistory || 'None reported';
    const emergencyContact = profileData?.emergencyContact.name || 'Not specified';
    const emergencyPhone = profileData?.emergencyContact.phone || 'Not specified';
    const emergencyRelation = profileData?.emergencyContact.relation || 'Not specified';
    const insuranceProvider = profileData?.insurance.provider || 'Not provided';
    const insurancePolicy = profileData?.insurance.policyNumber || 'Not provided';
    const profileImage = profileData?.patient.profileImage?.trim() ? profileData.patient.profileImage : '/images/user.png';

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.14),_transparent_24%),linear-gradient(180deg,#eefbf6_0%,#f8fcfb_45%,#ffffff_100%)] pb-6">
            <div
                className="absolute inset-0 bg-[url('/images/user-login-bg.png')] bg-cover bg-center bg-no-repeat opacity-10"
                aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/78 to-white/92" aria-hidden="true" />
            <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-100/40 to-transparent" />
            <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-teal-200/25 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Patient Profile</p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Personal care overview</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                            A clean snapshot of your profile, health history and emergency details in one place.
                        </p>
                    </div>
                    <GreenButton className="w-full rounded-full px-6 py-3 sm:w-auto" onClick={() => router.push('/user-self/edit-profile')}>
                        Edit Profile
                    </GreenButton>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
                    <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_20px_60px_rgba(16,185,129,0.12)] backdrop-blur">
                        <div className="relative p-5 sm:p-6 lg:p-8">
                            <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-100/60 blur-3xl" />
                            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
                                <div className="mx-auto shrink-0 rounded-[2rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-1 shadow-xl shadow-emerald-200/50 lg:mx-0">
                                    <div className="rounded-[1.75rem] bg-white p-2">
                                        <Image
                                            src={profileImage}
                                            alt="Patient profile photo"
                                            width={136}
                                            height={136}
                                            className="h-[136px] w-[136px] rounded-[1.5rem] object-cover"
                                            priority
                                        />
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1 text-center lg:text-left">
                                    <h2 className="mt-4 break-words text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                        {patientName}
                                    </h2>
                                    <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{patientEmail}</p>
                                    <p className="mt-1 text-sm leading-6 text-slate-600 sm:text-base">{patientCity}</p>

                                    {loading && <p className="mt-3 text-sm font-medium text-emerald-700">Loading profile details...</p>}
                                    {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        <DetailCard label="Blood Type" value={bloodType} />
                                        <DetailCard label="Phone" value={patientPhone} accentClassName="from-teal-500 to-cyan-500" />
                                        <DetailCard label="City" value={patientCity} accentClassName="from-sky-500 to-blue-500" />
                                        <DetailCard label="Gender" value={patientGender} accentClassName="from-emerald-500 to-lime-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <div className="rounded-[2rem] border border-slate-900/5 bg-slate-950 p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-200">At a glance</p>
                            <div className="mt-5 space-y-4">
                                <div>
                                    <p className="text-sm text-slate-300">Date of birth</p>
                                    <p className="mt-1 text-lg font-semibold">{patientDob}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-300">Address</p>
                                    <p className="mt-1 text-lg font-semibold leading-7">{patientAddress}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-lg shadow-emerald-100/40">
                            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">Emergency Contact</p>
                            <p className="mt-4 break-words text-2xl font-bold text-slate-900">{emergencyContact}</p>
                            <p className="mt-2 text-sm text-slate-600">{emergencyRelation}</p>
                            <p className="mt-1 text-sm text-slate-600">{emergencyPhone}</p>
                        </div>

                        <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-lg shadow-emerald-100/40">
                            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">Insurance</p>
                            <p className="mt-4 text-lg font-bold text-slate-900">{insuranceProvider}</p>
                            <p className="mt-2 text-sm text-slate-600">Policy {insurancePolicy}</p>
                        </div>
                    </aside>
                </div>

                <section className="mt-5 rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-7">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">Health Snapshot</h3>
                            <p className="mt-1 text-sm text-slate-600">The key health notes you want in sight during visits or follow-up calls.</p>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-white p-5 ring-1 ring-emerald-100">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Allergies</p>
                            <p className="mt-3 text-base leading-7 text-slate-700">{allergies}</p>
                        </div>
                        <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-white p-5 ring-1 ring-teal-100">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Current Medications</p>
                            <p className="mt-3 text-base leading-7 text-slate-700">{medications}</p>
                        </div>
                        <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-white p-5 ring-1 ring-sky-100">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Medical History</p>
                            <p className="mt-3 text-base leading-7 text-slate-700">{medicalHistory}</p>
                        </div>
                    </div>
                </section>

                <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-7">
                        <h3 className="text-2xl font-bold text-slate-900">Personal Information</h3>
                        <p className="mt-2 text-sm text-slate-600">Basic contact and location details used across the dashboard.</p>
                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <DetailCard label="Phone" value={patientPhone} />
                            <DetailCard label="Email" value={patientEmail} accentClassName="from-teal-500 to-cyan-500" />
                            <DetailCard label="City" value={patientCity} accentClassName="from-sky-500 to-blue-500" />
                            <DetailCard label="Date of Birth" value={patientDob} accentClassName="from-emerald-500 to-lime-500" />
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-7">
                        <h3 className="text-2xl font-bold text-slate-900">Emergency & Insurance</h3>
                        <p className="mt-2 text-sm text-slate-600">Backup contact and coverage details for quicker assistance.</p>
                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <DetailCard label="Emergency Contact" value={emergencyContact} />
                            <DetailCard label="Relation" value={emergencyRelation} accentClassName="from-teal-500 to-cyan-500" />
                            <DetailCard label="Emergency Phone" value={emergencyPhone} accentClassName="from-sky-500 to-blue-500" />
                            <DetailCard label="Policy Number" value={insurancePolicy} accentClassName="from-emerald-500 to-lime-500" />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}