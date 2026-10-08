"use client";

import React, { useState } from "react";
import { LandingNavbar } from "./LandingNavbar";
import { HeroSection } from "./HeroSection";
import { CourseCatalog } from "./CourseCatalog";
import { ProgressTrackingDemo } from "./ProgressTrackingDemo";
import { ToneTrainerSection } from "./ToneTrainerSection";
import { StudentTestimonials } from "./StudentTestimonials";
import { EnrollmentCTA } from "./EnrollmentCTA";
import { FaqSection } from "./FaqSection";
import { LandingFooter } from "./LandingFooter";
import { EnrollModal } from "./EnrollModal";

export const LandingPage: React.FC = () => {
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string | undefined>(undefined);

  const handleOpenEnroll = (courseTitle?: string) => {
    setSelectedCourseTitle(courseTitle);
    setIsEnrollModalOpen(true);
  };

  const handleCloseEnroll = () => {
    setIsEnrollModalOpen(false);
    setSelectedCourseTitle(undefined);
  };

  const scrollToDemo = () => {
    const el = document.getElementById("progress-demo");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToCourses = () => {
    const el = document.getElementById("courses");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#fff9f3] text-[#2d1b13] flex flex-col font-sans selection:bg-orange-200 selection:text-orange-900">
      {/* Top sticky playful header */}
      <LandingNavbar onOpenEnroll={() => handleOpenEnroll()} />

      {/* Main content sections */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection
          onOpenEnroll={() => handleOpenEnroll()}
          onScrollToDemo={scrollToDemo}
          onScrollToCourses={scrollToCourses}
        />

        {/* 2. Course Catalog Preview with Claymorphism Cards */}
        <CourseCatalog onOpenEnroll={(title) => handleOpenEnroll(title)} />

        {/* 3. Interactive Progress Tracking Demo */}
        <ProgressTrackingDemo />

        {/* 4. Tone Trainer & Mandarin Pronunciation */}
        <ToneTrainerSection />

        {/* 5. Student Testimonials */}
        <StudentTestimonials />

        {/* 6. Enrollment CTA with confetti & instant trial */}
        <EnrollmentCTA initialCourse={selectedCourseTitle} />

        {/* 7. FAQ Section */}
        <FaqSection />
      </main>

      {/* Footer */}
      <LandingFooter />

      {/* Popup Enrollment Modal */}
      <EnrollModal
        isOpen={isEnrollModalOpen}
        onClose={handleCloseEnroll}
        selectedCourseTitle={selectedCourseTitle}
      />
    </div>
  );
};

