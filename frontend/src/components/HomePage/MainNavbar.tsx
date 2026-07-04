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
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/50 dark:border-white/10 dark:bg-slate-950/50 backdrop-blur-md shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center justify-between w-full mr-8">
                        <Link
                            href={logoHref}
                            onClick={closeMobileMenu}
                            className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-between shrink-0"
                        >
                            <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8 mr-4" />
                            NexClinic
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:flex items-center gap-1 text-xs font-medium">
                            <Link
                                href="/#"
                                onClick={closeMobileMenu}
                                className="relative px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-all duration-200"
                            >
                                Home
                            </Link>
                            <Link
                                href="/#features"
                                onClick={closeMobileMenu}
                                className="relative px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-all duration-200"
                            >
                                Features
                            </Link>
                            <Link
                                href="/#services"
                                onClick={closeMobileMenu}
                                className="relative px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-all duration-200"
                            >
                                Services
                            </Link>
                            <Link
                                href="/#about"
                                onClick={closeMobileMenu}
                                className="relative px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-all duration-200"
                            >
                                About
                            </Link>
                            <Link
                                href="/#faq"
                                onClick={closeMobileMenu}
                                className="relative px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-all duration-200"
                            >
                                FAQ
                            </Link>
                            <Link
                                href="/#help"
                                onClick={closeMobileMenu}
                                className="relative px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-all duration-200"
                            >
                                Help
                            </Link>
                            <Link
                                href="/#contact"
                                onClick={closeMobileMenu}
                                className="relative px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-all duration-200"
                            >
                                Contact
                            </Link>
                            <Link
                                href="/news-articles"
                                onClick={closeMobileMenu}
                                className="relative px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-all duration-200 font-semibold text-green-600 dark:text-green-400"
                            >
                                News
                            </Link>
                        </div>
                    </div>

                    {/* Desktop Right Panel */}
                    <div className="hidden md:flex items-center gap-4 shrink-0">
                        <GreenButton>
                            <Link href="/login" onClick={closeMobileMenu}>Login</Link>
                        </GreenButton>
                        <BlackButton>
                            <Link href="/register" onClick={closeMobileMenu}>Sign up</Link>
                        </BlackButton>
                    </div>

                    {/* Mobile Hamburger button */}
                    <div className="flex md:hidden">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white focus:outline-none transition-colors"
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            aria-label="Toggle menu"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="space-y-1 px-4 py-3">
                        <Link
                            href="/#"
                            onClick={closeMobileMenu}
                            className="block px-4 py-2 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                        >
                            Home
                        </Link>
                        <Link
                            href="/#features"
                            onClick={closeMobileMenu}
                            className="block px-4 py-2 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                        >
                            Features
                        </Link>
                        <Link
                            href="/#services"
                            onClick={closeMobileMenu}
                            className="block px-4 py-2 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                        >
                            Services
                        </Link>
                        <Link
                            href="/#about"
                            onClick={closeMobileMenu}
                            className="block px-4 py-2 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                        >
                            About
                        </Link>
                        <Link
                            href="/#faq"
                            onClick={closeMobileMenu}
                            className="block px-4 py-2 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                        >
                            FAQ
                        </Link>
                        <Link
                            href="/#help"
                            onClick={closeMobileMenu}
                            className="block px-4 py-2 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                        >
                            Help
                        </Link>
                        <Link
                            href="/#contact"
                            onClick={closeMobileMenu}
                            className="block px-4 py-2 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                        >
                            Contact
                        </Link>
                        <Link
                            href="/news-articles"
                            onClick={closeMobileMenu}
                            className="block px-4 py-2 rounded-xl text-base font-semibold text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-white/10 transition-colors"
                        >
                            News
                        </Link>
                        <div className="pt-2 grid grid-cols-2 gap-2">
                            <GreenButton className="w-full">
                                <Link href="/login" onClick={closeMobileMenu} className="block w-full text-center">Login</Link>
                            </GreenButton>
                            <BlackButton className="w-full">
                                <Link href="/register" onClick={closeMobileMenu} className="block w-full text-center">Sign up</Link>
                            </BlackButton>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default MainNavbar;