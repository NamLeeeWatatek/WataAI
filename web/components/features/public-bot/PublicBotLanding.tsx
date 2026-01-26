import { Bot } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

interface PublicBotLandingProps {
    bot: any;
    onStartChat: () => void;
}

export function PublicBotLanding({ bot, onStartChat }: PublicBotLandingProps) {
    const primaryColor = bot.theme?.primaryColor || "#000000";
    const bgColor = bot.theme?.backgroundColor || "#ffffff";

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                <div
                    className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-3xl opacity-20 transform translate-x-1/3 -translate-y-1/3"
                    style={{ backgroundColor: primaryColor }}
                />
                <div
                    className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 transform -translate-x-1/3 translate-y-1/3"
                    style={{ backgroundColor: primaryColor }}
                />
            </div>

            <main className="z-10 w-full max-w-5xl px-6 py-12 flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Avatar / Icon */}
                <div className="relative group">
                    <div
                        className="absolute inset-0 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                        style={{ backgroundColor: primaryColor }}
                    ></div>
                    <Avatar className="w-32 h-32 border-4 shadow-2xl relative z-10" style={{ borderColor: bgColor }}>
                        <AvatarImage src={bot.avatarUrl} alt={bot.name} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            <Bot className="w-12 h-12" />
                        </AvatarFallback>
                    </Avatar>
                    <Badge
                        className="absolute bottom-2 right-2 z-20 px-3 py-1 text-xs shadow-lg pointer-events-none"
                        variant="outline"
                    >
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                        Online
                    </Badge>
                </div>

                {/* Hero Text */}
                <div className="space-y-4 max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60" style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${primaryColor}90)` }}>{bot.name}</span>
                    </h1>
                    <p className="text-xl text-muted-foreground md:text-2xl font-light leading-relaxed max-w-2xl mx-auto">
                        {bot.description || "I'm your AI assistant, ready to help you with anything you need. Let's start a conversation!"}
                    </p>
                </div>

                {/* CTA */}
                <div className="pt-4">
                    <Button
                        size="lg"
                        className="h-16 px-10 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                        style={{ backgroundColor: primaryColor }}
                        onClick={onStartChat}
                    >
                        Start Chatting
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="ml-2 w-5 h-5"
                        >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </Button>
                    <p className="mt-4 text-xs text-muted-foreground uppercase tracking-widest opacity-60 font-semibold">
                        Powered by WataAI
                    </p>
                </div>

                {/* Features / Additional Info (Optional) */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12 text-left opacity-80">
            <div className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
                <h3 className="font-bold mb-2">24/7 Availability</h3>
                <p className="text-sm text-muted-foreground">Always here to answer your questions instantly, anytime.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
                <h3 className="font-bold mb-2">Smart Responses</h3>
                <p className="text-sm text-muted-foreground">Powered by advanced AI to understand context and nuance.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
                <h3 className="font-bold mb-2">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">Your conversations are private and secure.</p>
            </div>
        </div> */}
            </main>

            {/* Footer */}
            <footer className="absolute bottom-6 text-center w-full p-4 pointer-events-none opacity-40">
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium">
                    AI Assistant Protocol v1.0
                </span>
            </footer>
        </div>
    );
}
