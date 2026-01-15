"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserLoginNavbar from '../../../components/user/UserLoginNavBar';
import UserLoginForm from '../../../components/user/UserLoginForm';

function UserLogin() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-100 w-screen">
            <div title="user-login-navbar" className="fixed w-full top-0 z-50">
                <UserLoginNavbar/>
            </div>
            <div title="home-row-1" className="bg-gray-200 h-[700px] gap-6 mt-[70px]">
                <img
                    className="relative h-screen w-screen opacity-80 h-[700px] w-screen object-cover"
                    src="/images/user-login-bg.png"
                    alt="background"
                />
                <h1 className="absolute w-2/3 text-3xl font-extrabold text-white dark:text-gray-900 text-shadow-2 text-center sm:text-center sm:text-5xl top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    Login Here
                </h1>
                <div className="absolute w-full flex justify-center items-center top-2/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <UserLoginForm/>
                </div>
            </div>
            
        </div>
    );


}

export default UserLogin;
