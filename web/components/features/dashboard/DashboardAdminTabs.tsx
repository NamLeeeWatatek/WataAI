'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/Table"
import {
    Activity,
    CreditCard,
    Server,
    Shield,
    Users,
    Clock,
    CheckCircle2,
    XCircle,
    MoreHorizontal
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/DropdownMenu"
import { Progress } from "@/components/ui/Progress"

interface DashboardAdminTabsProps {
    children?: React.ReactNode
}

export function DashboardAdminTabs({ children }: DashboardAdminTabsProps) {
    return (
        <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="payments">Payment Management</TabsTrigger>
                <TabsTrigger value="system">System Status</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
                {children}
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
                <PaymentManagement />
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
                <SystemStatus />
            </TabsContent>
        </Tabs>
    )
}

function PaymentManagement() {
    // Mock Data
    const transactions = [
        { id: "TRX-9821", user: "Alice Nguyen", plan: "Pro Plan", amount: "$29.00", date: "2024-01-12", status: "completed" },
        { id: "TRX-9822", user: "Bob Tran", plan: "Enterprise", amount: "$199.00", date: "2024-01-12", status: "pending" },
        { id: "TRX-9823", user: "Charlie Le", plan: "Starter", amount: "$0.00", date: "2024-01-11", status: "completed" },
        { id: "TRX-9824", user: "David Pham", plan: "Pro Plan", amount: "$29.00", date: "2024-01-10", status: "failed" },
        { id: "TRX-9825", user: "Eve Vu", plan: "Pro Plan", amount: "$29.00", date: "2024-01-09", status: "refunded" },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Manage user payments and subscription plans.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((trx) => (
                            <TableRow key={trx.id}>
                                <TableCell className="font-medium">{trx.id}</TableCell>
                                <TableCell>{trx.user}</TableCell>
                                <TableCell>{trx.plan}</TableCell>
                                <TableCell>{trx.amount}</TableCell>
                                <TableCell>{trx.date}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        trx.status === 'completed' ? 'default' :
                                            trx.status === 'pending' ? 'secondary' :
                                                trx.status === 'failed' ? 'destructive' : 'outline'
                                    }>
                                        {trx.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem>View details</DropdownMenuItem>
                                            <DropdownMenuItem>Download Invoice</DropdownMenuItem>
                                            {trx.status === 'completed' && <DropdownMenuItem className="text-destructive">Refund</DropdownMenuItem>}
                                            {trx.status === 'pending' && <DropdownMenuItem>Approve</DropdownMenuItem>}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function SystemStatus() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Server Status</CardTitle>
                    <Activity className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-500">Operational</div>
                    <p className="text-xs text-muted-foreground">All systems normal</p>
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span>API Latency</span>
                            <span className="font-mono">45ms</span>
                        </div>
                        <Progress value={20} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resource Usage</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span>CPU Load</span>
                                <span className="text-muted-foreground">34%</span>
                            </div>
                            <Progress value={34} className="h-2" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span>Memory</span>
                                <span className="text-muted-foreground">6.2GB / 16GB</span>
                            </div>
                            <Progress value={40} className="h-2" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Security</CardTitle>
                    <Shield className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Secure</div>
                    <p className="text-xs text-muted-foreground">Last scan: 10 mins ago</p>
                    <div className="mt-4 flex gap-2">
                        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="mr-1 w-3 h-3" /> WAF Active
                        </Badge>
                        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="mr-1 w-3 h-3" /> DB Encrypted
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
