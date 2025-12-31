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
        <footer className="border-t border-border/40 bg-background/50">
            <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-purple-600">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-display font-bold text-lg tracking-tight">
                                Wata<span className="text-gradient">AI</span>
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            Nền tảng AI tự động hóa thông minh cho doanh nghiệp của bạn.
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <social.icon className="w-4 h-4" />
                                    <span className="sr-only">{social.label}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="font-semibold text-sm mb-4">Sản phẩm</h4>
                        <ul className="space-y-3">
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
                        <h4 className="font-semibold text-sm mb-4">Công ty</h4>
                        <ul className="space-y-3">
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
                        <h4 className="font-semibold text-sm mb-4">Pháp lý</h4>
                        <ul className="space-y-3">
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
                <div className="border-t border-border/40 mt-12 pt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} WataAI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
