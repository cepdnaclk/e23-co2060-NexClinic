"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import RoleBasedNavbar from "@/components/common/RoleBasedNavbar";

type Faq = { question: string; answer: string; category: string };

const faqs: Faq[] = [
  { category: "Appointments", question: "How do I book an appointment?", answer: "Open Find a doctor, choose a specialist, and select an available date and time. After you confirm the details, the appointment will appear in your dashboard." },
  { category: "Appointments", question: "Can I reschedule or cancel an appointment?", answer: "Yes. Open Appointments in your patient dashboard, select the booking, and use the available reschedule or cancel option. Availability and cancellation rules may vary by hospital." },
  { category: "Account", question: "How do I update my personal information?", answer: "Sign in, open your profile, and choose Edit profile. Keep your contact and medical details current so your care team has accurate information." },
  { category: "Account", question: "I forgot my password. What should I do?", answer: "Choose Forgot password on the sign-in page and enter the email linked to your account. We will guide you through securely setting a new password." },
  { category: "Consultations", question: "How do online consultations work?", answer: "For an online booking, join from your appointment details at the scheduled time. Use a stable connection and allow microphone and camera access before the consultation begins." },
  { category: "Privacy", question: "Is my health information secure?", answer: "NexClinic uses authenticated access and privacy-focused controls to protect your account and medical information. Never share your password or verification codes with anyone." },
  { category: "Payments", question: "Where can I find my payment details?", answer: "Payment and booking details are shown with the relevant appointment. If a payment appears incorrect, include the appointment reference when contacting support." },
  { category: "Doctors", question: "How are doctors verified?", answer: "Doctor profiles include professional and hospital information reviewed during onboarding. You can check a doctor's profile, specialty, and availability before booking." },
];

const categories = [
  { title: "Appointments", description: "Booking, rescheduling and cancellations", icon: CalendarIcon },
  { title: "Account", description: "Profile, sign-in and account settings", icon: UserIcon },
  { title: "Consultations", description: "Prepare for online and in-person care", icon: VideoIcon },
  { title: "Payments", description: "Charges, payment details and receipts", icon: CardIcon },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [sent, setSent] = useState(false);

  const visibleFaqs = useMemo(() => {
    const term = query.trim().toLowerCase();
    return faqs.filter((faq) => {
      const categoryMatches = activeCategory === "All" || faq.category === activeCategory;
      const queryMatches = !term || `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase().includes(term);
      return categoryMatches && queryMatches;
    });
  }, [activeCategory, query]);

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50"><RoleBasedNavbar /></header>

      <section className="relative overflow-hidden bg-slate-950 pt-28 pb-28 sm:pt-36 sm:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,197,94,0.20),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(20,184,166,0.16),transparent_35%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.15)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="absolute left-[8%] top-28 h-24 w-24 rounded-full border border-green-400/20" />
        <div className="absolute right-[7%] top-24 hidden h-32 w-32 rotate-12 rounded-[2rem] border border-white/10 bg-white/[0.03] lg:block" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.25fr_.75fr] lg:px-8">
          <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-green-300">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" /><span className="relative h-2 w-2 rounded-full bg-green-400" /></span> NexClinic support
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">Care feels easier when<br className="hidden sm:block" /> answers are <span className="bg-gradient-to-r from-green-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">close by.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base lg:mx-0">Search our support library or reach a real person. We’re here to keep every step of your NexClinic journey simple.</p>
          <label className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-white p-2 pl-5 shadow-2xl shadow-black/25 transition focus-within:-translate-y-0.5 focus-within:ring-4 focus-within:ring-green-400/20 lg:mx-0">
            <SearchIcon />
            <span className="sr-only">Search help articles</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400" placeholder="Search for appointments, payments, account help..." />
            <button type="button" onClick={() => document.getElementById("frequent-questions")?.scrollIntoView()} className="hidden rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 sm:block">Search</button>
          </label>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 lg:justify-start">
            <span>Popular:</span>
            {["Book a visit", "Reset password", "Online consult"].map((term) => <button key={term} onClick={() => setQuery(term)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300 transition hover:border-green-400/30 hover:bg-green-400/10 hover:text-green-200">{term}</button>)}
          </div>
          </div>
          <div className="relative mx-auto hidden w-full max-w-sm lg:block">
            <div className="absolute -inset-8 rounded-full bg-green-500/10 blur-3xl" />
            <div className="relative rotate-2 rounded-[2rem] border border-white/10 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-6">
                <div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-400 text-slate-950"><HeartIcon /></span><span className="rounded-full bg-green-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-300">Online now</span></div>
                <h2 className="mt-8 text-xl font-bold text-white">Support that cares</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">From your first booking to follow-up care, help is always one step away.</p>
                <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/5 p-4"><span className="text-2xl font-extrabold text-white">24/7</span><span className="mt-1 block text-[11px] text-slate-400">Help articles</span></div><div className="rounded-2xl bg-white/5 p-4"><span className="text-2xl font-extrabold text-white">&lt; 1 day</span><span className="mt-1 block text-[11px] text-slate-400">Typical reply</span></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ title, description, icon: Icon }) => (
            <button key={title} onClick={() => { setActiveCategory(title); document.getElementById("frequent-questions")?.scrollIntoView({ behavior: "smooth" }); }} className="group relative overflow-hidden rounded-[1.35rem] border border-white bg-white p-6 text-left shadow-xl shadow-slate-900/[0.07] transition duration-300 hover:-translate-y-1.5 hover:border-green-200 hover:shadow-2xl hover:shadow-green-900/10">
              <span className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-green-50 transition duration-300 group-hover:scale-[2.5]" />
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600 ring-1 ring-green-100 transition group-hover:bg-green-600 group-hover:text-white"><Icon /></span>
              <h2 className="mt-5 text-base font-bold">{title}</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-green-600">View help <ArrowIcon /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-green-100 bg-gradient-to-r from-green-50 via-white to-teal-50 px-6 py-9 sm:px-10">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[36px] border-white/70" />
          <div className="relative grid gap-8 sm:grid-cols-3">
            {[["01", "Search", "Find a quick answer in our support library."], ["02", "Try the guidance", "Follow clear steps designed around your care journey."], ["03", "Talk to us", "Connect with our team whenever you need more help."]].map(([number, title, copy], index) => (
              <div key={number} className="flex gap-4 sm:block">
                <div className="flex items-center gap-3"><span className="text-xs font-extrabold tracking-widest text-green-600">{number}</span>{index < 2 && <span className="hidden h-px flex-1 bg-gradient-to-r from-green-300 to-transparent sm:block" />}</div>
                <div><h3 className="mt-0 text-base font-bold sm:mt-5">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{copy}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="frequent-questions" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-green-600">Frequently asked questions</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Answers, right when you need them</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">Browse the most common questions from patients and doctors. Choose a topic to narrow the results.</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["All", ...categories.map((item) => item.title), "Privacy", "Doctors"].map((item) => (
                <button key={item} onClick={() => setActiveCategory(item)} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${activeCategory === item ? "border-green-600 bg-green-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-green-200 hover:text-green-700"}`}>{item}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {visibleFaqs.map((faq) => {
              const originalIndex = faqs.indexOf(faq);
              const isOpen = openFaq === originalIndex;
              return <div key={faq.question} className={`overflow-hidden rounded-2xl border bg-white transition ${isOpen ? "border-green-200 shadow-md shadow-green-900/5" : "border-slate-200"}`}>
                <button className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left sm:px-6" onClick={() => setOpenFaq(isOpen ? null : originalIndex)} aria-expanded={isOpen}>
                  <span><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-green-600">{faq.category}</span><span className="text-sm font-bold sm:text-base">{faq.question}</span></span>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition ${isOpen ? "rotate-45 bg-green-50 text-green-600" : ""}`}><PlusIcon /></span>
                </button>
                {isOpen && <p className="px-5 pb-5 text-sm leading-6 text-slate-600 sm:px-6 sm:pb-6">{faq.answer}</p>}
              </div>;
            })}
            {visibleFaqs.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-bold">No matching answers found</p><p className="mt-2 text-sm text-slate-500">Try another phrase or send our team a message below.</p></div>}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-[2rem] bg-gradient-to-br from-green-600 to-teal-700 p-7 text-white sm:p-10">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-green-100">Contact support</span>
            <h2 className="mt-3 text-3xl font-extrabold">Still need a hand?</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-green-50/90">Send us a message and include any booking reference that may help us understand your question.</p>
            <div className="mt-9 space-y-4">
              <a href="mailto:support@nexclinic.lk" className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 transition hover:bg-white/15"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><MailIcon /></span><span><span className="block text-xs text-green-100">Email us</span><span className="text-sm font-bold">support@nexclinic.lk</span></span></a>
              <a href="tel:+94112678900" className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 transition hover:bg-white/15"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><PhoneIcon /></span><span><span className="block text-xs text-green-100">Call support · Mon–Fri, 8am–6pm</span><span className="text-sm font-bold">+94 11 267 8900</span></span></a>
            </div>
          </div>

          <form onSubmit={submitMessage} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-7 sm:p-10">
            <h2 className="text-2xl font-extrabold">Send us a message</h2>
            <p className="mt-2 text-sm text-slate-500">We usually respond within one business day.</p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <Input label="Your name" name="name" placeholder="Full name" />
              <Input label="Email address" name="email" type="email" placeholder="you@example.com" />
              <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-slate-700">How can we help?</span><select name="topic" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"><option>Appointment support</option><option>Account and sign-in</option><option>Consultation issue</option><option>Payment question</option><option>Other</option></select></label>
              <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-slate-700">Message</span><textarea required name="message" rows={4} placeholder="Tell us what happened..." className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100" /></label>
            </div>
            {sent && <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">Thanks — your message has been prepared for the support team.</p>}
            <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-green-600">Send message <ArrowIcon /></button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><AlertIcon /></span>
          <div className="flex-1"><h2 className="font-bold text-slate-900">This service is not for medical emergencies</h2><p className="mt-1 text-sm leading-5 text-slate-600">If you or someone else needs urgent medical attention, contact your local emergency service or go to the nearest emergency department immediately.</p></div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold"><Image src="/images/logo-main.png" alt="NexClinic" width={28} height={28} /> NexClinic</Link>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} NexClinic Healthcare. All rights reserved.</p>
          <div className="flex gap-4 text-xs font-semibold text-slate-500"><Link href="/">Home</Link><Link href="/#faq">FAQ</Link><Link href="/doctors">Find a doctor</Link></div>
        </div>
      </footer>
    </main>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label><span className="mb-2 block text-xs font-bold text-slate-700">{label}</span><input required {...props} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100" /></label>; }
function SearchIcon() { return <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>; }
function CalendarIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>; }
function UserIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>; }
function VideoIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg>; }
function CardIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>; }
function ArrowIcon() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>; }
function PlusIcon() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>; }
function MailIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>; }
function PhoneIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>; }
function AlertIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>; }
function HeartIcon() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/><path d="M8 12h2l1-2 2 4 1-2h2"/></svg>; }
