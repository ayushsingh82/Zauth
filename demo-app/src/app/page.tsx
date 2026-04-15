import { Navbar } from '../components/navbar';
import { HeroSection } from '../components/hero-section';
import { ProductSection } from '../components/feature-grid';
import { ComparisonSection } from '../components/comparison-section';
import { HowItWorksSection } from '../components/how-it-works';
import { UseCasesSection } from '../components/use-cases';
import { DeveloperSection } from '../components/developer-section';
import { Footer } from '../components/footer';

export default function Home() {
  return (
    <div className="pow-shell">
      <Navbar />
      <main className="pow-main">
        <HeroSection />
        <ProductSection />
        <ComparisonSection />
        <HowItWorksSection />
        <UseCasesSection />
        <DeveloperSection />
      </main>
      <Footer />
    </div>
  );
}
