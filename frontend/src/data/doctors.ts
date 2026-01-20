// frontend/src/data/doctors.ts
export interface Doctor {
  id: string;       // internal route id
  slicId: string;   // SLIC ID
  name: string;
  specialization: string;
  imageUrl: string;
}

const doctors: Doctor[] = [
  {
    id: "1",
    slicId: "SLIC12345",
    name: "Dr. Amara Perera",
    specialization: "Cardiologist",
    imageUrl: "/images/female-doctor-profile-pic.jpg",
  },
  {
    id: "2",
    slicId: "SLIC67890",
    name: "Dr. Nimal Silva",
    specialization: "Dermatologist",
    imageUrl: "/images/male-doctor-profile-pic.jpg",
  },
];

export default doctors;
