"use client";

import { useState } from "react";
import { User } from "lucide-react";

interface DoctorProfileImageProps {
	src?: string;
	alt: string;
	className?: string;
}

export default function DoctorProfileImage({ src, alt, className = "" }: DoctorProfileImageProps) {
	const [imageError, setImageError] = useState(false);

	const isValidSrc = src && src !== "null" && src.trim() !== "";

	if (isValidSrc && !imageError) {
		return (
			<img
				src={src}
				alt={alt}
				className={className}
				onError={() => setImageError(true)}
			/>
		);
	}

	return (
		<div className={`flex h-28 w-28 sm:h-[140px] sm:w-[140px] items-center justify-center rounded-[1.5rem] bg-emerald-50 text-emerald-500 shadow-md ${className.replace(/w-\[140px\] h-\[140px\] rounded-full object-cover ring-4 ring-emerald-50 shadow-md/, '')}`}>
			<User className="h-12 w-12 sm:h-16 sm:w-16" />
		</div>
	);
}
