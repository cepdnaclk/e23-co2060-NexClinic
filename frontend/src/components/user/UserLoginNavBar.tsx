
"use client";

import { useState } from "react";
import Link from "next/link";
import GreenButton from "../buttons/GreenButton";


function UserLoginNavBar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="w-full py-4 px-6 shadow-md bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between gap-4">
                <Link
                    href="/"
                    onClick={closeMobileMenu}
                    className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-between shrink-0"
                >
                    <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8 mr-4" />
                    NexClinic
                </Link>

                <button
                    type="button"
                    className="md:hidden inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-800 dark:text-white"
                    onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                    aria-label="Toggle navigation menu"
                    aria-expanded={isMobileMenuOpen}
                >
                    <span className="text-lg">{isMobileMenuOpen ? "X" : "☰"}</span>
                </button>

                <div
                    title="links-buttons-desktop"
                    className="hidden md:flex items-center gap-6"
                >
                    <div
                        title="navigation-links"
                        className="flex items-center gap-5 text-[16px] text-gray-800 dark:text-white"
                    >
                        <Link href="/news-articles" onClick={closeMobileMenu} className="hover:underline underline-offset-2">
                            News & Articles
                        </Link>
                        <Link href="/help" onClick={closeMobileMenu} className="hover:underline underline-offset-2">
                            Help
                        </Link>
                    </div>
                    <div
                        title="log-sign-buttons"
                        className="flex gap-3"
                    >
                        <GreenButton>
                            <Link href="/doctor/login" onClick={closeMobileMenu}>Are you a Doctor? Click here</Link>
                        </GreenButton>
                    </div>
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
                <div title="log-sign-buttons-mobile" className="flex gap-2">
                    <GreenButton className="flex-1">
                        <Link href="/doctor/login" onClick={closeMobileMenu} className="block w-full text-center">Are you a Doctor? Click here</Link>
                    </GreenButton>
                </div>
            </div>
        </div>
    );
}

export default UserLoginNavBar;