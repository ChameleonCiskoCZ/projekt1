"use client"
import React, { useState, useEffect } from "react";
import { NotificationContext } from "./notificationContext";

type Notification = {
  message: string;
  type: "success" | "error";
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = (message: string, type: "success" | "error") => {
    setNotifications((prev) => [...prev, { message, type }]);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications((prev) => prev.slice(1));
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className={`p-4 mb-4 rounded-xl shadow-lg text-white ${
              notification.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
