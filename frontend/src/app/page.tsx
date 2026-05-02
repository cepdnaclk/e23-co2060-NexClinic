import RoleBasedNavbar from "@/components/common/RoleBasedNavbar";
import Link from "next/link";

type HighlightCard = {
    title: string;
    description: string;
    icon: string;
};

type Story = {
    title: string;
    location: string;
    summary: string;
    image: string;
};

const highlightCards: HighlightCard[] = [
    {
        title: "Smart Appointment Booking",
        description: "Book your doctor in minutes with clear schedules and real-time slot visibility.",
        icon: "/images/calendar.png",
    },
    {
        title: "Verified Specialists",
        description: "Consult trusted doctors with complete professional profiles and transparent ratings.",
        icon: "/images/stethoscope.png",
    },
    {
        title: "Secure Medical Experience",
        description: "Your health data stays protected with secure authentication and private sessions.",
        icon: "/images/shield.png",
    },
    {
        title: "Care Anywhere",
        description: "Access consultations from home, office, or on the move through NexClinic.",
        icon: "/images/location.png",
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

export default function Home() {
  return (
            <main className="min-h-screen w-full bg-[#f5faf7] text-gray-900">
                <div title="home-nav-bar" className="fixed w-full top-0 left-0 z-20">
                    <RoleBasedNavbar />
        </div>

                <section className="relative mt-[70px] overflow-hidden border-b border-emerald-100 bg-white">
                    <div className="absolute inset-0">
                        <img className="h-full w-full object-cover opacity-20" src="/images/main-bg.jpg" alt="NexClinic healthcare background" />
                        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-emerald-50/80" />
                    </div>
                    <div className="absolute -top-16 right-10 h-64 w-64 rounded-full bg-emerald-200/60 blur-3xl" />
                    <div className="absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-lime-100/80 blur-3xl" />

                    <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                        <div className="grid items-center gap-10 lg:grid-cols-2">
                            <div>
                                <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                                    Connected Care Platform
                                </p>
                                <h1 className="mt-5 text-4xl font-black leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                                    Your Health Journey,
                                    <span className="block text-emerald-700">Smarter with NexClinic</span>
                                </h1>
                                <p className="mt-5 max-w-xl text-base text-gray-600 sm:text-lg">
                                    Discover verified specialists, book appointments instantly, and stay informed with trusted medical updates in one seamless experience.
                                </p>
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center rounded-lg border border-emerald-300 bg-white/95 px-6 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
                                    >
                                        Patient Login
                                    </Link>
                                    <Link
                                        href="/doctors"
                                        className="inline-flex items-center rounded-lg bg-green-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-600"
                                    >
                                        Find Doctors Now
                                    </Link>
                                    <Link
                                        href="/news-articles"
                                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                                    >
                                        Explore Health News
                                    </Link>
                                </div>
                                <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                                    <div className="rounded-2xl border border-emerald-100 bg-white/80 p-3 text-center">
                                        <p className="text-2xl font-black text-gray-900">500+</p>
                                        <p className="text-xs text-gray-600">Verified Doctors</p>
                                    </div>
                                    <div className="rounded-2xl border border-emerald-100 bg-white/80 p-3 text-center">
                                        <p className="text-2xl font-black text-gray-900">24/7</p>
                                        <p className="text-xs text-gray-600">Booking Access</p>
                                    </div>
                                    <div className="rounded-2xl border border-emerald-100 bg-white/80 p-3 text-center">
                                        <p className="text-2xl font-black text-gray-900">4.9</p>
                                        <p className="text-xs text-gray-600">Patient Rating</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-md sm:col-span-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Today&apos;s care insight</p>
                                    <h2 className="mt-2 text-2xl font-bold text-gray-900">Tele-consultations now reduce waiting time by up to 42%</h2>
                                    <p className="mt-3 text-sm text-gray-600">NexClinic makes it easier for patients to get faster access to specialist guidance.</p>
                                </div>
                                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                                    <img src="/images/chat.png" alt="Online consultation" className="h-12 w-12" />
                                    <h3 className="mt-3 font-bold text-gray-900">Quick Consult</h3>
                                    <p className="mt-2 text-sm text-gray-600">Start secure doctor conversations without complex setup.</p>
                                </div>
                                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                                    <img src="/images/appointment.png" alt="Appointment confirmation" className="h-12 w-12" />
                                    <h3 className="mt-3 font-bold text-gray-900">Smart Reminders</h3>
                                    <p className="mt-2 text-sm text-gray-600">Never miss checkups with automatic booking alerts.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Why Patients Choose Us</p>
                            <h2 className="mt-2 text-3xl font-black text-gray-900">Built for trust, speed, and better care outcomes</h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {highlightCards.map((card) => (
                            <article key={card.title} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                                    <img src={card.icon} alt={card.title} className="h-8 w-8 object-contain" />
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-gray-900 group-hover:text-emerald-700">{card.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-600">{card.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-600 to-green-500 p-8 text-white shadow-xl">
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                                <p className="text-xs uppercase tracking-wide text-emerald-100">Step 1</p>
                                <h3 className="mt-2 text-xl font-bold">Search Specialist</h3>
                                <p className="mt-2 text-sm text-emerald-50">Filter by expertise, location, and availability in seconds.</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                                <p className="text-xs uppercase tracking-wide text-emerald-100">Step 2</p>
                                <h3 className="mt-2 text-xl font-bold">Book Instantly</h3>
                                <p className="mt-2 text-sm text-emerald-50">Pick a convenient slot and receive immediate confirmation.</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                                <p className="text-xs uppercase tracking-wide text-emerald-100">Step 3</p>
                                <h3 className="mt-2 text-xl font-bold">Get Ongoing Care</h3>
                                <p className="mt-2 text-sm text-emerald-50">Track follow-ups and continue your treatment journey confidently.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Health Desk</p>
                            <h2 className="mt-2 text-3xl font-black text-gray-900">Latest Health News & Articles</h2>
                        </div>
                        <Link
                            href="/news-articles"
                            className="inline-flex items-center rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-900"
                        >
                            See All Articles
                        </Link>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <article className="relative overflow-hidden rounded-3xl shadow-lg">
                            <img className="h-[340px] w-full object-cover" src="/images/doc2.jpg" alt="Top health story" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            <div className="absolute bottom-0 p-6 text-white">
                                <p className="text-xs uppercase tracking-wide text-emerald-200">Featured Report</p>
                                <h3 className="mt-2 text-2xl font-extrabold">New Treatment for Brain Tumor Shows Encouraging Trial Results</h3>
                                <p className="mt-2 text-sm text-gray-100">California, USA</p>
                            </div>
                        </article>

                        <div className="space-y-4">
                            {quickStories.map((story) => (
                                <article key={story.title} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                                    <img className="h-24 w-28 rounded-xl object-cover" src={story.image} alt={story.title} />
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">{story.title}</h3>
                                        <p className="mt-1 text-xs font-medium text-emerald-700">{story.location}</p>
                                        <p className="mt-2 text-sm text-gray-600">{story.summary}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto mb-12 max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ready to Begin?</p>
                                <h2 className="mt-2 text-3xl font-black text-gray-900">Find a specialist and book your first appointment today</h2>
                                <p className="mt-2 text-sm text-gray-600">NexClinic helps you move from search to consultation without delays.</p>
                            </div>
                            <Link
                                href="/doctors"
                                className="inline-flex items-center justify-center rounded-lg bg-green-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-600"
                            >
                                Start Booking
                            </Link>
                        </div>
                    </div>
                </section>
      </main>
  );
}