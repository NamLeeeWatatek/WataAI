'use client'

import { useEffect, useState } from 'react'
import Navigation from '@/components/landing/Navigation'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import GlobalScaleSection from '@/components/landing/GlobalScaleSection'
import PricingSection from '@/components/landing/PricingSection'

export default function LandingClient() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className="min-h-screen bg-background force-light text-foreground overflow-x-hidden font-sans">
            <Navigation scrolled={scrolled} />
            <HeroSection />
            <FeaturesSection />
            <GlobalScaleSection />
            <PricingSection />
        </div>
    )
}
