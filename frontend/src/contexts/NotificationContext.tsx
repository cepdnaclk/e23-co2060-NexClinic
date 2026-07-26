"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// We will use standard fetch to get the initial list and token
export interface Notification {
    id: string;
    title: string;
    message: string;
    notification_type: string;
    is_read: boolean;
    created_at: string;
    attachment?: string;
    action_url?: string;
    metadata?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    dndEnabled: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchNotifications: () => Promise<void>;
    toggleDnd: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [dndEnabled, setDndEnabled] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setIsLoading(false);
                return;
            }

            const res = await fetch('/api/notifications', {
                credentials: 'include',
                cache: 'no-store',
            });
            if (res.ok) {
                const data = await res.json();
                const fetchedNotifications = data.results || data; // Handle pagination if any
                setNotifications(fetchedNotifications);
                setUnreadCount(fetchedNotifications.filter((n: Notification) => !n.is_read).length);
            }

            const prefRes = await fetch('/api/notifications/preferences', {
                credentials: 'include',
                cache: 'no-store',
            });
            if (prefRes.ok) {
                const prefData = await prefRes.json();
                setDndEnabled(prefData.dnd_enabled);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let ws: WebSocket | null = null;
        let cancelled = false;

        const initializeNotifications = async () => {
            await fetchNotifications();
            if (cancelled) return;

            // The refresh-aware HTTP request above synchronizes localStorage
            // before the WebSocket is opened.
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const backendUrl =
                process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            const websocketBase = backendUrl.replace(/^http/, 'ws').replace(/\/$/, '');
            ws = new WebSocket(
                `${websocketBase}/ws/notifications/?token=${encodeURIComponent(token)}`,
            );

            ws.onmessage = (event) => {
                try {
                    const newNotification = JSON.parse(event.data);
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                } catch (err) {
                    console.error("Error parsing websocket message", err);
                }
            };
        };

        void initializeNotifications();

        return () => {
            cancelled = true;
            ws?.close();
        };
    }, [fetchNotifications]);

    const toggleDnd = async () => {
        try {
            const newDndState = !dndEnabled;
            setDndEnabled(newDndState); // Optimistic UI update
            
            const response = await fetch('/api/notifications/preferences', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dnd_enabled: newDndState })
            });
            if (!response.ok) throw new Error("Failed to update notification preferences");
        } catch (err) {
            console.error("Failed to toggle DND", err);
            setDndEnabled(!dndEnabled); // Revert on error
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}/mark-read`, {
                method: 'PATCH',
                credentials: 'include',
            });
            if (!response.ok) throw new Error("Failed to mark notification as read");
            
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                credentials: 'include',
            });
            if (!response.ok) throw new Error("Failed to mark all notifications as read");
            
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, isLoading, dndEnabled, markAsRead, markAllAsRead, fetchNotifications, toggleDnd }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
