import { Metadata } from 'next';
import { DashboardClient } from '@/components/features/dashboard/DashboardClient'

export const metadata: Metadata = {
    title: 'Dashboard | WataAI',
    description: 'Manage your AI bots, conversations, and engagement channels from one unified dashboard.',
};

export default function DashboardPage() {
    return (
        <DashboardClient />
    )
}

