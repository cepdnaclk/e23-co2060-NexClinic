import RoleBasedNavbar from "@/components/common/RoleBasedNavbar";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import BlackButton from "@/components/buttons/BlackButton";

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

	if (!doctor) {
		return <p className="p-6">Doctor not found</p>;
	}

	return (
		<>
			<div className="fixed w-full top-0 left-0 z-10">
				<RoleBasedNavbar />
			</div>
			{/* Outer background */}
			<div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 pt-24">

				{/* Profile Header Card */}
				<div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-4">
					<div className="flex flex-col sm:flex-row gap-6 items-center">
						<img
							src={doctor.photo || "/images/user.png"}
							alt={doctor.fullName}
							className="w-[140px] h-[140px] rounded-full object-cover"
						/>

						<div className="flex-1 text-center sm:text-left">
							<h1 className="text-3xl font-bold text-gray-800 dark:text-white">{doctor.fullName}</h1>
							<div className="flex items-center justify-center sm:justify-start rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-green-600 dark:text-green-300 font-semibold text-md w-max mt-2 mx-auto sm:mx-0">
								{doctor.specialization}
							</div>
							<p className="text-gray-600 dark:text-gray-400 text-sm mt-2">{`SLMC ID: ${doctor.slmcId}`}</p>
							<p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{doctor.experience} of Experience</p>
							{doctor.availableForChat && (
								<span className="inline-block mt-2 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
									Available for Chat
								</span>
							)}
						</div>

						{/* Action Buttons */}
						<div className="flex flex-col gap-3 w-full sm:w-auto min-w-[200px]">
							<button
								disabled={!doctor.availableForChat}
								className={`py-3 px-6 rounded-lg font-semibold transition-colors ${doctor.availableForChat
									? 'bg-green-500 hover:bg-green-600 text-white'
									: 'bg-gray-300 text-gray-500 cursor-not-allowed'
									}`}
							>
								{doctor.availableForChat ? 'Start Chat Now' : 'Currently Offline'}
							</button>
							<Link href={`/user-self/book-appointment?doctor=${doctor.id}`} className="w-full">
								<BlackButton className="w-full">Book Appointment</BlackButton>
							</Link>
						</div>
					</div>
				</div>

				{/* Consultation Fees Card */}
				<div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-4">
					<h2 className="text-2xl font-bold mb-4 text-green-500 dark:text-green-400">Consultation Fees</h2>
					<div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>
					<div className="grid md:grid-cols-2 gap-6">
						<div className="flex flex-col">
							<p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Online Chat Session:</p>
							<p className="text-2xl font-bold text-green-600 dark:text-green-400">{doctor.chatFee}</p>
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quick online advice for minor concerns</p>
						</div>
						<div className="flex flex-col">
							<p className="font-bold text-gray-800 dark:text-gray-200 mb-2">In-Person Appointment:</p>
							<p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{doctor.appointmentFee}</p>
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Full consultation and examination</p>
						</div>
					</div>
					<div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
						<p className="text-gray-600 dark:text-gray-300 text-sm">
							<span className="font-semibold">Next Available Slot:</span> {doctor.nextAvailable}
						</p>
					</div>
				</div>

				{/* Two Column Layout for Details */}
				<div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-4">

					{/* Professional Details */}
					<div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
						<h2 className="text-2xl font-bold mb-4 text-green-500 dark:text-green-400">Professional Details</h2>
						<div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

						<div className="flex flex-col my-4 text-gray-600 dark:text-gray-400">
							<p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Qualifications:</p>
							<ul className="flex flex-col list-disc pl-6 gap-2">
								{doctor.qualifications.map((qual, index) => (
									<li key={index}>{qual}</li>
								))}
							</ul>
						</div>

						<div className="flex flex-col my-4 text-gray-600 dark:text-gray-400">
							<p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Currently Practicing Hospitals:</p>
							<ul className="flex flex-col list-disc pl-6 gap-2">
								{doctor.hospitals.map((hospital, index) => (
									<li key={index}>{hospital}</li>
								))}
							</ul>
						</div>

						<div className="flex flex-col my-4 text-gray-600 dark:text-gray-400">
							<p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Languages Spoken:</p>
							<p>{doctor.languages.join(", ")}</p>
						</div>
					</div>

					{/* Personal Information */}
					<div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
						<h2 className="text-2xl font-bold mb-4 text-green-500 dark:text-green-400">Contact Information</h2>
						<div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

						{hasContactInfo ? (
							<>
								<div className="flex flex-col mb-4 text-gray-600 dark:text-gray-400">
									<p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Email Address:</p>
									<div className="flex items-center">
										<img src="/images/at.png" className="w-4 h-4 inline mr-2" alt="Email Icon" />
										<p>{doctor.email}</p>
									</div>
								</div>

								{/* <div className="flex flex-col mb-4 text-gray-600 dark:text-gray-400">
									<p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Mobile Number:</p>
									<div className="flex items-center">
										<img src="/images/phone.png" className="w-4 h-4 inline mr-2" alt="Phone Icon" />
										<p>{doctor.contactNumber}</p>
									</div>
								</div> */}
							</>
						) : (
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Contact details are available for authorized users only.
							</p>
						)}
					</div>

				</div>
			</div>
		</>
	);
}
