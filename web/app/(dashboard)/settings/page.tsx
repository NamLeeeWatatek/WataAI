'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsHeader } from '@/components/ui/Tabs';
import { AIProvidersTab } from '@/components/features/settings/AIProvidersTab';
import { AISettingsTab } from '@/components/features/settings/AISettingsTab';
import { AccountTab } from '@/components/features/settings/AccountTab';
import { NotificationsTab } from '@/components/features/settings/NotificationsTab';
import { SharingTab } from '@/components/features/settings/SharingTab';
import { BillingTab } from '@/components/features/settings/BillingTab';
import { QuestionsTab } from '@/components/features/settings/QuestionsTab';
import { TeamTab } from '@/components/features/settings/TeamTab';
import { PageHeader } from '@/components/shared/PageHeader';
// import { WorkspaceTab } from '@/components/features/settings/WorkspaceTab';
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

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('account');

  const tabs = useMemo(() => [
    { id: 'account', label: t('settingsPage.account', { defaultValue: 'Account' }), icon: User },
    { id: 'team', label: t('settingsPage.team', { defaultValue: 'Team Members' }), icon: Users },
    { id: 'ai-settings', label: t('settingsPage.aiSettings', { defaultValue: 'AI Settings' }), icon: Settings },
    { id: 'ai-providers', label: t('settingsPage.aiProviders', { defaultValue: 'AI Providers' }), icon: Cpu },
    { id: 'notifications', label: t('settingsPage.notifications', { defaultValue: 'Notifications' }), icon: Bell },
    { id: 'sharing', label: t('settingsPage.sharing', { defaultValue: 'Sharing' }), icon: Share2 },
    { id: 'billing', label: t('settingsPage.billing', { defaultValue: 'Billing' }), icon: CreditCard },
    { id: 'questions', label: t('settingsPage.help', { defaultValue: 'Help & FAQ' }), icon: HelpCircle },
  ], [t]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col min-h-full">
        {/* Header - Centered & Aligned */}
        <div className="flex-none pt-8 pb-4">
          <div className="flex-none">
            <div className="page-container pb-4">
              <PageHeader
                title={t('settingsPage.title', { defaultValue: 'System Configuration' })}
                description={t('settingsPage.description', { defaultValue: 'Neural gateway orchestration and system-wide preference matrix' })}
                premium
                className="mb-0"
              />
            </div>
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
          <div className="flex-1">
            <div className="page-container pt-0">
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
