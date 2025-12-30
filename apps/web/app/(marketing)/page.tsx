import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FeatureCard } from '@/components/marketing';
import {
    Bot,
    MessageSquare,
    Database,
    Sparkles,
    LayoutTemplate,
    MessagesSquare,
    ArrowRight,
    CheckCircle2,
    Zap,
    Shield,
    Globe,
} from 'lucide-react';

const features = [
    {
        icon: Bot,
        title: 'AI Chatbots',
        description: 'Tạo và quản lý các chatbot thông minh với khả năng tùy biến cao, tự động trả lời và hỗ trợ khách hàng 24/7.',
    },
    {
        icon: Globe,
        title: 'Multi-Channel Integration',
        description: 'Kết nối với Facebook, Zalo, Website và nhiều kênh khác. Quản lý tất cả từ một nơi duy nhất.',
    },
    {
        icon: Database,
        title: 'Knowledge Base',
        description: 'Xây dựng cơ sở tri thức với RAG và embeddings. AI tự động học hỏi từ dữ liệu của bạn.',
    },
    {
        icon: Sparkles,
        title: 'Creation Tools',
        description: 'Công cụ tạo nội dung bằng AI - từ bài viết, hình ảnh đến video. Tự động hóa quy trình sáng tạo.',
    },
    {
        icon: LayoutTemplate,
        title: 'Templates',
        description: 'Thư viện templates đa dạng cho mọi ngành nghề. Triển khai nhanh chóng, tiết kiệm thời gian.',
    },
    {
        icon: MessagesSquare,
        title: 'Unified Inbox',
        description: 'Quản lý tất cả hội thoại từ mọi kênh trong một inbox duy nhất. Không bỏ lỡ bất kỳ tin nhắn nào.',
    },
];

const steps = [
    {
        number: '01',
        title: 'Kết nối kênh',
        description: 'Liên kết tài khoản Facebook, Zalo hoặc tích hợp vào website của bạn chỉ với vài click.',
    },
    {
        number: '02',
        title: 'Cấu hình Bot',
        description: 'Tùy chỉnh chatbot với kiến thức riêng, thiết lập kịch bản và luồng hội thoại phù hợp.',
    },
    {
        number: '03',
        title: 'Tự động hoá',
        description: 'Để AI xử lý mọi thứ - từ trả lời khách hàng, tạo nội dung đến phân tích dữ liệu.',
    },
];

const benefits = [
    'Tiết kiệm 80% thời gian xử lý tin nhắn',
    'Tăng tỷ lệ chuyển đổi lên 3x',
    'Hỗ trợ khách hàng 24/7 không ngừng nghỉ',
    'Tích hợp đa kênh trong 5 phút',
];

export default function MarketingPage() {
    return (
        <div className="relative">
            {/* Background patterns */}
            <div className="absolute inset-0 u-bg-grid opacity-50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent rounded-full blur-3xl" />

            {/* Hero Section */}
            <section className="relative py-20 md:py-32 lg:py-40">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="display-heading-1 mb-6">
                            Tự động hoá{' '}
                            <span className="text-gradient">doanh nghiệp</span>
                            {' '}với sức mạnh AI
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                            Nền tảng AI toàn diện giúp bạn xây dựng chatbot thông minh
                            quản lý đa kênh, tạo nội dung tự động và tối ưu hoá quy trình kinh doanh.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button size="lg" rounded="xl" className="min-w-[200px] font-bold" asChild>
                                <Link href="/register">
                                    Bắt đầu miễn phí
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" rounded="xl" className="min-w-[200px]" asChild>
                                <Link href="#features">
                                    Khám phá tính năng
                                </Link>
                            </Button>
                        </div>

                        {/* Benefits list */}
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-12">
                            {benefits.map((benefit) => (
                                <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span>{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-20 md:py-32">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="text-center mb-16">
                        <h2 className="display-heading-2 mb-4">
                            Tất cả những gì bạn cần
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Một nền tảng duy nhất với đầy đủ công cụ để tự động hoá và mở rộng quy mô kinh doanh.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => (
                            <FeatureCard
                                key={feature.title}
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="relative py-20 md:py-32 bg-muted/30">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="text-center mb-16">
                        <h2 className="display-heading-2 mb-4">
                            Đơn giản chỉ 3 bước
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Bắt đầu sử dụng WataAI chỉ trong vài phút. Không cần kiến thức kỹ thuật.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {steps.map((step, index) => (
                            <div
                                key={step.number}
                                className="relative p-8 rounded-2xl bg-card border border-border/50 text-center group hover:border-primary/30 transition-colors"
                            >
                                {/* Connector line */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-border" />
                                )}

                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-purple-600 mb-6 shadow-lg shadow-primary/20">
                                    <span className="text-2xl font-bold text-white">{step.number}</span>
                                </div>
                                <h3 className="font-display font-bold text-xl mb-3">{step.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-20 md:py-32">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 p-12 md:p-20 text-center">
                        {/* Background decorations */}
                        <div className="absolute inset-0 u-bg-grid opacity-10" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-300/10 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur mb-8">
                                <Zap className="w-4 h-4 text-white" />
                                <span className="text-sm font-medium text-white">Bắt đầu ngay hôm nay</span>
                            </div>

                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
                                Sẵn sàng để tự động hoá?
                            </h2>
                            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10">
                                Tham gia cùng hàng nghìn doanh nghiệp đang sử dụng WataAI
                                để tiết kiệm thời gian và tăng trưởng doanh thu.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    rounded="xl"
                                    className="min-w-[200px] font-bold bg-white text-primary hover:bg-white/90"
                                    asChild
                                >
                                    <Link href="/register">
                                        Dùng thử miễn phí
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    rounded="xl"
                                    className="min-w-[200px] border-white/30 text-white hover:bg-white/10"
                                >
                                    <a href="#features">Xem thêm tính năng</a>
                                </Button>
                            </div>

                            <div className="flex items-center justify-center gap-6 mt-10 text-sm text-white/70">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Miễn phí 14 ngày</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    <span>Bảo mật dữ liệu</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    <span>Hỗ trợ 24/7</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
