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
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-purple-600 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight">
                            Wata<span className="text-gradient">AI</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="rounded-full"
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href="/login">Đăng nhập</Link>
                        </Button>
                        <Button asChild rounded="xl">
                            <Link href="/register">Bắt đầu miễn phí</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu */}
                    <div className="flex md:hidden items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="rounded-full"
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </Button>
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
