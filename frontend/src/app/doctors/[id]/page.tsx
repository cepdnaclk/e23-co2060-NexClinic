// frontend/src/app/doctors/page.tsx
import DoctorCard from "@/components/doctors/DoctorCard";
import doctors from "@/data/doctors";

export default function DoctorsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Doctors cards</h1>
      <div className="flex flex-wrap gap-6">
        {doctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            id={doctor.id} 
            name={doctor.name}
            specialization={doctor.specialization}
            imageUrl={doctor.imageUrl}
          />
        ))}
      </div>
    </div>
  );
}
