export interface Appointment {
    id: string;
    slotId: string;
    doctorId: string;
    doctorName: string;
    hospital: string;
    date: string;
    time: string;
    reason: string;
    status: string;
    requestedAt: string;
    category: "request" | "upcoming" | "previous";
}
