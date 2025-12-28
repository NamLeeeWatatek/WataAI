"use client";

import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { MdAutoAwesome } from "react-icons/md";
import { FiArrowRight } from "react-icons/fi";
import Link from "next/link";

interface NavigationProps {
  scrolled: boolean;
}

export default function Navigation({ scrolled }: NavigationProps) {
  const { t, ready } = useTranslation()

  // Show English fallback while translations are loading
  if (!ready) {
    const fallbackTranslations = {
      'navigation.features': 'Features',
      'navigation.pricing': 'Pricing',
      'navigation.documentation': 'Documentation',
      'navigation.login': 'Login',
      'navigation.start': 'Start'
    }

    return (
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-sm py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <MdAutoAwesome
                className={`w-8 h-8 ${scrolled ? "text-primary" : "text-white"}`}
              />
              <span
                className={`text-2xl font-bold ${
                  scrolled ? "text-slate-900" : "text-white"
                }`}
              >
                WataOmi
              </span>
            </div>
          <div className="hidden md:flex items-center space-x-4">
              <a
                href="#features"
                className={`text-sm font-medium hover:opacity-80 transition-colors ${
                  scrolled ? "text-slate-600" : "text-white/90"
                }`}
              >
                {fallbackTranslations['navigation.features']}
              </a>
              <a
                href="#pricing"
                className={`text-sm font-medium hover:opacity-80 transition-colors ${
                  scrolled ? "text-slate-600" : "text-white/90"
                }`}
              >
                {fallbackTranslations['navigation.pricing']}
              </a>
              <a
                href="#"
                className={`text-sm font-medium hover:opacity-80 transition-colors ${
                  scrolled ? "text-slate-600" : "text-white/90"
                }`}
              >
                {fallbackTranslations['navigation.documentation']}
              </a>

            {/* Language Switcher */}
            <div suppressHydrationWarning>
              <LanguageSwitcher
                variant="landing"
                className={scrolled ? "text-slate-600" : "text-white/90"}
              />
            </div>

              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={scrolled ? "text-slate-700" : "text-white hover:bg-white/10"}
                >
                  {fallbackTranslations['navigation.login']}
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className={
                    scrolled
                      ? "bg-primary text-white"
                      : "bg-white text-primary hover:bg-white/90"
                  }
                >
                  {fallbackTranslations['navigation.start']}
                  <FiArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <MdAutoAwesome
              className={`w-8 h-8 ${scrolled ? "text-primary" : "text-white"}`}
            />
            <span
              className={`text-2xl font-bold ${
                scrolled ? "text-slate-900" : "text-white"
              }`}
            >
              WataOmi
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="#features"
              className={`text-sm font-medium hover:opacity-80 transition-colors ${
                scrolled ? "text-slate-600" : "text-white/90"
              }`}
              suppressHydrationWarning
            >
              {t('navigation.features')}
            </a>
            <a
              href="#pricing"
              className={`text-sm font-medium hover:opacity-80 transition-colors ${
                scrolled ? "text-slate-600" : "text-white/90"
              }`}
              suppressHydrationWarning
            >
              {t('navigation.pricing')}
            </a>
            <a
              href="#"
              className={`text-sm font-medium hover:opacity-80 transition-colors ${
                scrolled ? "text-slate-600" : "text-white/90"
              }`}
              suppressHydrationWarning
            >
              {t('navigation.documentation')}
            </a>

            {/* Language Switcher */}
            <div suppressHydrationWarning>
              <LanguageSwitcher
                variant="landing"
                className={scrolled ? "text-slate-600" : "text-white/90"}
              />
            </div>

            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={scrolled ? "text-slate-700" : "text-white hover:bg-white/10"}
                suppressHydrationWarning
              >
                {t('navigation.login')}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="sm"
                className={
                  scrolled
                    ? "bg-primary text-white"
                    : "bg-white text-primary hover:bg-white/90"
                }
                suppressHydrationWarning
              >
                {t('navigation.start')}
                <FiArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
