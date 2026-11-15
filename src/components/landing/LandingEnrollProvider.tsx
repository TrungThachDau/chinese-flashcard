"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { EnrollModal } from "./EnrollModal";

interface LandingEnrollContextValue {
  openEnroll: (courseTitle?: string) => void;
  selectedCourseTitle?: string;
}

const LandingEnrollContext = createContext<LandingEnrollContextValue | null>(null);

export function useLandingEnroll() {
  const context = useContext(LandingEnrollContext);
  if (!context) {
    throw new Error("useLandingEnroll must be used within LandingEnrollProvider");
  }
  return context;
}

export function LandingEnrollProvider({ children }: { children: ReactNode }) {
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string>();

  const openEnroll = (courseTitle?: string) => {
    setSelectedCourseTitle(courseTitle);
    setIsEnrollModalOpen(true);
  };

  const closeEnroll = () => {
    setIsEnrollModalOpen(false);
    setSelectedCourseTitle(undefined);
  };

  return (
    <LandingEnrollContext.Provider value={{ openEnroll, selectedCourseTitle }}>
      {children}
      <EnrollModal
        isOpen={isEnrollModalOpen}
        onClose={closeEnroll}
        selectedCourseTitle={selectedCourseTitle}
      />
    </LandingEnrollContext.Provider>
  );
}