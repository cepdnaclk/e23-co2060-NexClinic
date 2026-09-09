"use client";

import { useEffect, useState } from "react";
import RoleBasedNavbar from "@/components/common/RoleBasedNavbar";
import Link from "next/link";

type HighlightCard = {
    title: string;
    description: string;
    icon: React.ReactNode;
};

type Story = {
    title: string;
    location: string;
    summary: string;
    image: string;
};

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

// Animated Stats Counter component
function StatsCounter({ target, suffix = "", duration = 1500 }: { target: number; suffix?: string; duration?: number }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = target;
        if (end === 0) return;

        // Dynamic step time to ensure the animation completes roughly in 'duration' ms
        const increment = Math.ceil(end / (duration / 16)); // 16ms is ~1 frame at 60fps
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, 16);

        return () => clearInterval(timer);
    }, [target, duration]);

    return <span>{count.toLocaleString()}{suffix}</span>;
}

const highlightCards = [
    {
        title: "Smart Appointment Booking",
        description: "Book your doctor in minutes with clear schedules and real-time slot visibility.",
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
        title: "Verified Specialists",
        description: "Consult trusted doctors with complete professional profiles and transparent ratings.",
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

const quickStories: Story[] = [
    {
        title: "Early Detection AI Tool Improves Cancer Screening Outcomes",
        location: "Colombo, Sri Lanka",
        summary: "Hospitals report better triage speed and confidence with new diagnostic support models.",
        image: "/images/doc.jpg",
    },
    {
        title: "Cardiac Rehab Program Helps Patients Recover 35% Faster",
        location: "Kandy, Sri Lanka",
        summary: "A multidisciplinary recovery plan combines tele-consultation and in-person checkups.",
        image: "/images/doc2.jpg",
    },
    {
        title: "Digital Mental Wellness Clinics Expand to Rural Communities",
        location: "Galle, Sri Lanka",
        summary: "Community-led sessions with doctors reduce waiting time and improve continuity of care.",
        image: "/images/HealthDoc.avif",
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
                    const formattedArticles = data.articles.slice(0, 3).map((article: any, index: number) => ({
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
        <main className="relative min-h-screen w-full overflow-hidden bg-slate-50/50 text-slate-900 scroll-smooth">
            {/* Design System Blur Backdrops (Mesh Gradients in Green/Teal) */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -left-40 h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] rounded-full bg-green-100/40 blur-[80px] sm:blur-[120px]" />
                <div className="absolute top-[30%] -right-40 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] rounded-full bg-green-50/40 blur-[80px] sm:blur-[100px]" />
                <div className="absolute bottom-10 left-[20%] h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] rounded-full bg-green-100/20 blur-[90px] sm:blur-[130px]" />
                <img className="absolute inset-0 h-full w-full object-cover opacity-[0.02] mix-blend-overlay" src="/images/hexagons.png" alt="" aria-hidden="true" />
            </div>

            {/* Sticky Navigation bar container */}
            <header className="fixed top-0 left-0 z-50 w-full">
                <RoleBasedNavbar />
            </header>

            {/* HERO SECTION */}
            <section className="relative mt-16 overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
                        {/* Hero Left Content */}
                        <div className="lg:col-span-7 flex flex-col justify-center text-left">
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-green-100 bg-green-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-700 backdrop-blur-sm">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                Connected Care Platform
                            </span>
                            <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight lg:leading-[1.15]">
                                Your Health Journey, <br />
                                <span className="bg-gradient-to-r from-green-600 via-green-500 to-teal-500 bg-clip-text text-transparent">
                                    Smarter with NexClinic
                                </span>
                            </h1>
                            <p className="mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed text-slate-600">
                                Discover verified specialists, book appointments instantly, and stay informed with trusted medical updates in one seamless, secure clinical experience built for you.
                            </p>
                            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
                                <Link
                                    id="hero-find-doctors"
                                    href="/doctors"
                                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-green-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/20 active:scale-[0.98]"
                                >
                                    Find Doctors Now
                                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </Link>
                                <Link
                                    id="hero-explore-news"
                                    href="/news-articles"
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-50/20 hover:text-green-700 active:scale-[0.98]"
                                >
                                    Explore Health News
                                </Link>
                            </div>

                            {/* Hero Small Stats */}
                            <div className="mt-8 sm:mt-12 grid grid-cols-3 gap-4 sm:gap-6 border-t border-slate-100 pt-6 sm:pt-8">
                                <div>
                                    <p className="text-2xl sm:text-3xl font-black text-slate-900">
                                        <StatsCounter target={500} suffix="+" />
                                    </p>
                                    <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">Verified Doctors</p>
                                </div>
                                <div>
                                    <p className="text-2xl sm:text-3xl font-black text-slate-900">24/7</p>
                                    <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">Booking Access</p>
                                </div>
                                <div>
                                    <p className="text-2xl sm:text-3xl font-black text-slate-900">
                                        <StatsCounter target={98} suffix="%" />
                                    </p>
                                    <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">Patient Success</p>
                                </div>
                            </div>
                        </div>

                        {/* Hero Right Media Grid */}
                        <div className="lg:col-span-5 relative mt-6 lg:mt-0 w-full">
                            {/* Background glow graphic decor */}
                            <div className="absolute inset-0 -m-4 sm:-m-8 bg-gradient-to-tr from-green-500/10 to-teal-500/5 rounded-3xl blur-2xl -z-10" />

                            <div className="grid gap-4 sm:gap-6 max-w-md sm:max-w-none mx-auto">
                                {/* Insights Panel */}
                                <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-5 sm:p-6 shadow-lg shadow-slate-100/50 backdrop-blur-md transition-all duration-300 hover:shadow-xl">
                                    <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full" />
                                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-700">Today&apos;s care insight</p>
                                    <h3 className="mt-2 text-lg sm:text-xl font-bold text-slate-900">Tele-consultations reduce waiting times by up to 42%</h3>
                                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">NexClinic makes it simpler for patients to get faster access to certified specialist guidance without geographical constraints.</p>
                                </div>

                                {/* Floating Graphics - Secondary Grid */}
                                <div className="grid gap-4 sm:gap-6 grid-cols-2">
                                    <div className="group overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-lg shadow-slate-100/50 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-green-200/50">
                                        <div className="relative h-28 sm:h-36 overflow-hidden">
                                            <img src="/images/HealthDoc.avif" alt="Online consultation" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                                            <span className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded bg-green-500 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
                                                Live Status
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
                                            <p className="mt-1 text-[10px] sm:text-xs leading-relaxed text-slate-500">Never miss scheduled checkups with automated booking alerts.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TRUSTED BY / PARTNERS */}
            <section className="border-y border-slate-100 bg-white/40 py-6 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Partnering with Sri Lanka&apos;s Leading Healthcare Networks
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-50 grayscale transition-all duration-300 hover:opacity-85 hover:grayscale-0">
                        <span className="text-sm sm:text-base font-bold tracking-tight text-slate-800 transition-colors hover:text-green-600 cursor-default">LANKA HOSPITALS</span>
                        <span className="text-sm sm:text-base font-bold tracking-tight text-slate-800 transition-colors hover:text-green-600 cursor-default">ASIRI HEALTH</span>
                        <span className="text-sm sm:text-base font-bold tracking-tight text-slate-800 transition-colors hover:text-green-600 cursor-default">DURDANS CLINIC</span>
                        <span className="text-sm sm:text-base font-bold tracking-tight text-slate-800 transition-colors hover:text-green-600 cursor-default">NAWALOKA MED</span>
                        <span className="text-sm sm:text-base font-bold tracking-tight text-slate-800 transition-colors hover:text-green-600 cursor-default">CENTRAL CLINIC</span>
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
                                NexClinic was founded to solve clinical scheduling inefficiencies by bridging the communication gap between patients, verified medical specialists, and premier hospitals. We believe healthcare access should be immediate, convenient, and built on trust.
                            </p>
                            <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
                                Our dashboard enables users to access high-quality diagnosis advice, check doctor availability instantly, book slots securely, and store consultations with absolute data confidentiality.
                            </p>

                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm transition-all duration-300 hover:border-green-100 hover:shadow-md">
                                    <h4 className="font-bold text-sm text-slate-900">Patient-Centric</h4>
                                    <p className="mt-1 text-xs text-slate-500">Every feature is optimized to minimize waiting times and friction.</p>
                                </div>
                                <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm transition-all duration-300 hover:border-green-100 hover:shadow-md">
                                    <h4 className="font-bold text-sm text-slate-900">Hospital Integrated</h4>
                                    <p className="mt-1 text-xs text-slate-500">Direct integration with clinic schedules ensures zero double-bookings.</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-6 grid gap-4 sm:gap-6">
                            <div className="group relative overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-green-600 to-green-700 p-6 sm:p-8 text-white shadow-lg transition-all duration-300 hover:shadow-xl active:scale-[0.99]">
                                <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-green-200">Our Core Mission</span>
                                <h3 className="mt-2 text-xl sm:text-2xl font-bold">To empower health journeys through digital transparency</h3>
                                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-green-50">
                                    We aim to place clinical power back into patients&apos; hands by offering clear doctor profiles, honest rating reviews, and immediate scheduling access.
                                </p>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-teal-600 to-teal-700 p-6 sm:p-8 text-white shadow-lg transition-all duration-300 hover:shadow-xl active:scale-[0.99]">
                                <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-teal-200">Our Shared Vision</span>
                                <h3 className="mt-2 text-xl sm:text-2xl font-bold">A boundaryless, immediate medical support ecosystem</h3>
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
                                Access a network of over 500+ verified medical specialists, each with detailed credentials, histories, and patient ratings.
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
                                Dedicated support systems, automatic follow-ups, and trusted clinical news portals keep you fully informed.
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

            {/* STATISTICS SECTION */}
            <section className="relative overflow-hidden bg-slate-900 py-12 text-white lg:py-20">
                {/* Background glow graphic */}
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(0,173,133,0.15),transparent_60%)]" />

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4 text-center">
                        <div className="p-2 border-r border-slate-800 last:border-0">
                            <p className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                                <StatsCounter target={10000} suffix="+" />
                            </p>
                            <p className="mt-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Active Patients</p>
                        </div>
                        <div className="p-2 border-r border-slate-800 last:border-0">
                            <p className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                                <StatsCounter target={500} suffix="+" />
                            </p>
                            <p className="mt-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Verified Specialists</p>
                        </div>
                        <div className="p-2 border-r border-slate-800 last:border-0">
                            <p className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                                <StatsCounter target={25} suffix="+" />
                            </p>
                            <p className="mt-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Partner Hospitals</p>
                        </div>
                        <div className="p-2 border-r border-slate-800 last:border-0">
                            <p className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                                <StatsCounter target={50000} suffix="+" />
                            </p>
                            <p className="mt-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Appointments Booked</p>
                        </div>
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

            {/* TESTIMONIALS SECTION */}
            <section className="py-16 sm:py-24 border-t border-slate-100 bg-slate-50/30">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-700">
                            Patient Stories
                        </span>
                        <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                            What our patients say about NexClinic
                        </h2>
                        <p className="mt-3 text-xs sm:text-sm text-slate-600">
                            Read clinical recovery reviews and scheduling experiences from patients we support.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3 max-w-md md:max-w-none mx-auto">
                        {/* Testimonial 1 */}
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:border-green-100 text-left">
                            <div className="flex items-center gap-1 text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                ))}
                            </div>
                            <blockquote className="mt-4 text-xs sm:text-sm italic leading-relaxed text-slate-600">
                                &quot;Booking an appointment on NexClinic was incredibly simple. I found a verified cardiologist, checked their live availability, and scheduled a consult in under 2 minutes!&quot;
                            </blockquote>
                            <div className="mt-6 flex items-center gap-3">
                                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-50 text-xs font-bold text-green-600">
                                    PD
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-bold text-slate-950">Priyantha D.</p>
                                    <p className="text-[10px] sm:text-xs text-slate-500">Colombo, Sri Lanka</p>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial 2 */}
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:border-green-100 text-left">
                            <div className="flex items-center gap-1 text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                ))}
                            </div>
                            <blockquote className="mt-4 text-xs sm:text-sm italic leading-relaxed text-slate-600">
                                &quot;The platform is fast, clean, and highly secure. I can see my consultations history, prescriptions, and get alerts for regular checks. The visual layout is excellent.&quot;
                            </blockquote>
                            <div className="mt-6 flex items-center gap-3">
                                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-100/60 text-xs font-bold text-green-700">
                                    MK
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-bold text-slate-950">Minoli K.</p>
                                    <p className="text-[10px] sm:text-xs text-slate-500">Kandy, Sri Lanka</p>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial 3 */}
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:border-green-100 text-left">
                            <div className="flex items-center gap-1 text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                ))}
                            </div>
                            <blockquote className="mt-4 text-xs sm:text-sm italic leading-relaxed text-slate-600">
                                &quot;As a busy professional, the quick telemedicine consultations have saved me hours of waiting in clinic lobbies. Verification ratings make choosing a specialist easy.&quot;
                            </blockquote>
                            <div className="mt-6 flex items-center gap-3">
                                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-50 text-xs font-bold text-green-600">
                                    RS
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-bold text-slate-950">Roshan S.</p>
                                    <p className="text-[10px] sm:text-xs text-slate-500">Galle, Sri Lanka</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

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
                                All registered medical professionals are vetted through their institutional registrations and professional medical councils. A doctor&apos;s active status is marked verified only after official verification by our clinical team.
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
                                Patients can reschedule or cancel scheduled slots up to 24 hours prior to the appointment. Refund and cancellation rules are specified transparently on each doctor profile page.
                            </p>
                        </details>
                    </div>
                </div>
            </section>

            {/* HELP & SUPPORT + EMERGENCY INFORMATION */}
            <section id="help" className="py-16 sm:py-24 border-t border-slate-100 bg-slate-50/30">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                        {/* Help Desk info */}
                        <div className="flex flex-col justify-center text-left">
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-700">
                                Help & Support
                            </span>
                            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                                We are here to support your health journey
                            </h2>
                            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600">
                                Need help registering, updating account details, or managing active bookings? Contact our friendly support desk anytime.
                            </p>

                            <div className="mt-6 sm:mt-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm text-green-600 transition-transform duration-300 hover:scale-105">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] sm:text-xs font-medium text-slate-500">Phone Consultation Support</p>
                                        <p className="text-sm sm:text-base font-bold text-slate-900 hover:text-green-600 transition-colors cursor-pointer">+94 (11) 234-5678</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm text-green-600 transition-transform duration-300 hover:scale-105">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] sm:text-xs font-medium text-slate-500">Email Support Desk</p>
                                        <p className="text-sm sm:text-base font-bold text-slate-900 hover:text-green-600 transition-colors cursor-pointer">support@nexclinic.lk</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <Link
                                    href="/help"
                                    className="inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 px-6 py-3 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                                >
                                    Visit Help Center
                                </Link>
                            </div>
                        </div>

                        {/* Critical Emergency Banner */}
                        <div className="relative overflow-hidden rounded-[2rem] border border-red-100 bg-gradient-to-br from-red-50 to-red-100/50 p-6 sm:p-8 shadow-md text-left">
                            <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-500/20 transition-transform duration-300 hover:scale-105">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-xl sm:text-2xl font-extrabold text-red-950">In Case of a Medical Emergency</h3>
                            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-red-900">
                                NexClinic is an appointment scheduling platform for standard clinical care. If you are experiencing a life-threatening medical emergency (such as severe chest pain, major breathing difficulties, or acute trauma):
                            </p>
                            <div className="mt-6 rounded-xl bg-red-600 p-4 text-center text-white shadow-md transition-all duration-300 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20">
                                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-red-100">National Emergency Services Hotline</p>
                                <p className="mt-0.5 text-2xl sm:text-3xl font-black">Call 1990 Immediately</p>
                            </div>
                            <p className="mt-3 text-[10px] sm:text-xs font-semibold text-red-600/80">
                                Or visit the emergency department of your nearest local hospital. Do not wait for an online consult.
                            </p>
                        </div>
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

            {/* NEWSLETTER / UPDATES */}
            <section className="py-12 sm:py-16 bg-white border-t border-slate-100">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="relative rounded-[2rem] border border-green-100 bg-gradient-to-r from-green-50 to-teal-50/20 p-6 sm:p-10 shadow-inner overflow-hidden text-left">
                        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-green-100/30 blur-2xl pointer-events-none" />
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
                            <div>
                                <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-green-700">
                                    Weekly Health Brief
                                </span>
                                <h3 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">Receive medical briefings & clinic updates</h3>
                                <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xl">
                                    Subscribe to our weekly brief summarizing health findings verified by NexClinic physicians.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto shrink-0">
                                <input
                                    id="newsletter-email-input"
                                    type="email"
                                    placeholder="Enter your email address"
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm focus:border-green-500 focus:outline-none shadow-sm w-full sm:w-[260px] transition-colors"
                                />
                                <button
                                    id="newsletter-subscribe-button"
                                    type="button"
                                    className="rounded-xl bg-green-500 hover:bg-green-600 px-5 py-3 text-xs sm:text-sm font-bold text-white transition-all duration-300 shadow-md shadow-green-500/10 active:scale-[0.98]"
                                >
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STRONG CALL TO ACTION */}
            <section id="contact" className="relative mx-auto mb-16 max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative rounded-[2rem] border border-white/60 bg-gradient-to-r from-slate-900 via-slate-800 to-green-950 p-8 sm:p-12 md:p-16 text-white shadow-2xl overflow-hidden text-left">
                    {/* Visual grids backdrop */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,173,133,0.12),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(0,173,133,0.15),transparent_50%)] pointer-events-none" />

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between z-10">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-widest text-green-300">Ready to Begin?</span>
                            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                                Find a specialist & book your appointment today
                            </h2>
                            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-300 max-w-xl">
                                Join NexClinic. Move from quick search to verified consults without queues or manual confirmations.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
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
                                NexClinic is a smart digital healthcare platform connecting patients with specialized verified doctor networks in Sri Lanka.
                            </p>
                            <div className="mt-6 flex items-center gap-4 text-xs sm:text-sm text-slate-400">
                                <span className="hover:text-green-600 transition-colors cursor-pointer">FB</span>
                                <span className="hover:text-green-600 transition-colors cursor-pointer">TW</span>
                                <span className="hover:text-green-600 transition-colors cursor-pointer">IG</span>
                                <span className="hover:text-green-600 transition-colors cursor-pointer">LN</span>
                            </div>
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

                        {/* Legal */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950">Legal Copy</h4>
                            <ul className="mt-4 space-y-2 text-xs sm:text-sm text-slate-500">
                                <li><span className="hover:text-green-600 transition-colors cursor-pointer">Privacy & Policy</span></li>
                                <li><span className="hover:text-green-600 transition-colors cursor-pointer">Terms of Services</span></li>
                                <li><span className="hover:text-green-600 transition-colors cursor-pointer">HIPAA Compliance Disclosure</span></li>
                                <li><span className="hover:text-green-600 transition-colors cursor-pointer">Emergency care rules</span></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 border-t border-slate-200/60 pt-8 text-center text-xs text-slate-400">
                        <p>© {new Date().getFullYear()} NexClinic Healthcare. All rights reserved. V1.0.0 Sri Lanka.</p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
