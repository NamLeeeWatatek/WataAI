'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/Sheet';
import { Menu, X, Moon, Sun, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
    { href: '#features', label: 'Tính năng' },
    { href: '#how-it-works', label: 'Cách hoạt động' },
    { href: '#pricing', label: 'Bảng giá' },
];

export function MarketingHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-md group-hover:scale-110 transition-transform">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight text-white">
                            Wata<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">AI</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
                            <Link href="/login">Đăng nhập</Link>
                        </Button>
                        <Button className="font-semibold shadow-lg shadow-primary/25" asChild>
                            <Link href="/register">Bắt đầu miễn phí</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu */}
                    <div className="flex md:hidden items-center gap-2">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-80 glass-card">
                                <nav className="flex flex-col gap-4 mt-8">
                                    {navLinks.map((link) => (
                                        <a
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                    <div className="border-t border-border/50 pt-4 mt-4 space-y-3">
                                        <Button variant="outline" className="w-full" asChild>
                                            <Link href="/login">Đăng nhập</Link>
                                        </Button>
                                        <Button className="w-full" asChild>
                                            <Link href="/register">Bắt đầu miễn phí</Link>
                                        </Button>
                                    </div>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
}
