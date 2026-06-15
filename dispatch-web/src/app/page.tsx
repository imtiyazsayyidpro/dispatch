import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Nav } from "@/components/landing/nav";
import { OpenSource } from "@/components/landing/open-source";

export default function Home() {
  // The landing page is dark by design; the `dark` scope keeps shadcn
  // tokens resolving against the dark palette without theming the whole app.
  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-300 antialiased">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <OpenSource />
      </main>
      <Footer />
    </div>
  );
}
