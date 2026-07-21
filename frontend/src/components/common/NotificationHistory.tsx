"use client";

import { useState, useMemo } from "react";
import { useNotifications } from "@/contexts/NotificationContext";

export default function NotificationHistory() {
    const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, dndEnabled, toggleDnd } = useNotifications();
    const [activeTab, setActiveTab] = useState<string>("ALL");

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
    };

    const tabs = [
        { id: "ALL", label: "All" },
        { id: "SYSTEM_ALERT", label: "Alerts" },
        { id: "HOSPITAL_ANNOUNCEMENT", label: "Announcements" },
        { id: "APPOINTMENT_UPDATE", label: "Appointments" },
    ];

    const filteredNotifications = useMemo(() => {
        if (activeTab === "ALL") return notifications;
        return notifications.filter((n: any) => n.notification_type === activeTab);
    }, [notifications, activeTab]);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
                    <div className="mt-2 flex items-center">
                        <span className="text-sm text-slate-500 mr-3">Do Not Disturb</span>
                        <button 
                            onClick={toggleDnd}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${dndEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dndEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <button 
                        onClick={markAllAsRead}
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-sm font-semibold transition-colors h-fit"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === tab.id
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
            ) : filteredNotifications.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No notifications yet</h3>
                    <p className="text-slate-500 dark:text-slate-400">When you receive {activeTab !== 'ALL' ? tabs.find(t => t.id === activeTab)?.label.toLowerCase() : 'notifications'}, they will appear here.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredNotifications.map((notification: any) => (
                        <div key={notification.id} className={`p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col sm:flex-row gap-4 ${!notification.is_read ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                            <div className="shrink-0 pt-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!notification.is_read ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {notification.notification_type === 'HOSPITAL_ANNOUNCEMENT' ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                                    ) : notification.notification_type === 'SYSTEM_ALERT' ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    ) : notification.notification_type === 'APPOINTMENT_UPDATE' ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-base ${!notification.is_read ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-200'}`}>
                                        {notification.title}
                                    </h4>
                                    <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                                        {new Date(notification.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                                    {notification.message}
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-3">
                                    {notification.attachment && (
                                        <a href={notification.attachment} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                            <svg className="w-4 h-4 mr-1.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                            View Attachment
                                        </a>
                                    )}

                                    {notification.notification_type === 'APPOINTMENT_UPDATE' && notification.metadata?.appointment_id && (
                                        <button className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
                                            View Appointment
                                        </button>
                                    )}
                                    
                                    {!notification.is_read && (
                                        <button 
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
