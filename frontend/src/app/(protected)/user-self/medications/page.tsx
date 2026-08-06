"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pill, Clock, Calendar, UserRound } from "lucide-react";
import { toast } from "sonner";

type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribing_doctor: string;
  created_at: string;
};

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [doctor, setDoctor] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const response = await fetch("/api/patient/medications/");
        if (response.ok) {
          const data = await response.json();
          setMedications(data.medications);
        }
      } catch (error) {
        console.error("Failed to fetch medications", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    void fetchMedications();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/patient/medications/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          dosage,
          frequency,
          duration,
          prescribing_doctor: doctor,
        }),
      });

      if (response.ok) {
        const newMedication = await response.json();
        setMedications((prev) => [newMedication, ...prev]);
        
        // Reset form
        setName("");
        setDosage("");
        setFrequency("");
        setDuration("");
        setDoctor("");
        toast?.success("Medication added successfully");
      } else {
        toast?.error("Failed to add medication");
      }
    } catch (error) {
      console.error("Error adding medication", error);
      toast?.error("Error adding medication");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMedication = async (id: string) => {
    try {
      const response = await fetch(`/api/patient/medications/${id}/`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setMedications((prev) => prev.filter((med) => med.id !== id));
        toast?.success("Medication removed");
      } else {
        toast?.error("Failed to remove medication");
      }
    } catch (error) {
      console.error("Error removing medication", error);
      toast?.error("Error removing medication");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8 sm:space-y-6">

        {/* Header Section */}
        <section className="relative overflow-hidden rounded-[2rem] border border-green-100 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 shadow-[0_20px_60px_rgba(16,185,129,0.14)] dark:shadow-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,173,133,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(0,119,88,0.12),transparent_40%)] dark:opacity-20" />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="rounded-2xl bg-green-100 dark:bg-green-950/50 p-4 text-green-600 dark:text-green-400">
                <Pill size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  My Medications
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                  Keep track of your current prescriptions. Add medications manually by reading your doctor's prescription.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Add Medication Form */}
          <div className="lg:col-span-1">
            <div className="rounded-[1.75rem] border border-green-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Add New Medication</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Medication Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amoxicillin"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:focus:border-green-500 dark:focus:ring-green-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 500mg"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:focus:border-green-500 dark:focus:ring-green-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Frequency</label>
                  <input
                    type="text"
                    required
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    placeholder="e.g. Twice a day after meals"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:focus:border-green-500 dark:focus:ring-green-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration (Optional)</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 7 days"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:focus:border-green-500 dark:focus:ring-green-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Prescribing Doctor (Optional)</label>
                  <input
                    type="text"
                    value={doctor}
                    onChange={(e) => setDoctor(e.target.value)}
                    placeholder="e.g. Dr. Smith"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:focus:border-green-500 dark:focus:ring-green-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700 active:scale-[0.98] disabled:opacity-70 dark:bg-green-600 dark:hover:bg-green-500"
                >
                  {isSubmitting ? (
                    "Adding..."
                  ) : (
                    <>
                      <Plus size={18} />
                      Add Medication
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Medications List */}
          <div className="lg:col-span-2">
            <div className="rounded-[1.75rem] border border-green-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm h-full">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Current Medications</h2>

              {medications.length === 0 ? (
                <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-center p-6">
                  <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 mb-4">
                    <Pill className="text-slate-400 dark:text-slate-500" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No medications added yet</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    Read your doctor's prescription and add your medications here to keep track of your doses.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medications.map((med) => (
                    <div key={med.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 transition-all hover:border-green-200 dark:hover:border-green-500/50 hover:shadow-md">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="rounded-xl bg-green-50 dark:bg-green-900/30 p-3 text-green-600 dark:text-green-400">
                            <Pill size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{med.name}</h3>
                              <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {med.dosage}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-2">
                                <Clock size={14} className="text-slate-400 dark:text-slate-500" />
                                {med.frequency}
                              </div>
                              {med.duration && (
                                <div className="flex items-center gap-2">
                                  <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                                  {med.duration}
                                </div>
                              )}
                              {med.prescribing_doctor && (
                                <div className="flex items-center gap-2">
                                  <UserRound size={14} className="text-slate-400 dark:text-slate-500" />
                                  Prescribed by: {med.prescribing_doctor}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => removeMedication(med.id)}
                          className="rounded-lg p-2 text-slate-400 dark:text-slate-500 transition hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400"
                          aria-label="Remove medication"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
