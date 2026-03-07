'use client';

import { useEffect, useState } from 'react';
import GreenButton from '@/components/buttons/GreenButton';

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

export default function UserProfile() {
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
        }, []);

        const patientName = profileData?.patient.fullName || 'Patient';
        const patientEmail = profileData?.patient.email || 'Not available';
        const patientPhone = profileData?.patient.phone || 'Not available';
        const patientCity = profileData?.patient.city || 'Not specified';
        const bloodType = profileData?.health.bloodType || 'Unknown';
        const allergies = profileData?.health.allergies || 'None reported';
        const medications = profileData?.health.medications || 'None reported';
        const medicalHistory = profileData?.health.medicalHistory || 'None reported';
        const emergencyContact = profileData?.emergencyContact.name || 'Not specified';
        const emergencyPhone = profileData?.emergencyContact.phone || 'Not specified';
        const emergencyRelation = profileData?.emergencyContact.relation || 'Not specified';
        const insuranceProvider = profileData?.insurance.provider || 'Not provided';
        const insurancePolicy = profileData?.insurance.policyNumber || 'Not provided';
        const profileImage = profileData?.patient.profileImage?.trim()
                ? profileData.patient.profileImage
                : '/images/user.png';

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen pb-8">
            <div className="mx-4 sm:mx-6 lg:mx-8 pt-4 sm:pt-6">

                <div className="flex flex-col lg:flex-row lg:flex-wrap items-center justify-between gap-4 lg:gap-8 bg-white dark:bg-gray-800 p-4 sm:p-8 lg:p-12 rounded-lg shadow-md">
                    <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start w-full lg:w-auto">
                        <img
                            src={profileImage}
                            alt="Patient Profile"
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover"
                        />
                        <div className="flex flex-col gap-2 text-center sm:text-left">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">{patientName}</h1>
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                <div className="flex items-center rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-green-600 dark:text-green-300 font-semibold text-sm w-max">
                                    Blood Type: {bloodType}
                                </div>
                                <div className="flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-blue-600 dark:text-blue-300 font-semibold text-sm w-max">
                                    Patient
                                </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">{patientEmail}</p>
                            <p className="text-gray-600 dark:text-gray-400">{patientCity}</p>
                            {loading && <p className="text-xs text-gray-500 mt-1">Loading profile...</p>}
                            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                        </div>
                    </div>

                    <div className="w-full lg:w-auto flex flex-col gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4 sm:p-5">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Emergency Contact</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{emergencyContact}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{emergencyRelation}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{emergencyPhone}</p>
                        </div>
                        <div className="flex justify-center lg:justify-end">
                            <GreenButton className="px-6 py-2 rounded-lg w-full sm:w-auto">
                                Edit Profile
                            </GreenButton>
                        </div>
                    </div>
                </div>

                <div className="mt-4 bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4 text-green-500 dark:text-green-400">Health Snapshot</h2>
                    <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-4">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Allergies</p>
                            <p className="text-gray-900 dark:text-gray-100 mt-2">{allergies}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-4">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Current Medications</p>
                            <p className="text-gray-900 dark:text-gray-100 mt-2">{medications}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-4">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Medical History</p>
                            <p className="text-gray-900 dark:text-gray-100 mt-2">{medicalHistory}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 mt-4">
                    <div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-lg shadow-md">
                        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-green-500 dark:text-green-400">Insurance Details</h2>
                        <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>
                        <div className="space-y-3 text-gray-700 dark:text-gray-200">
                            <p><span className="font-bold">Provider:</span> {insuranceProvider}</p>
                            <p><span className="font-bold">Policy Number:</span> {insurancePolicy}</p>
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-lg shadow-md">
                        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-green-500 dark:text-green-400">Personal Information</h2>
                        <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>
                        <div className="space-y-3 text-gray-700 dark:text-gray-200">
                            <p><span className="font-bold">Phone:</span> {patientPhone}</p>
                            <p><span className="font-bold">Email:</span> {patientEmail}</p>
                            <p><span className="font-bold">City:</span> {patientCity}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}