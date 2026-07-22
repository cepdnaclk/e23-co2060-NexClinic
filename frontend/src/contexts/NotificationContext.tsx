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
            if (!token) return;

            const res = await fetch('http://localhost:8000/api/notifications/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                const fetchedNotifications = data.results || data; // Handle pagination if any
                setNotifications(fetchedNotifications);
                setUnreadCount(fetchedNotifications.filter((n: Notification) => !n.is_read).length);
            }

            const prefRes = await fetch('http://localhost:8000/api/notifications/preferences/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
        fetchNotifications();

        const token = localStorage.getItem('authToken');
        if (!token) return;

        // Establish WebSocket connection
        const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);

        ws.onmessage = (event) => {
            try {
                const newNotification = JSON.parse(event.data);
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
            } catch (err) {
                console.error("Error parsing websocket message", err);
            }
        };

        ws.onclose = () => {
            console.log("Notification WebSocket closed");
        };

        return () => {
            ws.close();
        };
    }, [fetchNotifications]);

    const toggleDnd = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const newDndState = !dndEnabled;
            setDndEnabled(newDndState); // Optimistic UI update
            
            await fetch(`http://localhost:8000/api/notifications/preferences/`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ dnd_enabled: newDndState })
            });
        } catch (err) {
            console.error("Failed to toggle DND", err);
            setDndEnabled(!dndEnabled); // Revert on error
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('authToken');
            await fetch(`http://localhost:8000/api/notifications/${id}/mark_read/`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('authToken');
            await fetch(`http://localhost:8000/api/notifications/mark_all_read/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
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
