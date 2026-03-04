"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BlackButton from "../buttons/BlackButton";


function DoctorNavBar() {
    const pathname = usePathname();
    
    const isActive = (href: string) => pathname === href;

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (error) {
            console.error("Logout API error:", error);
        }

        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userInfo");

        document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
        document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
    };
    
    return (
        <div className="flex flex-wrap items-center justify-between w-full py-4 px-6 shadow-md bg-white dark:bg-gray-800">
            <Link href="/doctor-self/dashboard" className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-between">
                <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8 mr-4" />
                NexClinic
            </Link>
            <div
                title="links-buttons"
                className="flex flex-wrap items-center gap-6 justify-between w-full md:w-auto mt-4 md:mt-0"
            >
                <div
                    title="navigation-links"
                    className="flex flex-1 justify-center md:flex-none md:justify-start text-[16px] gap-5"
                >
                    <Link 
                        href="/doctor-self/dashboard" 
                        className={`${isActive('/doctor-self/dashboard') ? 'text-green-600 dark:text-green-400 font-bold underline underline-offset-2' : 'text-gray-800 dark:text-white hover:underline underline-offset-2'}`}
                    >
                        Dashboard
                    </Link>
                    <Link 
                        href="/doctor-self/appointments" 
                        className={`${isActive('/doctor-self/appointments') ? 'text-green-600 dark:text-green-400 font-bold underline underline-offset-2' : 'text-gray-800 dark:text-white hover:underline underline-offset-2'}`}
                    >
                        Appointments
                    </Link>
                    <Link 
                        href="/doctor-self/chats" 
                        className={`${isActive('/doctor-self/chats') ? 'text-green-600 dark:text-green-400 font-bold underline underline-offset-2' : 'text-gray-800 dark:text-white hover:underline underline-offset-2'}`}
                    >
                        Chats
                    </Link>
                    <Link 
                        href="/doctor-self/profile" 
                        className={`${isActive('/doctor-self/profile') ? 'text-green-600 dark:text-green-400 font-bold underline underline-offset-2' : 'text-gray-800 dark:text-white hover:underline underline-offset-2'}`}
                    >
                        My Profile
                    </Link>
                </div>
                <div
                    title="log-sign-buttons"
                    className="flex flex-1 justify-end md:flex-none gap-3"
                >
                    <BlackButton>
                        <Link href="doctor/login" onClick={handleLogout}>Logout</Link>
                    </BlackButton>
                </div>
            </div>
        </div>
    );
}

export default DoctorNavBar;