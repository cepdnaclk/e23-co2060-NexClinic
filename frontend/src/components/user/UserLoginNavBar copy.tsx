"use client";

import { useState } from "react";
import Link from "next/link";
import GreenButton from "../buttons/GreenButton";

function MainNavbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="w-full bg-white dark:bg-gray-800 shadow-md">
            <div className="mx-auto flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <div title="logo-brandname" className="flex items-center">
                    <img
                        src="/images/logo-main.png"
                        alt="NexClinic Logo"
                        className="h-8 w-8 mr-3"
                    />
                    <Link
                        href="/"
                        className="text-2xl font-bold text-gray-800 dark:text-white"
                    >
                        NexClinic
                    </Link>
                </div>

                {/* Desktop links */}
                <div className="hidden items-center gap-5 md:flex">
                    <div title="navigation-links" className="flex gap-4 text-[16px]">
                        <Link href="/doctors" className="hover:underline underline-offset-2">
                            Find Doctor
                        </Link>
                        <Link href="/news-articles" className="hover:underline underline-offset-2">
                            News &amp; Articles
                        </Link>
                        <Link href="/help" className="hover:underline underline-offset-2">
                            Help
                        </Link>
                    </div>
                    <div title="log-sign-buttons" className="flex gap-3">
                        <GreenButton>
                            <Link href="/doctor/login">I'm a Doctor</Link>
                        </GreenButton>
                    </div>
                </div>

                {/* Mobile menu button */}
                <button
                    className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:hidden"
                    aria-label="Toggle navigation menu"
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <span className="sr-only">Open main menu</span>
                    <div className="space-y-1">
                        <span
                            className={`block h-0.5 w-6 bg-gray-700 transition-transform duration-200 ${
                                isMenuOpen ? "translate-y-1.5 rotate-45" : ""
                            }`}
                        />
                        <span
                            className={`block h-0.5 w-6 bg-gray-700 transition-opacity duration-200 ${
                                isMenuOpen ? "opacity-0" : "opacity-100"
                            }`}
                        />
                        <span
                            className={`block h-0.5 w-6 bg-gray-700 transition-transform duration-200 ${
                                isMenuOpen ? "-translate-y-1.5 -rotate-45" : ""
                            }`}
                        />
                    </div>
                </button>
            </div>

            {/* Mobile menu panel */}
            {isMenuOpen && (
                <div className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 dark:border-gray-700 dark:bg-gray-800 md:hidden">
                    <div className="flex flex-col gap-3 text-[15px]">
                        <Link
                            href="/doctors"
                            className="py-1 hover:underline underline-offset-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Find Doctor
                        </Link>
                        <Link
                            href="/news-articles"
                            className="py-1 hover:underline underline-offset-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            News &amp; Articles
                        </Link>
                        <Link
                            href="/help"
                            className="py-1 hover:underline underline-offset-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Help
                        </Link>
                    </div>
                    <div className="mt-4 flex">
                        <GreenButton>
                            <Link href="/doctor/login" onClick={() => setIsMenuOpen(false)}>
                                I'm a Doctor
                            </Link>
                        </GreenButton>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default MainNavbar;