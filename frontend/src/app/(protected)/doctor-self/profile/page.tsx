"use client";

import { useState } from "react";
import GreenButton from "@/components/buttons/GreenButton";
import DoctorNavBar from "@/components/doctor/DoctorNavBar";
import ToggleSwitch from "@/components/buttons/ToggleSwitch";

function DoctorProfilePage() {

    const [isOn, setIsOn] = useState(false);

    return (
        <div className="bg-gray-100 dark:bg-gray-900 justify-center gap-4 min-h-screen">
            <DoctorNavBar />

            <div title="profile-header-card" className="flex flex-col lg:flex-row lg:flex-wrap items-center justify-between gap-4 lg:gap-8 mx-4 mt-4 sm:mt-8 bg-white dark:bg-gray-800 p-4 sm:p-8 lg:p-16 rounded-lg shadow-md">
                <div title="left-column" className="flex flex-col sm:flex-row gap-4 items-center sm:pl-8 justify-center">
                    <img src="https://img.freepik.com/free-photo/portrait-smiling-male-doctor-with-stethoscope_171337-1532.jpg" alt="Doctor Profile" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover" />
                    <div title="name-spec-place" className="flex flex-col gap-2 text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold dark:text-white">Dr. John Doe</h1>
                        <div className="flex gap-2">
                            <div title="specialization" className="flex items-center rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-green-600 dark:text-green-300 font-semibold text-sm sm:text-md w-max mt-1 mx-auto sm:mx-0">Cardiologist</div>
                            <div title="experience" className="flex items-center rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-green-600 dark:text-green-300 font-semibold text-sm sm:text-md w-max mt-1 mx-auto sm:mx-0">12 years of experience</div>
                        </div>
                        <p title="location" className="text-gray-600 dark:text-gray-400 mt-1">
                            <img src="/images/location.png" className="w-4 h-4 inline mr-2" alt="Location Icon" />
                            New York, USA
                        </p>
                    </div>
                </div>
                <div title="right-column" className="flex flex-col gap-4 justify-center w-full lg:w-auto sm:pr-8">
                    <div title="toggle-btn" className="flex flex-col sm:flex-row gap-4 sm:gap-6 pb-2 items-center">
                        <div title="text-column" className="text-center sm:text-left">
                            <p className="text-black dark:text-white font-bold text-lg sm:text-xl">Availability for Online Advice</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm font-bold">
                                {isOn ? "Available" : "Unavailable"}
                            </p>
                        </div>
                        <div title="toggle-switch" className="justify-center">
                            <ToggleSwitch isOn={isOn} onToggle={setIsOn} />
                        </div>

                    </div>
                    <div className="flex justify-center sm:justify-end">
                        <GreenButton className="px-6 py-2 rounded-lg w-full sm:w-auto">
                            Edit Profile
                        </GreenButton>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-4 mx-4 mt-4">
                <h2 className="text-2xl font-bold mb-4 text-green-500 dark:text-green-400">Consultation Fees</h2>
                <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                            <img src="/images/chat.png" className="w-4 h-4 inline mr-2" alt="Chat Icon" />
                            Online Chat Session:
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">Rs. 500</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quick online advice for minor concerns</p>
                    </div>
                    <div className="flex flex-col">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                            <img src="/images/appointment.png" className="w-4 h-4 inline mr-2" alt="Appointment Icon" />
                            In-Person Appointment:
                        </p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">Rs. 3,000</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Full consultation and examination</p>
                    </div>
                </div>
                <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                        <span className="font-semibold">Usually available times for Online Advice:</span>
                        <ul className="flex flex-col list-disc pl-6 gap-2 mt-2">
                            <li>Monday, 2:00 PM - 5:00 PM</li>
                            <li>Tuesday, 10:00 AM - 1:00 PM</li>
                            <li>Thursday, 3:00 PM - 6:00 PM</li>
                            <li>Friday, 11:00 AM - 2:00 PM</li>
                        </ul>
                    </p>
                </div>
            </div>



            <div title="profile-content-section" className="flex flex-col lg:flex-row mx-4 my-6 gap-4">

                <div title="professional-details" className="w-full lg:w-1/2 bg-white dark:bg-gray-800 p-4 sm:p-8 rounded-lg shadow-md">
                    <div title="Title">
                        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-green-500 dark:text-green-400">Professional Details</h2>
                    </div>

                    <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

                    <div title="SLMC-reg-ID" className="flex flex-col sm:flex-row my-2 items-start sm:items-center justify-between gap-2 sm:gap-4">
                        <div className="text-gray-600 dark:text-gray-400">
                            <span className="font-bold text-gray-800 dark:text-gray-200">SLMC Registration ID:</span>
                            123456
                        </div>
                        <div title="verification-status" className="flex items-center rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-green-600 dark:text-green-300 font-semibold text-sm sm:text-md w-max mt-1">
                            <img src="/images/verified.png" className="w-4 h-4 inline mr-2" alt="Verified Icon" />
                            {/* <img src="/images/not-verified.png" className="w-4 h-4 inline mr-2" alt="Not Verified Icon" /> */}
                            Verified
                        </div>

                    </div>

                    <div title="Qualifications" className="flex flex-col my-2 text-gray-600 dark:text-gray-400">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Qualifications:</p>
                        <ul className="flex flex-col list-disc pl-6 gap-2">
                            <li>MBBS</li>
                            <li>MD (Cardiology)</li>
                            <li>PhD in Medical Research</li>
                        </ul>
                    </div>


                    <div title="Currently-Practicing-Hospitals" className="flex flex-col my-2 text-gray-600 dark:text-gray-400">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Currently Practicing Hospitals:</p>
                        <ul className="flex flex-col list-disc pl-6 gap-2">
                            <li>General Hospital Peradeniya</li>
                            <li>City Medical Center</li>
                            <li>Asiri Hospital Kandy</li>
                        </ul>
                    </div>

                    <div title="Languages" className="flex flex-col my-2 text-gray-600 dark:text-gray-400">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Languages Spoken:</p>
                        <ul className="flex flex-col list-disc pl-6 gap-2">
                            <li>Sinhala</li>
                            <li>English</li>
                            <li>Tamil</li>
                        </ul>
                    </div>

                </div>

                <div title="personal-info" className="w-full lg:w-1/2 bg-white dark:bg-gray-800 p-4 sm:p-8 rounded-lg shadow-md lg:ml-4">
                    <div title="Title">
                        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-green-500 dark:text-green-400">Personal Information</h2>
                    </div>

                    <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

                    <div title="Email" className="flex flex-col mb-4 text-gray-600 dark:text-gray-400">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Email Address:</p>
                        <div className="flex items-center">
                            <img src="/images/at.png" className="w-4 h-4 inline mr-2" alt="Email Icon" />
                            <p>dr.john.doe@hospital.com</p>
                        </div>
                    </div>
                    <div title="Contact" className="flex flex-col mb-4 text-gray-600 dark:text-gray-400">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Contact Number:</p>
                        <div className="flex items-center">
                            <img src="/images/phone.png" className="w-4 h-4 inline mr-2" alt="Phone Icon" />
                            <p>+94 77 123 4567</p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default DoctorProfilePage;