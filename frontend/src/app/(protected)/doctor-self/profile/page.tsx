"use client";

import { useState } from "react";
import GreenButton from "@/components/buttons/GreenButton";
import DoctorNavBar from "@/components/doctor/DoctorNavBar";
import ToggleSwitch from "@/components/buttons/ToggleSwitch";

function DoctorProfilePage() {

    const [isOn, setIsOn] = useState(false);

    return (
        <div className="bg-gray-100 justify-center">
            <DoctorNavBar />
            <div title="profile-header-card" className="flex flex-wrap items-center justify-between gap-8 mx-4 mt-8 bg-white p-16 rounded-lg shadow-md">
                <div title="left-column" className="flex flex-row gap-4 items-center pl-8 justify-center">
                    <img src="https://img.freepik.com/free-photo/portrait-smiling-male-doctor-with-stethoscope_171337-1532.jpg" alt="Doctor Profile" className="w-32 h-32 rounded-full object-cover" />
                    <div title="name-spec-place" className="flex flex-col gap-2">
                        <h1 className="text-4xl font-bold">Dr. John Doe</h1>
                        <div title="specialization" className="flex items-center rounded-full bg-green-100 px-3 py-1 text-green-600 font-semibold text-md w-max mt-1">Cardiologist</div>
                        <p title="location" className="text-gray-600 mt-1">
                            <img src="/images/location.png" className="w-4 h-4 inline mr-2" alt="Location Icon" />
                            New York, USA
                        </p>
                    </div>
                </div>
                <div title="right-column">
                    <div title="toggle-btn" className="flex gap-6 pb-2 pr-16">
                        <div title="text-column">
                            <p className="text-black font-bold text-xl">Available for Online Advice</p>
                            <p className="text-gray-400 text-sm font-bold">
                                {isOn ? "Online advice is currently available" : "Online advice is currently unavailable"}
                            </p>
                        </div>
                        <div title="toggle-switch" className="justify-center">
                            <ToggleSwitch isOn={isOn} onToggle={setIsOn}/>
                        </div>

                    </div>
                    <div className="flex justify-end mr-16 item-end">
                        <GreenButton className="px-6 py-2 rounded-lg">
                            Edit Profile
                        </GreenButton>
                    </div>
                </div>


            </div>

            <div title="profile-content-section">

                <div title="professional-details">

                </div>

                <div title="personal-info">

                </div>

            </div>
        </div>
    );
}

export default DoctorProfilePage;