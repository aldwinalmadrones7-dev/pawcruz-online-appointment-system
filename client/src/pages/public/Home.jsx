/**
 * Home — Landing page: hero, a live-queue strip (now serving per vet, links to /queue),
 * how it works, featured services, vets, testimonials, clinic hours & location,
 * FAQ and a final call to action.
 */
import CtaBand from '../../components/CtaBand';
import WaveDivider from '../../components/WaveDivider';
import useAsync from '../../hooks/useAsync';
import { getServices } from '../../services/serviceService';
import { getVets } from '../../services/vetService';
import FaqSection from './home/FaqSection';
import FeaturedServices from './home/FeaturedServices';
import HeroSection from './home/HeroSection';
import HowItWorks from './home/HowItWorks';
import LiveQueueTeaser from './home/LiveQueueTeaser';
import Testimonials from './home/Testimonials';
import MeetTheVets from './home/MeetTheVets';
import VisitSection from './home/VisitSection';

export default function Home() {
  const services = useAsync(() => getServices(), []);
  const vets = useAsync(() => getVets(), []);

  return (
    <>
      <HeroSection />
      <LiveQueueTeaser />
      <WaveDivider from="var(--bg)" to="var(--surface-alt)" />
      <HowItWorks />
      <WaveDivider from="var(--surface-alt)" to="var(--bg)" variant="swell" />
      <FeaturedServices services={services.data ?? []} loading={services.loading} />
      <WaveDivider from="var(--bg)" to="var(--surface-alt)" />
      <MeetTheVets vets={vets.data ?? []} loading={vets.loading} />
      <WaveDivider from="var(--surface-alt)" to="var(--bg)" variant="swell" />
      <Testimonials />
      <WaveDivider from="var(--bg)" to="var(--surface-alt)" />
      <VisitSection />
      <WaveDivider from="var(--surface-alt)" to="var(--bg)" variant="swell" />
      <FaqSection />
      <CtaBand />
    </>
  );
}
