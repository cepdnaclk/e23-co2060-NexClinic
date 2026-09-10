"use client";

import { useEffect, useState } from "react";
import RoleBasedNavbar from "@/components/common/RoleBasedNavbar";
import Link from "next/link";

interface NewsArticle {
    id: number;
    url: string;
    title: string;
    summary: string;
    author: string;
    date: string;
    imageUrl: string;
    readTime: string;
}

interface NewsApiArticle {
    url: string;
    title: string;
    description: string;
    source: { name: string };
    publishedAt: string;
    image?: string;
}

const highlightCards = [
    {
        title: "Smart Appointment Booking",
        description: "Browse available appointment slots and choose a suitable time.",
        icon: (
            <svg className="h-6 w-6 text-green-600 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    {
        title: "Doctor Profiles",
        description: "Review the professional information available on registered doctor profiles.",
        icon: (
            <svg className="h-6 w-6 text-green-600 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
            </svg>
        ),
    },
    {
        title: "Secure Medical Experience",
        description: "Your health data stays protected with secure authentication and private sessions.",
        icon: (
            <svg className="h-6 w-6 text-green-600 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
        ),
    },
    {
        title: "Care Anywhere",
        description: "Access consultations from home, office, or on the move through NexClinic.",
        icon: (
            <svg className="h-6 w-6 text-green-600 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
        ),
    },
];

const API_KEY = '3ad27a1f2e6ec9457e36de238ce09fcf';

export default function Home() {
    const [trendingArticles, setTrendingArticles] = useState<NewsArticle[]>([]);
    const [loadingNews, setLoadingNews] = useState<boolean>(true);

    useEffect(() => {
        const fetchNews = async () => {
            setLoadingNews(true);
            try {
                const response = await fetch(`https://gnews.io/api/v4/top-headlines?category=health&lang=en&apikey=${API_KEY}`);
                const data = await response.json();
                if (data && data.articles) {
                    const formattedArticles = data.articles.slice(0, 3).map((article: NewsApiArticle, index: number) => ({
                        id: index,
                        url: article.url,
                        title: article.title,
                        summary: article.description,
                        author: article.source.name,
                        date: new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                        imageUrl: article.image || "/images/medical-ai.jpg",
                        readTime: "5 min read"
                    }));
                    setTrendingArticles(formattedArticles);
                }
            } catch (error) {
                console.error("Error fetching news:", error);
            } finally {
                setLoadingNews(false);
            }
        };
        fetchNews();
    }, []);

    return (
        <main className="relative min-h-screen w-full overflow-hidden bg-[#fffaf5] text-slate-900 scroll-smooth">
            {/* A quiet canvas keeps the photography and calls to action in focus. */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(14,116,144,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,116,144,0.055)_1px,transparent_1px)] bg-[size:42px_42px]" />
                <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_top_left,rgba(251,191,36,0.22),transparent_55%),radial-gradient(ellipse_at_top_right,rgba(45,212,191,0.22),transparent_52%)]" />
            </div>

            {/* Sticky Navigation bar container */}
            <header className="fixed top-0 left-0 z-50 w-full">
                <RoleBasedNavbar />
            </header>

            {/* HERO SECTION */}
            <section className="relative mt-16 overflow-hidden border-b border-orange-100/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.92),rgba(236,253,245,0.72)_55%,rgba(224,242,254,0.75))] pt-12 pb-12 lg:pt-20 lg:pb-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-12">
                        {/* Hero Left Content */}
                        <div className="flex flex-col justify-center text-left lg:col-span-7 lg:pt-16 xl:pt-20">
                            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 shadow-sm backdrop-blur-sm">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Care that keeps moving
                            </span>
                            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.04] tracking-[-0.03em] text-slate-950 sm:text-5xl md:text-6xl lg:text-[4rem] xl:text-[4.35rem]">
                                The next step in your <br className="hidden sm:block" />
                                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent">
                                    better health journey.
                                </span>
                            </h1>
                            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base md:text-lg">
                                Find the right specialist, book a convenient appointment, and keep every part of your care in one clear, connected place.
                            </p>
                            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
                                <Link
                                    id="hero-find-doctors"
                                    href="/doctors"
                                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-700/20 active:scale-[0.98]"
                                >
                                    Find Doctors Now
                                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </Link>
                                <Link
                                    id="hero-explore-news"
                                    href="/news-articles"
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.98]"
                                >
                                    Explore Health News
                                </Link>
                            </div>

                        </div>

                        {/* Hero Right Media Grid */}
                        <div className="relative mt-6 w-full lg:col-span-5 lg:mt-0">
                            {/* Background glow graphic decor */}
                            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-orange-200/50 via-emerald-200/50 to-sky-200/50 blur-2xl" />
                            <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] border border-white/80 shadow-2xl shadow-teal-950/15">
                                <img src="/images/main-bg.jpg" alt="A team of healthcare professionals" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
                                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Your care team</p>
                                        <p className="mt-1 text-lg font-bold">Connected around you</p>
                                    </div>
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl backdrop-blur-md">+</span>
                                </div>
                            </div>

                            <div className="relative z-10 grid gap-4 px-4 pb-4 pt-4 sm:gap-6 sm:px-6 sm:pb-6 sm:pt-6">
                                {/* Insights Panel */}
                                <div className="relative mt-32 overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-950/10 backdrop-blur-md transition-all duration-300 hover:shadow-xl sm:mt-40 sm:p-6">
                                    <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full" />
                                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-700">Appointments</p>
                                    <h3 className="mt-2 text-lg sm:text-xl font-bold text-slate-900">Find an available doctor and choose a suitable time</h3>
                                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">Browse doctor profiles and appointment slots provided through NexClinic.</p>
                                </div>

                                {/* Floating Graphics - Secondary Grid */}
                                <div className="grid gap-4 sm:gap-6 grid-cols-2">
                                    <div className="group overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-lg shadow-slate-100/50 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-green-200/50">
                                        <div className="relative h-28 sm:h-36 overflow-hidden">
                                            <img src="/images/HealthDoc.avif" alt="Online consultation" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                                            <span className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded bg-green-500 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
                                    Online Care
                                            </span>
                                        </div>
                                        <div className="p-3 sm:p-4">
                                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-green-600 transition-colors">Quick Consult</h4>
                                            <p className="mt-1 text-[10px] sm:text-xs leading-relaxed text-slate-500">Start secure doctor conversations without complex setup procedures.</p>
                                        </div>
                                    </div>
                                    <div className="group overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-lg shadow-slate-100/50 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-green-200/50">
                                        <div className="relative h-28 sm:h-36 overflow-hidden">
                                            <img src="/images/doc.jpg" alt="Appointment confirmation" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                                            <span className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded bg-green-600 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
                                                Automation
                                            </span>
                                        </div>
                                        <div className="p-3 sm:p-4">
                                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-green-600 transition-colors">Smart Reminders</h4>
                                            <p className="mt-1 text-[10px] sm:text-xs leading-relaxed text-slate-500">View appointment information and notifications from your account.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-sm sm:grid-cols-4">
                        <div className="bg-amber-50 px-4 py-4 sm:px-6"><p className="text-xl font-extrabold text-amber-900 sm:text-2xl">24/7</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 sm:text-xs">Care access</p></div>
                        <div className="bg-emerald-50 px-4 py-4 sm:px-6"><p className="text-xl font-extrabold text-emerald-900 sm:text-2xl">6+</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 sm:text-xs">Specialties</p></div>
                        <div className="bg-sky-50 px-4 py-4 sm:px-6"><p className="text-xl font-extrabold text-sky-900 sm:text-2xl">1 place</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-sky-700 sm:text-xs">For your care</p></div>
                        <div className="bg-orange-50 px-4 py-4 sm:px-6"><p className="text-xl font-extrabold text-orange-900 sm:text-2xl">Secure</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-orange-700 sm:text-xs">By design</p></div>
                    </div>
                </div>
            </section>

            {/* PATIENT AND DOCTOR PORTALS */}
            <section id="care-paths" className="border-b border-sky-100/80 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdfa_100%)] py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 sm:text-xs">
                            Built for every care journey
                        </span>
                        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                            Choose your NexClinic portal
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                            One connected platform, with focused tools for the people receiving care and the professionals providing it.
                        </p>
                    </div>

                    <div className="mt-10 grid gap-6 lg:grid-cols-2">
                        <section id="patient-portal" aria-labelledby="patient-portal-title" className="group relative overflow-hidden rounded-[1.5rem] border border-orange-200 bg-[linear-gradient(135deg,#fff7ed,#ecfdf5)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8">
                            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-200/60 blur-2xl" />
                            <div className="relative flex h-full flex-col">
                                <div className="flex items-start justify-between gap-4">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-xl text-white shadow-lg shadow-emerald-600/20">+</span>
                                    <span className="rounded-full border border-orange-200 bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-700">For patients</span>
                                </div>
                                <h3 id="patient-portal-title" className="mt-8 text-2xl font-extrabold text-slate-950 sm:text-3xl">Your care, in your hands.</h3>
                                <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
                                    Discover trusted doctors, compare available times, book appointments, and keep track of your health information.
                                </p>
                                <div className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                                    <p className="flex items-center gap-2"><span className="text-emerald-600">✓</span> Find the right specialist</p>
                                    <p className="flex items-center gap-2"><span className="text-emerald-600">✓</span> Book available slots</p>
                                    <p className="flex items-center gap-2"><span className="text-emerald-600">✓</span> Manage appointments</p>
                                    <p className="flex items-center gap-2"><span className="text-emerald-600">✓</span> Access your records</p>
                                </div>
                                <div className="mt-7 rounded-2xl border border-orange-100 bg-white/75 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wider text-orange-700">How to get started</p>
                                    <ol className="mt-3 grid gap-2 text-sm text-slate-700">
                                        <li><span className="mr-2 font-bold text-orange-600">01</span>Create your patient account.</li>
                                        <li><span className="mr-2 font-bold text-orange-600">02</span>Search for a doctor by specialty.</li>
                                        <li><span className="mr-2 font-bold text-orange-600">03</span>Select a time and confirm your appointment.</li>
                                    </ol>
                                </div>
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link href="/doctors" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700">Find a doctor</Link>
                                    <Link href="/register" className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white/80 px-5 py-3 text-sm font-bold text-emerald-800 transition-colors hover:bg-white">Create account</Link>
                                </div>
                            </div>
                        </section>

                        <section id="doctor-portal" aria-labelledby="doctor-portal-title" className="group relative overflow-hidden rounded-[1.5rem] border border-sky-200 bg-[linear-gradient(135deg,#172554,#164e63)] p-6 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8">
                            <div className="absolute -bottom-20 -right-12 h-56 w-56 rounded-full bg-sky-400/25 blur-3xl" />
                            <div className="relative flex h-full flex-col">
                                <div className="flex items-start justify-between gap-4">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl text-emerald-300 ring-1 ring-white/15">✚</span>
                                    <span className="rounded-full border border-sky-200/30 bg-sky-100/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-200">For doctors</span>
                                </div>
                                <h3 id="doctor-portal-title" className="mt-8 text-2xl font-extrabold sm:text-3xl">Make every consultation count.</h3>
                                <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">
                                    Build your professional presence, manage availability, connect with patients, and keep your clinical workflow organized.
                                </p>
                                <div className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                                    <p className="flex items-center gap-2"><span className="text-emerald-300">✓</span> Manage your profile</p>
                                    <p className="flex items-center gap-2"><span className="text-emerald-300">✓</span> Set appointment slots</p>
                                    <p className="flex items-center gap-2"><span className="text-emerald-300">✓</span> Review patient requests</p>
                                    <p className="flex items-center gap-2"><span className="text-emerald-300">✓</span> Continue patient care</p>
                                </div>
                                <div className="mt-7 rounded-2xl border border-sky-200/20 bg-white/10 p-4 backdrop-blur-sm">
                                    <p className="text-xs font-bold uppercase tracking-wider text-sky-200">How to get started</p>
                                    <ol className="mt-3 grid gap-2 text-sm text-slate-200">
                                        <li><span className="mr-2 font-bold text-sky-300">01</span>Register with your professional details.</li>
                                        <li><span className="mr-2 font-bold text-sky-300">02</span>Complete your profile and verification.</li>
                                        <li><span className="mr-2 font-bold text-sky-300">03</span>Set availability and start managing care.</li>
                                    </ol>
                                </div>
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link href="/doctor/login" className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400">Doctor sign in</Link>
                                    <Link href="/doctor/register" className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15">Join NexClinic</Link>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </section>

            {/* ABOUT US SECTION */}
            <section id="about" className="py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 lg:items-center">
                        <div className="lg:col-span-6 flex flex-col justify-center text-left">
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-700">
                                About NexClinic
                            </span>
                            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                                Redefining access to specialized clinical care
                            </h2>
                            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600">
                                NexClinic provides tools for patients, doctors, and hospitals to coordinate appointments and manage related information.
                            </p>
                            <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
                                The dashboard lets users browse doctors, review available slots, book appointments, and access their account information.
                            </p>

                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm transition-all duration-300 hover:border-green-100 hover:shadow-md">
                                    <h4 className="font-bold text-sm text-slate-900">Patient-Centric</h4>
                                    <p className="mt-1 text-xs text-slate-500">Every feature is optimized to minimize waiting times and friction.</p>
                                </div>
                                <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm transition-all duration-300 hover:border-green-100 hover:shadow-md">
                                    <h4 className="font-bold text-sm text-slate-900">Hospital Integrated</h4>
                                    <p className="mt-1 text-xs text-slate-500">Hospital staff can publish and manage doctor schedules through the platform.</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-6 grid gap-4 sm:gap-6">
                            <div className="group relative overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-green-600 to-green-700 p-6 sm:p-8 text-white shadow-lg transition-all duration-300 hover:shadow-xl active:scale-[0.99]">
                                <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-green-200">Our Core Mission</span>
                                <h3 className="mt-2 text-xl sm:text-2xl font-bold">To empower health journeys through digital transparency</h3>
                                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-green-50">
                                    We aim to make doctor information and appointment scheduling easier to access.
                                </p>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-teal-600 to-teal-700 p-6 sm:p-8 text-white shadow-lg transition-all duration-300 hover:shadow-xl active:scale-[0.99]">
                                <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-teal-200">Our Shared Vision</span>
                                <h3 className="mt-2 text-xl sm:text-2xl font-bold">Simpler coordination between patients and care providers</h3>
                                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-teal-50">
                                    We visualize a future where scheduling virtual or in-person specialist consultation is as easy as sending a message, ensuring early detection and care.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHY CHOOSE US SECTION */}
            <section id="features" className="py-16 sm:py-24 border-t border-slate-100 bg-slate-50/50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-800">
                            Why Choose NexClinic
                        </span>
                        <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                            Engineered for trust, safety, and operational excellence
                        </h2>
                        <p className="mt-3 text-xs sm:text-sm text-slate-600">
                            Every segment of NexClinic is built to support faster recovery and secure clinical tracking.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="group rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-200/50 active:scale-[0.98]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-colors duration-300 group-hover:bg-green-500 group-hover:text-white">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-900 transition-colors group-hover:text-green-600">Experienced Doctors</h3>
                            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                                Browse registered doctor profiles and the professional information available for each doctor.
                            </p>
                        </div>

                        <div className="group rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-200/50 active:scale-[0.98]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-colors duration-300 group-hover:bg-green-500 group-hover:text-white">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-900 transition-colors group-hover:text-green-600">Secure Medical Records</h3>
                            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                                Your medical histories, prescriptions, and consult logs are saved securely using advanced database encryption.
                            </p>
                        </div>

                        <div className="group rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-200/50 active:scale-[0.98]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-colors duration-300 group-hover:bg-green-500 group-hover:text-white">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-900 transition-colors group-hover:text-green-600">Fast Appointment Booking</h3>
                            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                                Lock in slots instantly. Integrated live scheduling removes waiting queues and manual phone confirmations.
                            </p>
                        </div>

                        <div className="group rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-200/50 active:scale-[0.98]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-colors duration-300 group-hover:bg-green-500 group-hover:text-white">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2a2.5 2.5 0 002.5-2.5V8a2 2 0 00-2-2h-.5A2.5 2.5 0 0014 3.5v-.5M12 21a9 9 0 100-18 9 9 0 000 18z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-900 transition-colors group-hover:text-green-600">Easy Access Anywhere</h3>
                            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                                Log in securely from any device—laptop, tablet, or mobile—to check schedules, appointments, or messages.
                            </p>
                        </div>

                        <div className="group rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-200/50 active:scale-[0.98]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-colors duration-300 group-hover:bg-green-500 group-hover:text-white">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-900 transition-colors group-hover:text-green-600">Reliable Healthcare</h3>
                            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                                Appointment information and account notifications help you keep track of scheduled care.
                            </p>
                        </div>

                        <div className="group rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-200/50 active:scale-[0.98]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-colors duration-300 group-hover:bg-green-500 group-hover:text-white">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-900 transition-colors group-hover:text-green-600">Privacy & Security</h3>
                            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                                Built under strict regulatory guidelines to ensure full compliance with patient privacy and secure data practices.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* OUR SERVICES SECTION */}
            <section id="services" className="py-16 sm:py-24 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 sm:mb-16">
                        <div className="max-w-3xl text-left">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-700">
                                NexClinic Specialties
                            </span>
                            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                                Specialized clinical services for all patient needs
                            </h2>
                        </div>
                        <Link id="link-all-specialties" href="/doctors" className="mt-3 md:mt-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-green-600 hover:text-green-700 transition-colors active:translate-x-0.5">
                            View All Specialties
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Service Card 1 */}
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-green-100 active:scale-[0.99]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 transition-all duration-300 group-hover:scale-110">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-900 group-hover:text-green-600 transition-colors">Cardiology</h3>
                            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">Expert diagnosis and care for heart conditions, structural blockages, and rehabilitation plans.</p>
                        </div>

                        {/* Service Card 2 */}
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-green-100 active:scale-[0.99]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 transition-all duration-300 group-hover:scale-110">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-900 group-hover:text-green-600 transition-colors">Neurology</h3>
                            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">Treatment for brain, spinal cord, nerve system disorders, including chronic migraine and sleep diagnostics.</p>
                        </div>

                        {/* Service Card 3 */}
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-green-100 active:scale-[0.99]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-600 transition-all duration-300 group-hover:scale-110">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-900 group-hover:text-green-600 transition-colors">Pediatrics</h3>
                            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">Comprehensive infant and child clinical support, immunization schedules, and childhood wellness audits.</p>
                        </div>

                        {/* Service Card 4 */}
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-green-100 active:scale-[0.99]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-all duration-300 group-hover:scale-110">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-900 group-hover:text-green-600 transition-colors">General Medicine</h3>
                            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">Primary consultation, regular checkups, health assessments, prescription refills, and triage guidance.</p>
                        </div>

                        {/* Service Card 5 */}
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-green-100 active:scale-[0.99]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-500 transition-all duration-300 group-hover:scale-110">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-900 group-hover:text-green-600 transition-colors">Orthopedics</h3>
                            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">Bone, joint, ligament care, joint replacement advice, and customized physical therapy guidance.</p>
                        </div>

                        {/* Service Card 6 */}
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-green-100 active:scale-[0.99]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 transition-all duration-300 group-hover:scale-110">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-900 group-hover:text-green-600 transition-colors">Mental Health</h3>
                            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">Supportive counseling, cognitive therapies, stress management checkups, and wellness monitoring.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section id="how-it-works" className="py-16 sm:py-24 border-t border-slate-100 bg-slate-50/30">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-700">
                            Clinical Flow
                        </span>
                        <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                            How NexClinic works for you
                        </h2>
                        <p className="mt-3 text-xs sm:text-sm text-slate-600">
                            Complete your booking journey in four simple, transparent stages.
                        </p>
                    </div>

                    {/* Timeline Steps */}
                    <div className="relative">
                        {/* Desktop Connector Line */}
                        <div className="absolute top-1/2 left-0 right-0 hidden h-0.5 -translate-y-1/2 bg-slate-200 lg:block -z-10" />

                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Step 1 */}
                            <div className="relative flex flex-col items-center text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-50 bg-green-500 text-xl font-bold text-white shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-110 active:scale-95">
                                    1
                                </div>
                                <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">Create Account</h3>
                                <p className="mt-2 max-w-xs text-xs sm:text-sm leading-relaxed text-slate-600">
                                    Sign up as a patient or hospital register in seconds to lock in your clinical portal access.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="relative flex flex-col items-center text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-50 bg-green-600 text-xl font-bold text-white shadow-lg shadow-green-600/20 transition-all duration-300 hover:scale-110 active:scale-95">
                                    2
                                </div>
                                <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">Find Doctor</h3>
                                <p className="mt-2 max-w-xs text-xs sm:text-sm leading-relaxed text-slate-600">
                                    Filter and browse specialists by specialty, qualifications, rates, and active schedules.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="relative flex flex-col items-center text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-50 bg-green-700 text-xl font-bold text-white shadow-lg shadow-green-700/20 transition-all duration-300 hover:scale-110 active:scale-95">
                                    3
                                </div>
                                <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">Book Appointment</h3>
                                <p className="mt-2 max-w-xs text-xs sm:text-sm leading-relaxed text-slate-600">
                                    Pick an available time slot that fits your schedule and receive immediate email confirmation.
                                </p>
                            </div>

                            {/* Step 4 */}
                            <div className="relative flex flex-col items-center text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-50 bg-green-800 text-xl font-bold text-white shadow-lg shadow-green-800/20 transition-all duration-300 hover:scale-110 active:scale-95">
                                    4
                                </div>
                                <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">Receive Care</h3>
                                <p className="mt-2 max-w-xs text-xs sm:text-sm leading-relaxed text-slate-600">
                                    Attend scheduled sessions, get ongoing diagnostics support, and follow prescriptions.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Step Summary Banner (Preserved and redesigned with green gradient) */}
                    <div className="mt-16 rounded-2xl border border-green-200 bg-gradient-to-r from-green-600 via-green-700 to-green-800 p-6 sm:p-8 text-white shadow-xl shadow-green-500/10 transition-all duration-300 hover:shadow-2xl">
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                                <span className="inline-flex rounded bg-white/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Step 1</span>
                                <h3 className="mt-3 text-base sm:text-lg font-bold">Search Specialist</h3>
                                <p className="mt-1.5 text-xs leading-relaxed text-green-50">Filter by expertise, location, and real-time availability details instantly.</p>
                            </div>
                            <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                                <span className="inline-flex rounded bg-white/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Step 2</span>
                                <h3 className="mt-3 text-base sm:text-lg font-bold">Book Instantly</h3>
                                <p className="mt-1.5 text-xs leading-relaxed text-green-50">Pick a convenient time slot and receive immediate scheduler confirmation.</p>
                            </div>
                            <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                                <span className="inline-flex rounded bg-white/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Step 3</span>
                                <h3 className="mt-3 text-base sm:text-lg font-bold">Get Ongoing Care</h3>
                                <p className="mt-1.5 text-xs leading-relaxed text-green-50">Track treatment logs, schedules, and continue recovery with confidence.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHY PATIENTS CHOOSE US (Highlight cards from original code, redesigned with green icons) */}
            <section id="features-highlights" className="py-16 sm:py-24 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mb-10 text-left">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-700">
                            Core Benefits
                        </span>
                        <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                            Why Patients Choose Us
                        </h2>
                        <p className="mt-2 text-xs sm:text-sm text-slate-600">Built for trust, speed, and better care outcomes across Sri Lanka.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {highlightCards.map((card) => (
                            <article key={card.title} className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:border-green-200/50 active:scale-[0.98]">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 transition-all duration-300 group-hover:bg-green-50 group-hover:scale-105">
                                    {card.icon}
                                </div>
                                <h3 className="mt-5 text-base sm:text-lg font-bold text-slate-900 group-hover:text-green-600 transition-colors">{card.title}</h3>
                                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">{card.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* HEALTH DESK / ARTICLES (News and articles section from original code) */}
            {/* <section id="health-desk" className="py-16 sm:py-24 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                        <div className="max-w-2xl text-left">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-700">
                                Health Desk
                            </span>
                            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                                Latest health news & medical articles
                            </h2>
                        </div>
                        <Link
                            id="btn-see-all-articles"
                            href="/news-articles"
                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-slate-850 hover:-translate-y-0.5 active:scale-[0.98]"
                        >
                            See All Articles
                        </Link>
                    </div> */}

            {/* <div className="grid gap-6 lg:grid-cols-12 lg:gap-8"> */}
            {/* Big Featured Article */}
            {/* <article className="group relative overflow-hidden rounded-2xl shadow-lg lg:col-span-6 min-h-[320px] sm:min-h-[400px] flex flex-col justify-end transition-all duration-300 hover:shadow-xl active:scale-[0.99]">
                            <div className="absolute inset-0">
                                <img className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src="/images/doc2.jpg" alt="Top health story" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                            </div>
                            <div className="relative p-6 sm:p-8 text-white z-10 text-left">
                                <span className="inline-flex items-center gap-1 rounded bg-green-500 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
                                    Featured Report
                                </span>
                                <h3 className="mt-3 text-xl sm:text-2xl font-bold leading-tight transition-colors group-hover:text-green-300">
                                    New Treatment for Brain Tumor Shows Encouraging Trial Results
                                </h3>
                                <div className="mt-3 flex items-center justify-between text-xs text-slate-300 border-t border-white/10 pt-3">
                                    <span>California, USA</span>
                                    <span>Medical Research</span>
                                </div>
                            </div>
                        </article> */}

            {/* Stories Side Grid */}
            {/* <div className="space-y-4 sm:space-y-6 lg:col-span-6">
                            {quickStories.map((story) => (
                                <article key={story.title} className="group flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300 hover:bg-white hover:shadow-md hover:border-green-100 active:scale-[0.99]">
                                    <div className="h-20 w-24 sm:h-24 sm:w-28 shrink-0 overflow-hidden rounded-xl">
                                        <img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src={story.image} alt={story.title} />
                                    </div>
                                    <div className="flex flex-col justify-center text-left">
                                        <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-green-600 transition-colors line-clamp-2">{story.title}</h4>
                                        <p className="mt-0.5 text-[10px] sm:text-xs font-semibold text-green-600">{story.location}</p>
                                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{story.summary}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section> */}

            {/* FAQ SECTION */}
            <section id="faq" className="py-16 sm:py-24 bg-white">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 sm:mb-16">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-700">
                            Common Questions
                        </span>
                        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                            Frequently Asked Questions
                        </h2>
                        <p className="mt-3 text-xs sm:text-sm text-slate-600">
                            Clear, direct answers regarding NexClinic booking, security, and consultation rules.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* FAQ 1 */}
                        <details id="faq-booking" className="group border border-slate-100 rounded-2xl bg-slate-50/50 p-5 sm:p-6 transition-all duration-300 hover:border-green-100 hover:bg-white [&_summary::-webkit-details-marker]:hidden">
                            <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-900 focus:outline-none select-none">
                                <h3 className="text-sm sm:text-base md:text-lg font-bold text-left">How do I book an appointment?</h3>
                                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 text-slate-600 transition-transform duration-300 group-open:rotate-180">
                                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </summary>
                            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 transition-all duration-300">
                                Simply navigate to the &quot;Find Doctors&quot; page, filter by medical specialty, location, or credentials, choose a date and slot that works for you, and click book. You will receive an email confirmation immediately.
                            </p>
                        </details>

                        {/* FAQ 2 */}
                        <details id="faq-security" className="group border border-slate-100 rounded-2xl bg-slate-50/50 p-5 sm:p-6 transition-all duration-300 hover:border-green-100 hover:bg-white [&_summary::-webkit-details-marker]:hidden">
                            <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-900 focus:outline-none select-none">
                                <h3 className="text-sm sm:text-base md:text-lg font-bold text-left">Is my medical data secure?</h3>
                                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 text-slate-600 transition-transform duration-300 group-open:rotate-180">
                                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </summary>
                            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 transition-all duration-300">
                                Yes. NexClinic complies with strict database privacy and security guidelines. Your personal records, checkup histories, and profile documents are encrypted and only accessible to you and your selected consultants.
                            </p>
                        </details>

                        {/* FAQ 3 */}
                        <details id="faq-online" className="group border border-slate-100 rounded-2xl bg-slate-50/50 p-5 sm:p-6 transition-all duration-300 hover:border-green-100 hover:bg-white [&_summary::-webkit-details-marker]:hidden">
                            <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-900 focus:outline-none select-none">
                                <h3 className="text-sm sm:text-base md:text-lg font-bold text-left">Can I consult doctors online?</h3>
                                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 text-slate-600 transition-transform duration-300 group-open:rotate-180">
                                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </summary>
                            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 transition-all duration-300">
                                Yes. NexClinic supports both tele-consultation (online video/audio sessions) and standard in-person checkups. You can select your preferred consult method during the slot booking phase.
                            </p>
                        </details>

                        {/* FAQ 4 */}
                        <details id="faq-verification" className="group border border-slate-100 rounded-2xl bg-slate-50/50 p-5 sm:p-6 transition-all duration-300 hover:border-green-100 hover:bg-white [&_summary::-webkit-details-marker]:hidden">
                            <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-900 focus:outline-none select-none">
                                <h3 className="text-sm sm:text-base md:text-lg font-bold text-left">How are doctors verified on NexClinic?</h3>
                                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 text-slate-600 transition-transform duration-300 group-open:rotate-180">
                                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </summary>
                            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 transition-all duration-300">
                                Doctor profiles display the verification status recorded by the platform. Review the profile details before booking.
                            </p>
                        </details>

                        {/* FAQ 5 */}
                        <details id="faq-cancellation" className="group border border-slate-100 rounded-2xl bg-slate-50/50 p-5 sm:p-6 transition-all duration-300 hover:border-green-100 hover:bg-white [&_summary::-webkit-details-marker]:hidden">
                            <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-900 focus:outline-none select-none">
                                <h3 className="text-sm sm:text-base md:text-lg font-bold text-left">What is NexClinic&apos;s cancellation policy?</h3>
                                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 text-slate-600 transition-transform duration-300 group-open:rotate-180">
                                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </summary>
                            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 transition-all duration-300">
                                Open your appointments page to see the actions currently available for a booking. Availability depends on the appointment&apos;s status.
                            </p>
                        </details>
                    </div>
                </div>
            </section>

            {/* TRENDING NEWS SECTION */}
            <section id="news" className="py-16 sm:py-24 bg-white border-t border-slate-100">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 sm:mb-16">
                        <div className="max-w-3xl text-left">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-700">
                                Latest Updates
                            </span>
                            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                                Trending Health News
                            </h2>
                            <p className="mt-3 text-xs sm:text-sm text-slate-600">
                                Stay informed with the latest medical breakthroughs and health insights.
                            </p>
                        </div>
                        <Link href="/news-articles" className="mt-3 md:mt-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-green-600 hover:text-green-700 transition-colors active:translate-x-0.5">
                            View All Articles
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {loadingNews ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                        </div>
                    ) : trendingArticles.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {trendingArticles.map((article) => (
                                <article key={article.id} className="group flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-green-200/50">
                                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={article.imageUrl} alt={article.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    </div>
                                    <div className="flex flex-col flex-1 p-6">
                                        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-600 mb-3">
                                            <span>{article.author}</span>
                                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                                            <span>{article.date}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-green-600 transition-colors">
                                            <Link href={article.url} target="_blank" rel="noopener noreferrer">
                                                {article.title}
                                            </Link>
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-600 line-clamp-3 mb-6">
                                            {article.summary}
                                        </p>
                                        <div className="mt-auto">
                                            <Link href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 transition-colors group-hover:text-green-600">
                                                Read full article
                                                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-500 text-sm">
                            No trending news available right now.
                        </div>
                    )}
                </div>
            </section>

            {/* STRONG CALL TO ACTION */}
            <section id="contact" className="relative mx-auto mb-16 max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative rounded-[2rem] border border-white/60 bg-gradient-to-r from-slate-900 via-slate-800 to-green-950 p-8 sm:p-12 md:p-16 text-white shadow-2xl overflow-hidden text-left">
                    {/* Visual grids backdrop */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,173,133,0.12),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(0,173,133,0.15),transparent_50%)] pointer-events-none" />

                    <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-widest text-green-300">Ready to Begin?</span>
                            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                                Find a specialist & book your appointment today
                            </h2>
                            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-300 max-w-xl">
                                Join NexClinic. Move from quick search to verified consults without queues or manual confirmations.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <a href="tel:+94112345678" className="rounded-2xl border border-white/10 bg-white/10 p-4 transition-colors hover:bg-white/15">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-green-300">Call us</span>
                                <span className="mt-1 block text-sm font-semibold">+94 11 234 5678</span>
                            </a>
                            <a href="mailto:support@nexclinic.com" className="rounded-2xl border border-white/10 bg-white/10 p-4 transition-colors hover:bg-white/15">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-green-300">Email support</span>
                                <span className="mt-1 block break-all text-sm font-semibold">support@nexclinic.com</span>
                            </a>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-green-300">Visit us</span>
                                <span className="mt-1 block text-sm font-semibold">Colombo, Sri Lanka</span>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-green-300">Support hours</span>
                                <span className="mt-1 block text-sm font-semibold">Mon-Fri, 8:30 AM-5:00 PM</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2">
                            <Link
                                id="btn-start-booking"
                                href="/doctors"
                                className="inline-flex items-center justify-center rounded-xl bg-green-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-green-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-600 hover:shadow-xl active:scale-[0.98]"
                            >
                                Start Booking
                            </Link>
                            <Link
                                id="btn-register-account"
                                href="/register"
                                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-xs sm:text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 active:scale-[0.98]"
                            >
                                Register Account
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* MODERN MULTI-COLUMN FOOTER */}
            <footer className="border-t border-slate-100 bg-slate-50 py-12 lg:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 text-left">
                        {/* Brand Column */}
                        <div className="lg:col-span-2">
                            <Link href="/" className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 transition-opacity hover:opacity-90">
                                <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-7 w-7" />
                                NexClinic
                            </Link>
                            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-slate-500 max-w-sm">
                                NexClinic provides appointment and account-management tools for patients, doctors, and hospitals.
                            </p>
                        </div>

                        {/* Navigation Map */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950">Sitemap</h4>
                            <ul className="mt-4 space-y-2 text-xs sm:text-sm text-slate-500">
                                <li><Link href="/" className="hover:text-green-600 transition-colors">Home</Link></li>
                                <li><Link href="#features" className="hover:text-green-600 transition-colors">Features</Link></li>
                                <li><Link href="#services" className="hover:text-green-600 transition-colors">Services</Link></li>
                                <li><Link href="#about" className="hover:text-green-600 transition-colors">About Us</Link></li>
                                <li><Link href="#faq" className="hover:text-green-600 transition-colors">FAQ</Link></li>
                                <li><Link href="/help" className="hover:text-green-600 transition-colors">Help & Support</Link></li>
                            </ul>
                        </div>

                        {/* Portal Access */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950">Portal</h4>
                            <ul className="mt-4 space-y-2 text-xs sm:text-sm text-slate-500">
                                <li><Link href="/login" className="hover:text-green-600 transition-colors">Patient Sign In</Link></li>
                                <li><Link href="/register" className="hover:text-green-600 transition-colors">Create Patient Account</Link></li>
                                <li><Link href="/hospital" className="hover:text-green-600 transition-colors">Hospital Console</Link></li>
                                <li><Link href="/doctors" className="hover:text-green-600 transition-colors">Browse Doctor Directories</Link></li>
                            </ul>
                        </div>

                    </div>

                    <div className="mt-12 border-t border-slate-200/60 pt-8 text-center text-xs text-slate-400">
                        <p>© {new Date().getFullYear()} NexClinic.</p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
