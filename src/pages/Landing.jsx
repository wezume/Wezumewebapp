import Hero from "../components/landing/Hero";
import Video from "../components/landing/Video";
import Features from "../components/landing/Features";
import PlacementWall from "../components/landing/PlacementWall";
import InstitutesRow from "../components/landing/InstitutesRow";
import WorkshopsRow from "../components/landing/WorkshopsRow";
import FAQ from "../components/landing/FAQ";
import Footer from "../components/landing/Footer";
import ContactSection from "../components/landing/ContactSection";
import { AdminAuthProvider } from "../context/AdminAuthContext";

export default function Landing() {
  return (
    <AdminAuthProvider>
      <Hero />
      <Features />
      <PlacementWall />
      <InstitutesRow />
      <WorkshopsRow />
      <Video />
      <FAQ />
      <ContactSection />
      <Footer />
    </AdminAuthProvider>
  );
}
