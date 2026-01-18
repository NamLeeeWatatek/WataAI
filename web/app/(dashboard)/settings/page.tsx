'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsHeader } from '@/components/ui/Tabs';
import { AIProvidersTab } from '@/components/features/settings/AIProvidersTab';
import { AISettingsTab } from '@/components/features/settings/AISettingsTab';
import { AccountTab } from '@/components/features/settings/AccountTab';
import { SecurityTab } from '@/components/features/settings/SecurityTab';
import { NotificationsTab } from '@/components/features/settings/NotificationsTab';
import { SharingTab } from '@/components/features/settings/SharingTab';
import { BillingTab } from '@/components/features/settings/BillingTab';
import { QuestionsTab } from '@/components/features/settings/QuestionsTab';
import { TeamTab } from '@/components/features/settings/TeamTab';
import { PageHeader } from '@/components/shared/PageHeader';
import { WorkspaceTab } from '@/components/features/settings/WorkspaceTab';
import {
  User,
  Settings,
  Cpu,
  Bell,
  Share2,
  CreditCard,
  HelpCircle,
  Users,
  Briefcase
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('workspace');

  const tabs = [
    { id: 'workspace', label: 'Workspace', icon: Briefcase },
    { id: 'account', label: 'Account', icon: User },
    { id: 'team', label: 'Team Members', icon: Users },
    { id: 'ai-settings', label: 'AI Settings', icon: Settings },
    { id: 'ai-providers', label: 'AI Providers', icon: Cpu },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'sharing', label: 'Sharing', icon: Share2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'questions', label: 'Help & FAQ', icon: HelpCircle },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col min-h-full">
        {/* Header - Centered & Aligned */}
        <div className="flex-none pt-8 pb-4">
          <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <PageHeader
              title="System Configuration"
              description="Neural gateway orchestration and system-wide preference matrix"
              premium
              className="mb-0"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="w-full flex-1 flex flex-col">
          <TabsHeader>
            <TabsList variant="pills">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  variant="pills"
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </TabsHeader>

          {/* Content Area - Centered & Aligned */}
          <div className="flex-1 py-8">
            <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <TabsContent value="workspace" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <WorkspaceTab />
              </TabsContent>

              <TabsContent value="ai-providers" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <AIProvidersTab />
              </TabsContent>

              <TabsContent value="ai-settings" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <AISettingsTab />
              </TabsContent>

              <TabsContent value="account" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <AccountTab />
              </TabsContent>

              <TabsContent value="team" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <TeamTab />
              </TabsContent>

              <TabsContent value="notifications" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <NotificationsTab />
              </TabsContent>

              <TabsContent value="sharing" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <SharingTab />
              </TabsContent>

              <TabsContent value="billing" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <BillingTab />
              </TabsContent>

              <TabsContent value="questions" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <QuestionsTab />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
