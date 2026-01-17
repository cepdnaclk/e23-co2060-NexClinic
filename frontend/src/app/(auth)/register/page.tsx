"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


import UserRegistrationForm from '@/components/user/UserRegistrationForm';
import UserRegistrationNavBar from '@/components/user/UserRegistrationNavBar';


function UserRegistration() {
    return (
        <div className="relative flex flex-col w-screen h-screen">
            <div title="doctor-login-navbar" className="fixed w-full top-0 z-50">
                <UserRegistrationNavBar />
            </div>
            <div title="row-1" className="relative gap-6 mt-8 h-full w-screen">
                <img
                    className="absolute opacity-80 object-cover h-full w-full"
                    src="/images/user-registration-bg.jpg"
                    alt="background"
                />
                <div className="absolute w-full mt-[100px] flex flex-col items-center justify-center gap-6">
                    <h1 className="mb-[10px] text-3xl font-extrabold text-white dark:text-gray-700 text-shadow-2 text-center sm:text-center sm:text-5xl ">
                        Sign Up Here
                    </h1>
                    <div className="justify-center items-center">
                        <UserRegistrationForm />
                    </div>
                </div>
            </div>

        </div>
    );


}

export default UserRegistration;
