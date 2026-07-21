"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Megaphone, AlertCircle, FileText, BarChart3, Clock } from "lucide-react";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  message: string;
  attachment: string | null;
  target_specialization: string | null;
  is_draft: boolean;
  created_at: string;
  read_count: number;
  total_count: number;
}

export default function AnnouncementsDashboard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/notifications/hospital");
      if (!res.ok) {
        throw new Error("Failed to fetch announcements");
      }
      const data = await res.json();
      setAnnouncements(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load announcements");
    } finally {
      setIsLoading(false);
    }
  };

  const getAttachmentUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    return `${baseUrl}${path}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-emerald-600 to-emerald-800 p-8 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Announcements Center</h1>
          <p className="text-emerald-100 max-w-xl">
            Broadcast updates, manage campaigns, and track engagement across your medical staff.
          </p>
        </div>
        <Link
          href="/hospital/announcements/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 hover:bg-emerald-50 font-medium rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Announcement
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Broadcasts</p>
            <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            Recent Campaigns
          </h2>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Megaphone className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No announcements yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Start communicating with your staff by sending your first broadcast announcement.
            </p>
            <Link
              href="/hospital/announcements/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Announcement
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900">{announcement.title}</h3>
                    {announcement.target_specialization ? (
                      <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                        {announcement.target_specialization} Only
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                        All Staff
                      </span>
                    )}
                    {announcement.is_draft && (
                      <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Draft
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed whitespace-pre-wrap">
                    {announcement.message}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {format(new Date(announcement.created_at), "MMM d, yyyy • h:mm a")}
                    </span>
                    {announcement.attachment && (
                      <a 
                        href={getAttachmentUrl(announcement.attachment)} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        View Attachment
                      </a>
                    )}
                  </div>
                </div>

                <div className="md:w-64 w-full flex-shrink-0 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
                    Engagement
                    <span className="text-emerald-600 font-bold">
                      {announcement.total_count > 0 
                        ? Math.round((announcement.read_count / announcement.total_count) * 100) 
                        : 0}%
                    </span>
                  </div>
                  
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div 
                      className="h-full bg-emerald-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${announcement.total_count > 0 ? (announcement.read_count / announcement.total_count) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>{announcement.read_count} read</span>
                    <span>{announcement.total_count} sent</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
