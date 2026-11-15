import { LandingNavbar } from "./LandingNavbar";
import { HeroSection } from "./HeroSection";
import { CourseCatalog } from "./CourseCatalog";
import { ProgressTrackingDemo } from "./ProgressTrackingDemo";
import { ToneTrainerSection } from "./ToneTrainerSection";
import { StudentTestimonials } from "./StudentTestimonials";
import { EnrollmentCTA } from "./EnrollmentCTA";
import { FaqSection } from "./FaqSection";
import { LandingFooter } from "./LandingFooter";
import { LandingEnrollProvider } from "./LandingEnrollProvider";

export const LandingPage = () => {
  return (
    <LandingEnrollProvider>
      <div className="min-h-screen bg-[#fff9f3] text-[#2d1b13] flex flex-col font-sans selection:bg-orange-200 selection:text-orange-900">
        {/* Top sticky playful header */}
        <LandingNavbar />

        {/* Main content sections */}
        <main className="flex-1">
          {/* 1. Hero Section */}
          <HeroSection />

          {/* 2. Course Catalog Preview with Claymorphism Cards */}
          <CourseCatalog />

          {/* 3. Interactive Progress Tracking Demo */}
          <ProgressTrackingDemo />

          {/* 4. Tone Trainer & Mandarin Pronunciation */}
          <ToneTrainerSection />

          {/* 5. Student Testimonials */}
          <StudentTestimonials />

          {/* 6. Enrollment CTA with confetti & instant trial */}
          <EnrollmentCTA />

          {/* 7. FAQ Section */}
          <FaqSection />
        </main>

        {/* Footer */}
        <LandingFooter />
      </div>
    </LandingEnrollProvider>
  );
};

