import React from "react";

type NotificationContextType = {
  notify: (message: string, type: "success" | "error") => void;
};

export const NotificationContext = React.createContext<NotificationContextType>(
  {
    notify: () => {},
  }
);
