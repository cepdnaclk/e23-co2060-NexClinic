import DoctorCard from "@/components/doctors/DoctorCard";

export default function DoctorsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Doctors Directory
      </h1>

      <div className="flex flex-wrap gap-6">
        <DoctorCard
          id="1"
          name="Dr. Amara Perera"
          specialization="Cardiologist"
          imageUrl="/images/male-doctor-profile-pic.jpg"
        />

        <DoctorCard
          id="2"
          name="Dr. Nimal Silva"
          specialization="Dermatologist"
          imageUrl="/images/female-doctor-profile-pic.jpg"
        />
      </div>
    </div>
  );
}
