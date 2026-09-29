import RoleBasedNavbar from "@/components/common/RoleBasedNavbar";
import DoctorSlots from '@/components/doctor/DoctorSlots';
import { cookies, headers } from "next/headers";
import Link from "next/link";
import GreenButton from "@/components/buttons/GreenButton";
import BlackButton from "@/components/buttons/BlackButton";
import DoctorProfileImage from "@/components/doctor/DoctorProfileImage";

type Doctor = {
	id: string;
	fullName: string;
	slmcId: string;
	photo: string;
	specialization: string;
	hospitals: string[];
	qualifications: string[];
	experience: string;
	contactNumber?: string;
	email?: string;
	chatFee: string;
	appointmentFee: string;
	availableForChat: boolean;
	nextAvailable: string;
	languages: string[];
};

async function fetchDoctor(id: string): Promise<Doctor | null> {
	const requestHeaders = await headers();
	const protocol = requestHeaders.get("x-forwarded-proto") || "http";
	const host = requestHeaders.get("host") || "localhost:3000";
	const origin = `${protocol}://${host}`;
	const cookieHeader = (await cookies())
		.getAll()
		.map((cookie) => `${cookie.name}=${cookie.value}`)
		.join("; ");

	try {
		const response = await fetch(`${origin}/api/doctor/directory/${id}/`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				...(cookieHeader ? { Cookie: cookieHeader } : {}),
			},
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		const payload = await response.json();
		return (payload?.doctor as Doctor) || null;
	} catch {
		return null;
	}
}

export default async function DoctorProfile({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const doctor = await fetchDoctor(id);
	const hasContactInfo = Boolean(doctor?.email || doctor?.contactNumber);
	
	const rawPhoto = doctor?.photo;
	const doctorPhoto = (!rawPhoto || rawPhoto === "null" || rawPhoto.trim() === "") ? undefined : rawPhoto;

	if (!doctor) {
		return <p className="p-6">Doctor not found</p>;
	}

	return (
		<>
			<div className="fixed w-full top-0 left-0 z-10">
				<RoleBasedNavbar />
			</div>
			{/* Outer background */}
			<div className="min-h-screen bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white py-8 px-4 pt-28">

				{/* Profile Header Card */}
				<div className="max-w-6xl mx-auto rounded-[2rem] border border-green-100 bg-white p-8 shadow-[0_18px_50px_rgba(16,185,129,0.08)] mb-6">
					<div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
						<div className="shrink-0 relative">
							<DoctorProfileImage
								src={doctorPhoto}
								alt={`Dr. ${doctor.fullName}`}
								className="w-[140px] h-[140px] rounded-full object-cover ring-4 ring-emerald-50 shadow-md"
							/>
							{doctor.availableForChat && (
								<div className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-white" title="Available for Chat"></div>
							)}
						</div>

						<div className="flex-1 text-center sm:text-left mt-2">
							<h1 className="text-3xl font-bold text-slate-900">Dr. {doctor.fullName}</h1>
							<div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
								<span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-3.5 py-1 text-sm font-semibold text-emerald-700">
									{doctor.specialization}
								</span>
								<span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3.5 py-1 text-sm font-semibold text-slate-700">
									{doctor.experience} of Experience
								</span>
								{doctor.slmcId && (
									<span className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3.5 py-1 text-sm font-medium text-slate-600">
										SLMC ID: {doctor.slmcId}
									</span>
								)}
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex flex-col gap-3 w-full sm:w-auto min-w-[200px] mt-4 sm:mt-2">
							{doctor.availableForChat ? (
								<Link
									href={`/user-self/chats?doctor=${doctor.id}`}
									className="w-full"
								>
									<GreenButton className="w-full rounded-full">
										Start Chat Now
									</GreenButton>
								</Link>
							) : (
								<button
									disabled
									className="w-full py-3 px-6 rounded-full font-semibold transition-colors bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
								>
									Currently Offline
								</button>
							)}
							<Link href={`/user-self/book-appointment?doctor=${doctor.id}`} className="w-full">
								<BlackButton className="w-full rounded-full">Book Appointment</BlackButton>
							</Link>
						</div>
					</div>
				</div>

				{/* Two Column Layout for Details */}
				<div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">

					{/* Left Column: Slots */}
					<div className="w-full lg:w-3/5">
						<div className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm mb-6">
							<h2 className="text-xl font-bold mb-6 text-slate-900">Available Appointment Slots</h2>
							<DoctorSlots doctorId={doctor.id} />
						</div>
					</div>

					{/* Right Column: Details */}
					<div className="w-full lg:w-2/5 flex flex-col gap-6">
						{/* Professional Details */}
						<div className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
							<h2 className="text-xl font-bold mb-4 text-slate-900">Professional Details</h2>
							<div className="flex w-full border-t border-slate-100 mb-4"></div>

							<div className="flex flex-col mb-5">
								<p className="text-sm font-semibold uppercase tracking-[0.1em] text-emerald-700 mb-2">Qualifications</p>
								<div className="flex flex-col gap-2">
									{doctor.qualifications.map((qual, index) => (
										<div key={index} className="flex items-start gap-2">
											<svg className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span className="text-slate-700">{qual}</span>
										</div>
									))}
								</div>
							</div>

							<div className="flex flex-col mb-5">
								<p className="text-sm font-semibold uppercase tracking-[0.1em] text-emerald-700 mb-2">Hospitals</p>
								<div className="flex flex-wrap gap-2">
									{doctor.hospitals.map((hospital, index) => (
										<span key={index} className="inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
											{hospital}
										</span>
									))}
								</div>
							</div>

							<div className="flex flex-col">
								<p className="text-sm font-semibold uppercase tracking-[0.1em] text-emerald-700 mb-2">Languages</p>
								<p className="text-slate-700 font-medium">{doctor.languages.join(", ")}</p>
							</div>
						</div>

						{/* Contact Information */}
						<div className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
							<h2 className="text-xl font-bold mb-4 text-slate-900">Contact Information</h2>
							<div className="flex w-full border-t border-slate-100 mb-4"></div>

							{hasContactInfo ? (
								<div className="flex flex-col gap-4">
									{doctor.email && (
										<div>
											<p className="text-sm font-semibold uppercase tracking-[0.1em] text-emerald-700 mb-1">Email Address</p>
											<a href={`mailto:${doctor.email}`} className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition-colors">
												<svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
												</svg>
												{doctor.email}
											</a>
										</div>
									)}
									{doctor.contactNumber && (
										<div>
											<p className="text-sm font-semibold uppercase tracking-[0.1em] text-emerald-700 mb-1">Contact Number</p>
											<a href={`tel:${doctor.contactNumber}`} className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition-colors">
												<svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
												</svg>
												{doctor.contactNumber}
											</a>
										</div>
									)}
								</div>
							) : (
								<p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
									Contact details are available for authorized users only.
								</p>
							)}
						</div>
					</div>

				</div>
			</div>
		</>
	);
}
