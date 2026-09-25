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
		<div className={`flex items-center justify-center bg-emerald-50 text-emerald-500 ${className}`}>
			<User className="h-16 w-16" />
		</div>
	);
}
