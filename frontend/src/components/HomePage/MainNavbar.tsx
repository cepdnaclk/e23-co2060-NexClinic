"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import GreenButton from "../buttons/GreenButton";
import BlackButton from "../buttons/BlackButton";

function MainNavbar() {
    const [logoHref, setLogoHref] = useState("/");

    useEffect(() => {
        const role = localStorage.getItem("userRole");
        if (role === "DOCTOR") {
            setLogoHref("/doctor-self/dashboard");
            return;
        }
        if (role === "PATIENT") {
            setLogoHref("/user-self/dashboard");
            return;
        }
        setLogoHref("/");
    }, []);

    return (
        <div className="flex flex-wrap items-center justify-between w-full py-4 px-4 shadow-md bg-white dark:bg-gray-800">
            <Link href={logoHref} className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-between">
                <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8 mr-4" />
                NexClinic
            </Link>

            <div title="links-buttons" className="flex items-center justify-between gap-6 w-full md:w-auto mt-4 md:mt-0">
                <div title="navigation-links" className="flex text-[16px] gap-3">
                    {/* <Link href="/doctors" className="hover:underline underline-offset-2">Find Doctor</Link> */}
                    <Link href="/news-articles" className="hover:underline underline-offset-2">News & Articles</Link>
                    <Link href="/help" className="hover:underline underline-offset-2">Help</Link>
                </div>
                <div title="log-sign-buttons" className="flex flex-1 gap-2 justify-end">
                    <GreenButton>
                        {/* <Link href="../doctor-self/profile">Login</Link> */}
                        <Link href="/login">Login</Link>
                    </GreenButton>
                    <BlackButton>
                        <Link href="/register">Sign up</Link>
                    </BlackButton>
                </div>
            </div>
        </div>
    )
}

export default MainNavbar;