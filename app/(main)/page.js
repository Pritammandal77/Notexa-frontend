import Faqs from "@/components/home/Faqs";
import Hero from "@/components/home/Hero";
import PopularNotes from "@/components/home/PopularNotes";
import Working from "@/components/home/Working";
import TestimonialsSection from "@/components/ui/AnimatedTestimonials";

export default function Home() {
  return (
    <>
      <div>
        <Hero />
        <PopularNotes />
        <TestimonialsSection />
        <Faqs/>
        <Working/>
      </div>
    </>
  );
}

