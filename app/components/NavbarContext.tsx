"use client"
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface NavbarContextProps {
  isNavbarCollapsed: boolean;
  setIsNavbarCollapsed: (collapsed: boolean) => void;
}

const NavbarContext = createContext<NavbarContextProps | undefined>(undefined);

export const NavbarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {


  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);

  useEffect(() => {
    const storedState = sessionStorage.getItem("isNavbarCollapsed");
    if (storedState !== null) {
      console.log("Restoring navbar state from sessionStorage:", storedState);
      setIsNavbarCollapsed(JSON.parse(storedState));
    }
  }, []);
 /* const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(() => {
    const storedState = sessionStorage.getItem("isNavbarCollapsed");
    return storedState !== null ? JSON.parse(storedState) : false;
  });*/


  return (
    <NavbarContext.Provider value={{ isNavbarCollapsed, setIsNavbarCollapsed }}>
      {children}
    </NavbarContext.Provider>
  );
};

export const useNavbar = () => {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error("useNavbar must be used within a NavbarProvider");
  }
  return context;
};
