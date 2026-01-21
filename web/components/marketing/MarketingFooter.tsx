'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function MarketingFooter() {
    const { t } = useTranslation();

    const footerLinks = {
        product: [
            { href: '/features', label: t('marketing.nav.features') },
            { href: '/how-it-works', label: t('marketing.nav.howItWorks') },
            { href: '/pricing', label: t('marketing.nav.pricing') },
            { href: 'https://watatek.com/', label: 'WATA TECH', external: true },
        ],
        company: [
            { href: 'https://watatek.com/about', label: t('dashboard.knowledgeBase'), external: true },
            { href: '/blog', label: 'Blog' },
            { href: 'https://watatek.com/contact', label: t('hero.contactSales'), external: true },
        ],
        legal: [
            { href: '/privacy', label: 'Privacy' },
            { href: '/terms', label: 'Terms' },
        ],
    };

    const socialLinks = [
        { href: 'https://github.com/watatech', icon: Github, label: 'GitHub' },
        { href: 'https://twitter.com/watatech', icon: Twitter, label: 'Twitter' },
        { href: 'https://linkedin.com/company/watatech', icon: Linkedin, label: 'LinkedIn' },
    ];

    return (
        <footer className="border-t border-white/5 bg-slate-950 pt-24 pb-12">
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-16 mb-20">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1 space-y-8">
                        <Link href="/" className="flex items-center group">
                            <div className="relative w-40 h-12 transition-transform duration-500 group-hover:scale-105">
                                <Image
                                    src="/images/logo.svg"
                                    alt="WataAI Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </Link>
                        <p className="text-sm text-white/40 max-w-xs leading-relaxed font-medium">
                            The intelligent automation platform for modern businesses. Build, deploy, and scale AI agents in seconds.
                        </p>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="font-semibold text-sm text-foreground mb-6">Product</h4>
                        <ul className="space-y-4">
                            {footerLinks.product.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href as any}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="font-semibold text-sm text-foreground mb-6">Company</h4>
                        <ul className="space-y-4">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href as any}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className="font-semibold text-sm text-foreground mb-6">Legal</h4>
                        <ul className="space-y-4">
                            {footerLinks.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href as any}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} WataAI Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        {socialLinks.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <social.icon className="w-5 h-5" />
                                <span className="sr-only">{social.label}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
