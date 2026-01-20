import Image from "next/image";
import Link from "next/link";

interface DoctorCardProps {
  id?: string; 
  name: string;
  specialization: string;
  imageUrl: string;
}

export default function DoctorCard({ id, name, specialization, imageUrl }: DoctorCardProps) {
  return (
    <div className="border p-4 rounded-lg shadow-md w-64">
      <Image
        src={imageUrl}
        alt={name}
        width={200}
        height={200}
        className="rounded-full object-cover mb-4"
      />
      <h2 className="text-xl font-bold">{name}</h2>
      <p className="text-gray-600">{specialization}</p>
      {id && (
        <Link href={`/doctors/${id}`} className="text-green-600 mt-2 block">
          View Profile
        </Link>
      )}
    </div>
  );
}
