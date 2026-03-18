import Image from "next/image";
import RoleBasedNavbar from "@/components/common/RoleBasedNavbar";

type Doctor = {
	id: string;
	fullName: string;
	slmcId: string;
	photo: string;
	specialization: string;
	hospitals: string[];
	qualifications: string[];
	experience: string;
	contactNumber: string;
	email: string;
	chatFee: string;
	appointmentFee: string;
	availableForChat: boolean;
	nextAvailable: string;
	languages: string[];
};

const doctors: Doctor[] = [
	{
		id: "1",
		fullName: "Dr. Nimal Perera",
		slmcId: "SLMC/12345",
		photo: "/images/male-doctor-profile-pic.jpg",
		specialization: "Cardiologist",
		hospitals: ["Asiri Hospital", "National Hospital Colombo"],
		qualifications: ["MBBS", "MD (Cardiology)"],
		experience: "12 years",
		contactNumber: "+94 77 123 4567",
		email: "nimal.perera@example.com",
		chatFee: "Rs. 500",
		appointmentFee: "Rs. 3,000",
		availableForChat: true,
		nextAvailable: "Today, 3:00 PM",
		languages: ["English", "Sinhala", "Tamil"],
	},
	{
		id: "2",
		fullName: "Dr. Amara Silva",
		slmcId: "SLMC/67890",
		photo: "/images/female-doctor-profile-pic.jpg",
		specialization: "Dermatologist",
		hospitals: ["Lanka Hospitals"],
		qualifications: ["MBBS", "Diploma in Dermatology"],
		experience: "8 years",
		contactNumber: "+94 71 987 6543",
		email: "amara.silva@example.com",
		chatFee: "Rs. 400",
		appointmentFee: "Rs. 2,500",
		availableForChat: false,
		nextAvailable: "Tomorrow, 10:00 AM",
		languages: ["English", "Sinhala"],
	},
	{
		id: "3",
		fullName: "Dr. Kamal Fernando",
		slmcId: "SLMC/34567",
		photo: "/images/male-doctor-profile-pic.jpg",
		specialization: "Pediatrician",
		hospitals: ["Nawaloka Hospital"],
		qualifications: ["MBBS", "DCH", "MD (Pediatrics)"],
		experience: "15 years",
		contactNumber: "+94 76 234 5678",
		email: "kamal.fernando@example.com",
		chatFee: "Rs. 600",
		appointmentFee: "Rs. 3,500",
		availableForChat: true,
		nextAvailable: "Today, 5:30 PM",
		languages: ["English", "Sinhala"],
	},
	{
		id: "4",
		fullName: "Dr. Rashmi Wijesinghe",
		slmcId: "SLMC/45678",
		photo: "/images/female-doctor-profile-pic.jpg",
		specialization: "Gynecologist",
		hospitals: ["Asiri Hospital"],
		qualifications: ["MBBS", "MD (Obstetrics & Gynecology)"],
		experience: "10 years",
		contactNumber: "+94 75 345 6789",
		email: "rashmi.wijesinghe@example.com",
		chatFee: "Rs. 500",
		appointmentFee: "Rs. 3,200",
		availableForChat: true,
		nextAvailable: "Today, 2:00 PM",
		languages: ["English", "Sinhala", "Tamil"],
	},
];

export default async function DoctorProfile({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const doctor = doctors.find((d) => d.id === id);

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
						<Image
							src={doctor.photo}
							alt={doctor.fullName}
							width={140}
							height={140}
							className="rounded-full object-cover"
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
									💬 Available for Chat
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
								{doctor.availableForChat ? '💬 Start Chat Now' : '💬 Currently Offline'}
							</button>
							<button className="py-3 px-6 rounded-lg font-semibold bg-gray-800 hover:bg-gray-900 text-white transition-colors">
								📅 Book Appointment
							</button>
						</div>
					</div>
				</div>

				{/* Consultation Fees Card */}
				<div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-4">
					<h2 className="text-2xl font-bold mb-4 text-green-500 dark:text-green-400">Consultation Fees</h2>
					<div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>
					<div className="grid md:grid-cols-2 gap-6">
						<div className="flex flex-col">
							<p className="font-bold text-gray-800 dark:text-gray-200 mb-2">💬 Online Chat Session:</p>
							<p className="text-2xl font-bold text-green-600 dark:text-green-400">{doctor.chatFee}</p>
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quick online advice for minor concerns</p>
						</div>
						<div className="flex flex-col">
							<p className="font-bold text-gray-800 dark:text-gray-200 mb-2">📅 In-Person Appointment:</p>
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

						<div className="flex flex-col mb-4 text-gray-600 dark:text-gray-400">
							<p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Email Address:</p>
							<div className="flex items-center">
								<img src="/images/at.png" className="w-4 h-4 inline mr-2" alt="Email Icon" />
								<p>{doctor.email}</p>
							</div>
						</div>

						<div className="flex flex-col mb-4 text-gray-600 dark:text-gray-400">
							<p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Mobile Number:</p>
							<div className="flex items-center">
								<img src="/images/phone.png" className="w-4 h-4 inline mr-2" alt="Phone Icon" />
								<p>{doctor.contactNumber}</p>
							</div>
						</div>
					</div>

				</div>
			</div>
		</>
	);
}
