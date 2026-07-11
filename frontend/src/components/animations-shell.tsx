'use client';

// This is the client boundary. next/dynamic with ssr:false is only
// allowed inside a 'use client' component — NOT in server components.
import dynamic from 'next/dynamic';

const GSAPAnimations = dynamic(() => import('./gsap-animations'), { ssr: false });
const HeroParticles = dynamic(() => import('./hero-particles'), { ssr: false });
const PromoTicker = dynamic(() => import('./promo-ticker'), { ssr: false });
const AnimatedWhatsApp = dynamic(() => import('./animated-whatsapp'), { ssr: false });
const ScrollHint = dynamic(() => import('./scroll-hint'), { ssr: false });

export {
  GSAPAnimations,
  HeroParticles,
  PromoTicker,
  AnimatedWhatsApp,
  ScrollHint,
};
