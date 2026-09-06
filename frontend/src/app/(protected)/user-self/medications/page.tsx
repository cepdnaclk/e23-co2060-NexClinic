"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pill, Clock, Calendar, UserRound, CheckCircle2, Circle, List, CalendarCheck, BellRing, X, Power, CalendarDays, Building2 } from "lucide-react";
import { toast } from "sonner";

type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribing_doctor: string;
  hospital?: string;
  created_at: string;
  is_prescription?: boolean;
};

type ScheduleTime = {
  time: string;
  days: number[];
  is_active: boolean;
};

type Reminder = {
  id: number;
  medicine_name: string;
  dosage: string;
  start_date: string;
  end_date: string | null;
  schedule_times: ScheduleTime[];
  is_active: boolean;
};

type MedLog = {
  id: number;
  reminder: Reminder;
  scheduled_for: string;
  status: "PENDING" | "TAKEN" | "MISSED" | "SKIPPED";
  taken_at: string | null;
};

const WEEKDAYS = [
  { label: 'Mo', val: 0 },
  { label: 'Tu', val: 1 },
  { label: 'We', val: 2 },
  { label: 'Th', val: 3 },
  { label: 'Fr', val: 4 },
  { label: 'Sa', val: 5 },
  { label: 'Su', val: 6 }
];

export default function MedicationsPage() {
  const [activeTab, setActiveTab] = useState<"library" | "tracker">("library");

  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedLog[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Library Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [doctor, setDoctor] = useState("");

  // Reminder Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [reminderTimes, setReminderTimes] = useState<string[]>(["08:00"]);
  const [durationDays, setDurationDays] = useState<number | "">("");
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [intervalHours, setIntervalHours] = useState<number | null>(null);
  const [intervalStartTime, setIntervalStartTime] = useState<string>("08:00");
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const fetchMedications = async () => {
    try {
      const response = await fetch("/api/patient/medications/");
      if (response.ok) {
        const data = await response.json();
        setMedications(data.medications);
      }
    } catch (error) {
      console.error("Failed to fetch medications", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/patient/logs/");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await fetch("/api/patient/reminders/");
      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders);
      }
    } catch (error) {
      console.error("Failed to fetch reminders", error);
    }
  };

  useEffect(() => {
    Promise.all([fetchMedications(), fetchLogs(), fetchReminders()]).finally(() => {
      setIsLoading(false);
    });
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
          name, dosage, frequency, duration, prescribing_doctor: doctor,
        }),
      });

      if (response.ok) {
        const newMedication = await response.json();
        setMedications((prev) => [newMedication, ...prev]);
        setName(""); setDosage(""); setFrequency(""); setDuration(""); setDoctor("");
        toast.success("Medication added successfully");
      } else {
        toast.error("Failed to add medication");
      }
    } catch (error) {
      toast.error("Error adding medication");
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
        toast.success("Medication removed");
      } else {
        toast.error("Failed to remove medication");
      }
    } catch (error) {
      toast.error("Error removing medication");
    }
  };

  const handleCreateReminder = async () => {
    if (!selectedMed) return;
    setIsSubmittingReminder(true);
    try {
      let end_date = null;
      if (durationDays && durationDays > 0) {
        const d = new Date();
        d.setDate(d.getDate() + Number(durationDays));
        end_date = d.toISOString().split("T")[0];
      }

      const scheduleTimesPayload = reminderTimes.filter(t => t.trim() !== "").map(t => ({
        time: t,
        days: selectedDays,
        is_active: true
      }));

      const payload: any = {
        medicine_name: selectedMed.name,
        dosage: selectedMed.dosage,
        start_date: new Date().toISOString().split("T")[0],
        end_date: end_date,
        schedule_times: scheduleTimesPayload,
        is_active: true,
      };

      if (selectedMed.is_prescription) {
        payload.prescription = selectedMed.id.replace("prescription_", "");
      } else {
        payload.self_medication = selectedMed.id;
      }

      const response = await fetch("/api/patient/reminders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Reminder added to Tracker!");
        setIsReminderModalOpen(false);
        fetchLogs();
        fetchReminders();
      } else {
        toast.error("Failed to setup reminder");
      }
    } catch (error) {
      toast.error("Error setting up reminder");
    } finally {
      setIsSubmittingReminder(false);
    }
  };

  const toggleLogStatus = async (logId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "TAKEN" ? "PENDING" : "TAKEN";
      const payload: any = { status: newStatus };
      if (newStatus === "PENDING") {
        payload.taken_at = null;
      }

      const response = await fetch(`/api/patient/logs/${logId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const updatedLog = await response.json();
        setLogs(prev => prev.map(log => log.id === logId ? updatedLog : log));
        toast.success(newStatus === "TAKEN" ? "Marked as taken!" : "Unmarked as taken");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const toggleReminderTime = async (reminder: Reminder, timeIdx: number) => {
    try {
      const newSchedule = [...reminder.schedule_times];
      newSchedule[timeIdx] = {
        ...newSchedule[timeIdx],
        is_active: !newSchedule[timeIdx].is_active
      };

      const response = await fetch(`/api/patient/reminders/${reminder.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule_times: newSchedule }),
      });

      if (response.ok) {
        const updatedReminder = await response.json();
        setReminders(prev => prev.map(r => r.id === reminder.id ? updatedReminder : r));
        fetchLogs(); // refresh logs as schedule changed
        toast.success("Reminder updated");
      }
    } catch (error) {
      toast.error("Failed to update reminder");
    }
  };

  const deleteReminder = async (id: number) => {
    try {
      const response = await fetch(`/api/patient/reminders/${id}/`, {
        method: "DELETE",
      });
      if (response.ok) {
        setReminders(prev => prev.filter(r => r.id !== id));
        fetchLogs(); // refresh logs
        toast.success("Reminder removed");
      }
    } catch (error) {
      toast.error("Failed to remove reminder");
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleDaySelection = (dayVal: number) => {
    if (selectedDays.includes(dayVal)) {
      setSelectedDays(selectedDays.filter(d => d !== dayVal));
    } else {
      setSelectedDays([...selectedDays, dayVal].sort());
    }
  };

  const generateIntervalTimes = (start: string, interval: number): string[] => {
    if (!start || isNaN(interval) || interval <= 0) return [start || "08:00"];
    const times: string[] = [];
    const [startH, startM] = start.split(":").map(Number);
    
    const count = Math.floor(24 / interval);
    for (let i = 0; i < count; i++) {
      const h = (startH + (i * interval)) % 24;
      times.push(`${h.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`);
    }
    return times.length > 0 ? times : [start];
  };

  const parseFrequency = (frequency: string): { times: string[], interval?: number } => {
    if (!frequency) return { times: ["08:00"] };
    const freq = frequency.toLowerCase();
    
    const intervalMatch = freq.match(/every\s+(\d+)\s*(hour|hr|h)s?/);
    if (intervalMatch) {
      const interval = parseInt(intervalMatch[1]);
      if (interval > 0 && interval <= 24) {
        return { times: generateIntervalTimes("08:00", interval), interval };
      }
    }
    
    if (freq.includes("four") || freq.includes("4")) {
      return { times: ["08:00", "12:00", "16:00", "20:00"] };
    } else if (freq.includes("thrice") || freq.includes("three") || freq.includes("3")) {
      return { times: ["08:00", "14:00", "20:00"] };
    } else if (freq.includes("twice") || freq.includes("two") || freq.includes("2")) {
      return { times: ["08:00", "20:00"] };
    }
    
    return { times: ["08:00"] };
  };

  const openReminderModal = (med: Medication) => {
    setSelectedMed(med);
    const parsed = parseFrequency(med.frequency);
    setReminderTimes(parsed.times);
    
    if (parsed.interval) {
      setIntervalHours(parsed.interval);
      setIntervalStartTime("08:00");
    } else {
      setIntervalHours(null);
      setIntervalStartTime("08:00");
    }

    // Auto-fill duration and selected days
    setDurationDays("");
    let initialSelectedDays = [0, 1, 2, 3, 4, 5, 6];

    if (med.duration) {
      const num = parseInt(med.duration);
      if (!isNaN(num) && num > 0) {
        setDurationDays(num);
        // If duration is less than a week, only select those specific days
        if (num < 7) {
          const startDate = med.created_at ? new Date(med.created_at) : new Date();
          // Map JS getDay() (0=Su, 1=Mo) to our WEEKDAYS val (0=Mo, 6=Su)
          const startDayVal = (startDate.getDay() + 6) % 7;
          
          initialSelectedDays = [];
          for (let i = 0; i < num; i++) {
            const dayVal = (startDayVal + i) % 7;
            if (!initialSelectedDays.includes(dayVal)) {
              initialSelectedDays.push(dayVal);
            }
          }
          initialSelectedDays.sort();
        }
      }
    }

    setSelectedDays(initialSelectedDays);
    setIsReminderModalOpen(true);
  };

  const isReminderExpired = (reminder: Reminder) => {
    if (!reminder.end_date) return false;
    const end = new Date(reminder.end_date);
    end.setHours(23, 59, 59, 999);
    return end < new Date();
  };

  const groupedMedications = [...medications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .reduce((acc, med) => {
      const date = new Date(med.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(med);
      return acc;
    }, {} as Record<string, Medication[]>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8 sm:space-y-6">

        {/* Header Section */}
        <section className="relative overflow-hidden rounded-[2rem] border border-green-100 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 shadow-[0_20px_60px_rgba(16,185,129,0.14)] dark:shadow-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,173,133,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(0,119,88,0.12),transparent_40%)] dark:opacity-20" />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-green-100 dark:bg-green-950/50 p-4 text-green-600 dark:text-green-400">
                  <Pill size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    Medications
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                    Manage your prescriptions and track your daily doses.
                  </p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex rounded-xl bg-slate-100/80 dark:bg-slate-800/80 p-1 backdrop-blur-sm">
                <button
                  onClick={() => setActiveTab("library")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${activeTab === "library"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                  <List size={16} />
                  Library
                </button>
                <button
                  onClick={() => setActiveTab("tracker")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${activeTab === "tracker"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                  <CalendarCheck size={16} />
                  Daily Tracker
                </button>
              </div>
            </div>
          </div>
        </section>

        {activeTab === "library" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Add Medication Form */}
            <div className="lg:col-span-1">
              <div className="rounded-[1.75rem] border border-green-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Add New Medication</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Medication Name</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amoxicillin" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Dosage</label>
                    <input type="text" required value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 500mg" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Frequency</label>
                    <input type="text" required value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. Twice a day after meals" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration (Optional)</label>
                    <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 7 days" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Prescribing Doctor (Optional)</label>
                    <input type="text" value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="e.g. Dr. Smith" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700 active:scale-[0.98] disabled:opacity-70">
                    {isSubmitting ? "Adding..." : <><Plus size={18} /> Add Medication</>}
                  </button>
                </form>
              </div>
            </div>

            {/* Medications List */}
            <div className="lg:col-span-2">
              <div className="rounded-[1.75rem] border border-green-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm h-full">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Received Medications</h2>

                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>)}
                  </div>
                ) : medications.length === 0 ? (
                  <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-center p-6">
                    <Pill className="text-slate-400 dark:text-slate-500 mb-4" size={32} />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No medications added yet</h3>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(groupedMedications).map(([date, meds]) => (
                      <div key={date} className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">{date}</h3>
                        {meds.map((med) => (
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
                                {med.is_prescription && (
                                  <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                    Official Prescription
                                  </span>
                                )}
                              </div>
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-slate-400" />
                                  {med.frequency}
                                </div>
                                {med.duration && (
                                  <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" />
                                    {med.duration}
                                  </div>
                                )}
                                {med.prescribing_doctor && (
                                  <div className="flex items-center gap-2">
                                    <UserRound size={14} className="text-slate-400" />
                                    {med.prescribing_doctor}
                                  </div>
                                )}
                                {med.hospital && (
                                  <div className="flex items-center gap-2">
                                    <Building2 size={14} className="text-slate-400" />
                                    {med.hospital}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {!med.is_prescription && (
                              <button
                                onClick={() => removeMedication(med.id)}
                                className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2 text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/40"
                                title="Remove medication"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => openReminderModal(med)}
                              className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm font-semibold text-green-600 dark:text-green-400 transition hover:bg-green-100 dark:hover:bg-green-900/40"
                            >
                              <BellRing size={16} />
                              Add to Tracker
                            </button>
                          </div>
                        </div>
                      </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "tracker" && (
          <div className="space-y-6">
            {/* Today's Schedule Card */}
            <div className="rounded-[1.75rem] border border-green-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Today's Schedule</h2>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">Check off your medications as you take them.</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-center p-8">
                  <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 mb-4">
                    <CalendarCheck className="text-slate-400 dark:text-slate-500" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No doses scheduled for today</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    Go to the Library tab and click "Add to Tracker" on a medication to set up daily reminders.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-center justify-between overflow-hidden rounded-2xl border p-5 transition-all ${log.status === "TAKEN"
                          ? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10"
                          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleLogStatus(log.id, log.status)}
                          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${log.status === "TAKEN"
                              ? "bg-green-500 text-white"
                              : "bg-slate-100 text-slate-400 hover:bg-green-100 hover:text-green-500 dark:bg-slate-700"
                            }`}
                        >
                          {log.status === "TAKEN" ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                        <div>
                          <h3 className={`text-lg font-bold ${log.status === "TAKEN" ? "text-slate-700 dark:text-slate-300 line-through" : "text-slate-900 dark:text-white"}`}>
                            {log.reminder.medicine_name} <span className="text-sm font-normal text-slate-500">({log.reminder.dosage})</span>
                          </h3>
                          <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                            <Clock size={14} />
                            Scheduled for {formatTime(log.scheduled_for)}
                          </p>
                        </div>
                      </div>

                      {log.status === "TAKEN" && log.taken_at && (
                        <div className="text-right text-sm text-green-600 dark:text-green-400 font-medium">
                          Taken at {formatTime(log.taken_at)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Reminders Management */}
            <div className="rounded-[1.75rem] border border-green-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Reminders</h2>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Turn specific reminder times on or off for your medications.</p>
              </div>

              {isLoading ? (
                <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}
                </div>
              ) : reminders.length === 0 ? (
                <div className="text-center p-6 text-slate-500">No active reminders.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reminders.map((reminder) => {
                    const isExpired = isReminderExpired(reminder);
                    return (
                      <div key={reminder.id} className={`rounded-2xl border p-5 ${isExpired ? 'border-red-100 bg-red-50/30 dark:border-red-900/30 dark:bg-red-900/10' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{reminder.medicine_name}</h3>
                              {isExpired && (
                                <span className="rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 px-2 py-0.5 text-xs font-bold">
                                  EXPIRED
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">{reminder.dosage}</p>
                            {reminder.end_date && (
                              <p className="text-xs text-slate-400 mt-1">Until {reminder.end_date}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteReminder(reminder.id)}
                            className="text-slate-400 hover:text-red-500 transition"
                            title="Delete reminder entirely"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          {reminder.schedule_times.map((schedule, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900 p-3">
                              <div className="flex items-center gap-3">
                                <Clock size={16} className={schedule.is_active ? 'text-green-500' : 'text-slate-400'} />
                                <span className={`font-semibold ${schedule.is_active ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 line-through'}`}>
                                  {schedule.time}
                                </span>
                                <div className="flex gap-1 ml-2">
                                  {WEEKDAYS.map(d => (
                                    <span key={d.val} className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full ${schedule.days.includes(d.val) ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 font-bold' : 'bg-slate-200 text-slate-400 dark:bg-slate-800'}`}>
                                      {d.label[0]}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => toggleReminderTime(reminder, idx)}
                                className={`p-1.5 rounded-lg transition-colors ${schedule.is_active
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400'
                                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400'
                                  }`}
                                title={schedule.is_active ? "Turn off this time" : "Turn on this time"}
                              >
                                <Power size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Reminder Setup Modal */}
      {isReminderModalOpen && selectedMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Setup Reminder</h3>
              <button onClick={() => setIsReminderModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">{selectedMed.name}</h4>
                <p className="text-sm text-slate-500">{selectedMed.dosage} • {selectedMed.frequency}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Duration (Days)</label>
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-slate-400" size={18} />
                  <input
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value ? parseInt(e.target.value) : "")}
                    placeholder="e.g. 7 (Leave empty for continuous)"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-4 py-2 text-sm outline-none transition focus:border-green-500 focus:ring-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Days of the Week</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.val}
                      onClick={() => toggleDaySelection(day.val)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${selectedDays.includes(day.val)
                          ? "bg-green-600 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Notification Times</label>
                
                {intervalHours && (
                  <div className="mb-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
                      Interval Schedule (Every {intervalHours} hours)
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Starting Time</label>
                        <input
                          type="time"
                          value={intervalStartTime}
                          onChange={(e) => {
                            setIntervalStartTime(e.target.value);
                            setReminderTimes(generateIntervalTimes(e.target.value, intervalHours));
                          }}
                          className="w-full rounded-lg border border-blue-200 dark:border-blue-700/50 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      Changing the starting time will automatically update the notification times below.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {reminderTimes.map((time, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const newTimes = [...reminderTimes];
                          newTimes[idx] = e.target.value;
                          setReminderTimes(newTimes);
                        }}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-4 py-2 text-sm outline-none transition focus:border-green-500 focus:ring-1"
                      />
                      {reminderTimes.length > 1 && (
                        <button onClick={() => setReminderTimes(reminderTimes.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setReminderTimes([...reminderTimes, "12:00"])}
                  className="mt-3 flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700"
                >
                  <Plus size={16} /> Add another time
                </button>
              </div>

              <button
                onClick={handleCreateReminder}
                disabled={isSubmittingReminder || reminderTimes.some(t => !t) || selectedDays.length === 0}
                className="w-full rounded-xl bg-green-600 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmittingReminder ? "Saving..." : "Save to Tracker"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
