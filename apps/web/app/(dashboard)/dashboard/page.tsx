import { DashboardClient } from '@/components/features/dashboard/DashboardClient'

export default function DashboardPage() {
    // Let client fetch data directly from backend API via React Query
    // Auth is handled by Middleware and Layout
    return (
        <DashboardClient />
    )
}

