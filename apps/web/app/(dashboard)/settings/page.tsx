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
import { PageHeader } from '@/components/ui/PageHeader';
import {
  User,
  Settings,
  Cpu,
  Bell,
  Share2,
  CreditCard,
  HelpCircle,
  Users
} from 'lucide-react';

export default function AIModelsPage() {
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
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
    <div className="h-full overflow-y-auto bg-background/50">
      <div className="flex flex-col min-h-full">
        <div className="flex-none px-4 md:px-8 pt-6 lg:pt-8">
          <PageHeader
            title="System Configuration"
            description="Neural gateway orchestration and system-wide preference matrix"
            premium
            className="mb-8"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="w-full flex-1 flex flex-col">
          <TabsHeader>
            <TabsList variant="pills" className="w-full justify-start overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  variant="pills"
                  className="shrink-0"
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </TabsHeader>

          <div className="flex-1 p-6 lg:p-8">
            <div className="max-w-screen-2xl mx-auto">
              <TabsContent value="ai-providers" className="m-0 focus-visible:outline-none">
                <AIProvidersTab />
              </TabsContent>

              <TabsContent value="ai-settings" className="m-0 focus-visible:outline-none">
                <AISettingsTab />
              </TabsContent>

              <TabsContent value="account" className="m-0 focus-visible:outline-none">
                <AccountTab />
              </TabsContent>

              <TabsContent value="team" className="m-0 focus-visible:outline-none">
                <TeamTab />
              </TabsContent>

              <TabsContent value="notifications" className="m-0 focus-visible:outline-none">
                <NotificationsTab />
              </TabsContent>

              <TabsContent value="sharing" className="m-0 focus-visible:outline-none">
                <SharingTab />
              </TabsContent>

              <TabsContent value="billing" className="m-0 focus-visible:outline-none">
                <BillingTab />
              </TabsContent>

              <TabsContent value="questions" className="m-0 focus-visible:outline-none">
                <QuestionsTab />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
