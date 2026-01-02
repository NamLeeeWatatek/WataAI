import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="dark min-h-screen w-full font-sans bg-background text-foreground flex items-center justify-center relative overflow-hidden" style={{ colorScheme: 'dark' }}>
            {/* Shared Marketing Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none opacity-50" />
            <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none opacity-30" />

            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    );
}
