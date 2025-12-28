import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import LandingClient from './LandingClient'

export default async function LandingPage() {
    // Check authentication on server - redirect if already logged in
    const session = await auth()
    if (session) {
        redirect('/dashboard')
    }

    return <LandingClient />
}
