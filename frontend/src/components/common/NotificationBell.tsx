"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotificationBell() {
    const pathname = usePathname();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await markAsRead(id);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors focus:outline-none"
                aria-label="Notifications"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden z-50 transform origin-top-right transition-all">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium">
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                No notifications yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {notifications.slice(0, 5).map((notification) => (
                                    <div key={notification.id} className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!notification.is_read ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm ${!notification.is_read ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-200'}`}>
                                                {notification.title}
                                            </h4>
                                            {!notification.is_read && (
                                                <button onClick={(e) => handleMarkAsRead(notification.id, e)} className="shrink-0 ml-2 text-slate-400 hover:text-emerald-600" title="Mark as read">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                                            {notification.attachment && (
                                                <a href={notification.attachment} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline flex items-center">
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                    Attachment
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-center">
                        <Link 
                            href={pathname.startsWith('/hospital') ? '/hospital/notifications' : pathname.startsWith('/doctor-self') ? '/doctor-self/notifications' : '/user-self/notifications'} 
                            onClick={() => setIsOpen(false)} 
                            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                        >
                            View all notifications &rarr;
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
