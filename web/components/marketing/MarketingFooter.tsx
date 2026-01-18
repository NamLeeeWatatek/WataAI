'use client';

import Link from 'next/link';
import { Sparkles, Github, Twitter, Linkedin } from 'lucide-react';

const footerLinks = {
    product: [
        { href: '#features', label: 'Tính năng' },
        { href: '#how-it-works', label: 'Cách hoạt động' },
        { href: '#pricing', label: 'Bảng giá' },
    ],
    company: [
        { href: '/about', label: 'Về chúng tôi' },
        { href: '/blog', label: 'Blog' },
        { href: '/careers', label: 'Tuyển dụng' },
    ],
    legal: [
        { href: '/privacy', label: 'Chính sách bảo mật' },
        { href: '/terms', label: 'Điều khoản sử dụng' },
    ],
};

const socialLinks = [
    { href: 'https://github.com', icon: Github, label: 'GitHub' },
    { href: 'https://twitter.com', icon: Twitter, label: 'Twitter' },
    { href: 'https://linkedin.com', icon: Linkedin, label: 'LinkedIn' },
];

export function MarketingFooter() {
    return (
        <footer className="border-t border-border/50 bg-background pt-20 pb-10">
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-6 group">
                            <div className="p-2 rounded-xl bg-primary/5 border border-border/50 group-hover:bg-primary/10 transition-colors">
                                <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-display font-bold text-xl tracking-tight text-foreground">
                                WataAI
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                            The intelligent automation platform for modern businesses. Connect, automate, and scale.
                        </p>

                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="font-semibold text-sm text-foreground mb-6">Product</h4>
                        <ul className="space-y-4">
                            {footerLinks.product.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </a>
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
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </a>
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
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </a>
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
