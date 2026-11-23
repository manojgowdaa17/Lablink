import React from 'react'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import HeroSection from '../components/landing/HeroSection'
import FeaturedEquipment from '../components/landing/FeaturedEquipment'
import HowItWorks from '../components/landing/HowItWorks'
import FeaturesSection from '../components/landing/FeaturesSection'
import AboutSection from '../components/landing/AboutSection'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedEquipment />
        <HowItWorks />
        <FeaturesSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  )
}
