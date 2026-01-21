'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/Sheet';
import { Menu, Sparkles, Languages, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

import Image from 'next/image';

export function MarketingHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const { t, i18n } = useTranslation();

    const navLinks = [
        { href: '/features', label: t('marketing.nav.features') },
        { href: '/how-it-works', label: t('marketing.nav.howItWorks') },
        { href: '/pricing', label: t('marketing.nav.pricing') },
        { href: 'https://watatek.com/', label: t('hero.contactSales'), external: true },
    ];

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const currentLang = i18n.language === 'vi' ? 'Tiếng Việt' : 'English';

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass-floating">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center group">
                        <div className="relative w-32 h-10 md:w-40 md:h-12 transition-all duration-500 group-hover:scale-105">
                            <Image
                                src="/images/logo.svg"
                                alt="WataAI Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href as any}
                                target={link.external ? "_blank" : undefined}
                                className="text-xs font-black uppercase tracking-widest text-white/60 hover:text-primary transition-all duration-300"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-6">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white gap-2 h-9 px-3 bg-white/5 border border-white/10 rounded-full">
                                    <Languages className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white min-w-[140px] rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl">
                                <DropdownMenuItem
                                    onClick={() => changeLanguage('en')}
                                    className="flex items-center justify-between cursor-pointer rounded-xl hover:bg-white/10 px-4 py-2 text-xs font-bold"
                                >
                                    ENGLISH {i18n.language === 'en' && <Check className="w-4 h-4 text-primary" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => changeLanguage('vi')}
                                    className="flex items-center justify-between cursor-pointer rounded-xl hover:bg-white/10 px-4 py-2 text-xs font-bold"
                                >
                                    TIẾNG VIỆT {i18n.language === 'vi' && <Check className="w-4 h-4 text-primary" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-6 w-px bg-white/10 mx-1" />

                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="text-xs font-black uppercase tracking-widest text-white/70 hover:text-white px-4 transition-colors"
                            >
                                {t('marketing.nav.login')}
                            </Link>
                            <Button className="h-10 px-6 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-transform" asChild>
                                <Link href="/register">{t('marketing.nav.startFree')}</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    <div className="flex lg:hidden items-center gap-2">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white w-10 h-10 rounded-xl bg-white/5 border border-white/10">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] bg-slate-950/95 backdrop-blur-2xl border-white/10 p-0 overflow-hidden">
                                <div className="flex flex-col h-full pt-10 px-8">
                                    <div className="flex items-center mb-12">
                                        <div className="relative w-32 h-10">
                                            <Image
                                                src="/images/logo.svg"
                                                alt="WataAI Logo"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>

                                    <nav className="flex flex-col gap-6">
                                        {navLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href as any}
                                                target={link.external ? "_blank" : undefined}
                                                onClick={() => setIsOpen(false)}
                                                className="text-sm font-black uppercase tracking-[0.2em] text-white/50 hover:text-primary transition-colors py-2 flex items-center justify-between group"
                                            >
                                                {link.label}
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                        ))}

                                        <div className="h-px bg-white/5 my-4" />

                                        <div className="flex flex-col gap-4">
                                            <Link
                                                href="/login"
                                                onClick={() => setIsOpen(false)}
                                                className="text-xs font-black uppercase tracking-widest text-white/50 hover:text-white py-2"
                                            >
                                                {t('marketing.nav.login')}
                                            </Link>
                                            <Button className="h-12 w-full rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20" asChild>
                                                <Link href="/register" onClick={() => setIsOpen(false)}>{t('marketing.nav.startFree')}</Link>
                                            </Button>
                                        </div>
                                    </nav>

                                    <div className="mt-auto pb-10 flex items-center justify-between border-t border-white/5 pt-6">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Protocols</span>
                                        <div className="flex gap-4">
                                            <button onClick={() => changeLanguage('en')} className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", i18n.language === 'en' ? "text-primary" : "text-white/20")}>EN</button>
                                            <button onClick={() => changeLanguage('vi')} className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", i18n.language === 'vi' ? "text-primary" : "text-white/20")}>VI</button>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
}
