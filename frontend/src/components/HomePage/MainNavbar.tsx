"use client";

import Link from "next/link";
import { useState } from "react";
import GreenButton from "../buttons/GreenButton";
import BlackButton from "../buttons/BlackButton";

function MainNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const logoHref = "/";

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        // <div className="flex flex-wrap w-full py-4 px-4 sm:px-6 shadow-md bg-white dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between w-full py-4 px-6 shadow-md bg-white dark:bg-gray-800">
        
            <div className="flex items-center justify-between">
                <Link href={logoHref} onClick={closeMobileMenu} className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-between">
                    <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8 mr-4" />
                    NexClinic
                </Link>

                <button
                    type="button"
                    className="md:hidden inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-800 dark:text-white"
                    onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                    aria-label="Toggle navigation menu"
                    aria-expanded={isMobileMenuOpen}
                >
                    <span className="text-lg">{isMobileMenuOpen ? "x" : "☰"}</span>
                </button>
            </div>

            <div title="links-buttons-desktop" className="hidden md:flex items-center justify-between mt-4 gap-6">
                <div title="navigation-links" className="flex text-[16px] gap-3 text-gray-800 dark:text-white">
                    <Link href="/news-articles" onClick={closeMobileMenu} className="hover:underline underline-offset-2">News & Articles</Link>
                    <Link href="/help" onClick={closeMobileMenu} className="hover:underline underline-offset-2">Help</Link>
                </div>
                <div title="log-sign-buttons" className="flex gap-2">
                    <GreenButton>
                        <Link href="/login" onClick={closeMobileMenu}>Login</Link>
                    </GreenButton>
                    <BlackButton>
                        <Link href="/register" onClick={closeMobileMenu}>Sign up</Link>
                    </BlackButton>
                </div>
            </div>

            <div
                title="links-buttons-mobile"
                className={`${isMobileMenuOpen ? "flex" : "hidden"} md:hidden flex-col gap-3 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4`}
            >
                <div title="navigation-links-mobile" className="flex flex-col gap-2 text-gray-800 dark:text-white">
                    <Link href="/news-articles" onClick={closeMobileMenu} className="hover:underline underline-offset-2">News & Articles</Link>
                    <Link href="/help" onClick={closeMobileMenu} className="hover:underline underline-offset-2">Help</Link>
                </div>
                <div title="log-sign-buttons-mobile" className="grid grid-cols-2 gap-2">
                    <GreenButton className="w-full">
                        <Link href="/login" onClick={closeMobileMenu} className="block w-full text-center">Login</Link>
                    </GreenButton>
                    <BlackButton className="w-full">
                        <Link href="/register" onClick={closeMobileMenu} className="block w-full text-center">Sign up</Link>
                    </BlackButton>
                </div>
            </div>
        </div>
    )
}

export default MainNavbar;