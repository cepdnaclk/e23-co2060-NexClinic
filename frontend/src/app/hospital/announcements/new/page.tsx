"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GreenButton from "@/components/buttons/GreenButton";

interface Doctor {
    id: string; // The user ID or doctor profile ID. The API expects CustomUser IDs.
    user_id: string;
    first_name: string;
    last_name: string;
    specialization: string;
    email: string;
}

export default function NewAnnouncementPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [sendToAll, setSendToAll] = useState(true);
    const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const res = await fetch("/api/hospital/available-doctors", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    
                    if (data.doctors) {
                        const affiliatedDoctors = data.doctors.filter((d: any) => d.is_added);
                        const formattedDoctors = affiliatedDoctors.map((d: any) => ({
                            id: d.id,
                            user_id: d.user_id,
                            first_name: d.full_name?.split(" ")[0] || "Unknown",
                            last_name: d.full_name?.split(" ").slice(1).join(" ") || "",
                            specialization: d.specialization || "General",
                            email: d.email || ""
                        }));
                        setDoctors(formattedDoctors);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch doctors:", err);
            }
        };

        fetchDoctors();
    }, []);

    const handleDoctorSelect = (userId: string) => {
        if (!selectedDoctorIds.includes(userId)) {
            setSelectedDoctorIds([...selectedDoctorIds, userId]);
        }
        setSearchTerm("");
        setIsDropdownOpen(false);
    };

    const handleDoctorRemove = (userId: string) => {
        setSelectedDoctorIds(selectedDoctorIds.filter(id => id !== userId));
    };

    const filteredDoctors = doctors.filter(doctor => {
        if (selectedDoctorIds.includes(doctor.user_id)) return false;
        const searchLower = searchTerm.toLowerCase();
        return (
            doctor.first_name.toLowerCase().includes(searchLower) ||
            doctor.last_name.toLowerCase().includes(searchLower) ||
            doctor.specialization.toLowerCase().includes(searchLower) ||
            doctor.email.toLowerCase().includes(searchLower) ||
            doctor.user_id.toLowerCase().includes(searchLower)
        );
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachment(e.target.files[0]);
        } else {
            setAttachment(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("authToken");
            const formData = new FormData();
            formData.append("title", title);
            formData.append("message", message);
            formData.append("send_to_all", sendToAll ? "true" : "false");
            
            if (!sendToAll) {
                selectedDoctorIds.forEach(id => {
                    formData.append("recipient_ids", id);
                });
            }

            if (attachment) {
                formData.append("attachment", attachment);
            }

            const res = await fetch("/api/notifications/hospital/send_announcement/", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                setSuccess("Announcement dispatched successfully!");
                setTitle("");
                setMessage("");
                setAttachment(null);
                setSendToAll(true);
                setSelectedDoctorIds([]);
                setTimeout(() => {
                    router.push("/hospital/announcements");
                }, 2000);
            } else {
                const data = await res.json();
                setError(data.detail || "Failed to send announcement.");
            }
        } catch (err) {
            console.error("Submission error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">New Announcement</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Send notifications to doctors in your hospital.</p>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm font-medium border border-emerald-100">
                        {success}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                            placeholder="e.g., Weekly Staff Meeting Update"
                        />
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Message
                        </label>
                        <textarea
                            id="message"
                            required
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
                            placeholder="Type your announcement here..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Recipients
                        </label>
                        <div className="flex items-center space-x-6 mb-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    checked={sendToAll}
                                    onChange={() => setSendToAll(true)}
                                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                />
                                <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">All Doctors</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!sendToAll}
                                    onChange={() => setSendToAll(false)}
                                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                />
                                <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Specific Doctors</span>
                            </label>
                        </div>

                        {!sendToAll && (
                            <div className="relative mt-2">
                                {/* Selected Doctors Chips */}
                                {selectedDoctorIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3 border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50">
                                        {selectedDoctorIds.map(id => {
                                            const doctor = doctors.find(d => d.user_id === id);
                                            if (!doctor) return null;
                                            return (
                                                <div key={id} className="inline-flex items-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium py-1 px-3 rounded-full">
                                                    <span>Dr. {doctor.first_name} {doctor.last_name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDoctorRemove(id)}
                                                        className="ml-2 focus:outline-none hover:text-emerald-900 dark:hover:text-emerald-200"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                {/* Search Input */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setIsDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        placeholder="Search by name, specialization, or email..."
                                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors pr-10"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {filteredDoctors.length > 0 ? (
                                            <ul className="py-1">
                                                {filteredDoctors.map(doctor => (
                                                    <li
                                                        key={doctor.user_id}
                                                        onClick={() => handleDoctorSelect(doctor.user_id)}
                                                        className="cursor-pointer px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 flex flex-col transition-colors"
                                                    >
                                                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                            Dr. {doctor.first_name} {doctor.last_name}
                                                        </span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            {doctor.specialization} {doctor.email && `• ${doctor.email}`}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                                {doctors.length === 0 ? "Loading doctors..." : "No matching doctors found."}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Attachment (Optional)
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                    {attachment ? attachment.name : "PNG, JPG, PDF up to 10MB"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
                    >
                        Cancel
                    </button>
                    <GreenButton type="submit" className="px-6 py-2.5 opacity-100">
                        {isSubmitting ? "Sending..." : "Dispatch Announcement"}
                    </GreenButton>
                </div>
            </form>
        </div>
    );
}
