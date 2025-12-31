"use client";

import React, { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios-client';
import { PageLoading } from '@/components/ui/PageLoading';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
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
  ShieldCheck,
  Users
} from 'lucide-react';

interface AiProvider {
  id: string;
  key: string;
  label: string;
  icon?: string;
  description?: string;
  requiredFields: string[];
  optionalFields: string[];
  defaultValues: Record<string, any>;
  isActive: boolean;
}

interface UserAiProviderConfig {
  id: string;
  userId: string;
  providerId: string;
  provider?: AiProvider;
  displayName: string;
  config: Record<string, any>;
  modelList?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

import { keepPreviousData, useQuery } from '@tanstack/react-query';

export default function AIModelsPage() {
  const [systemSettings, setSystemSettings] = useState({
    defaultProviderId: '',
    defaultModel: '',
    minTemperature: 0.0,
    maxTemperature: 2.0,
    contentModeration: true,
    safeFallbacks: true,
    contextAware: true,
    maxRequestsPerHour: 1000,
    maxRequestsPerUser: 100,
  });
  const [activeTab, setActiveTab] = useState('account');

  // Query for Available Providers
  const { data: availableProviders = [], isLoading: loadingProviders, refetch: refetchProviders } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: async () => {
      return await axiosClient.get('/ai-providers') as AiProvider[];
    }
  });

  // Query for User Configs
  const { data: userConfigs = [], isLoading: loadingUserConfigs, refetch: refetchUserConfigs } = useQuery({
    queryKey: ['ai-user-configs'],
    queryFn: async () => {
      // Enhancing is done in selector or subsequent logic usually, 
      // but here we can do it inside queryFn or let queries run in parallel and map them
      // Since we need providers to enhance, it's better to rely on availableProviders data.
      // However, react-query parallel fetching is async.
      // Let's fetch raw configs here.
      return await axiosClient.get('/ai-providers/user/configs') as UserAiProviderConfig[];
    }
  });

  const loading = loadingProviders || loadingUserConfigs;

  // Enhance user configs with provider data
  const enhancedUserConfigs = React.useMemo(() => {
    return userConfigs.map((config: any) => ({
      ...config,
      provider: availableProviders.find((provider: any) => provider.id === config.providerId),
    }));
  }, [userConfigs, availableProviders]);



  // Handle data changes from child components
  const handleDataChange = () => {
    refetchProviders();
    refetchUserConfigs();
  };

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

  if (loading) {
    return <PageLoading message="Loading settings" />;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col min-h-full">
        <div className="flex-none px-6 lg:px-8 pt-6 lg:pt-8 bg-background">
          <PageHeader
            title="Settings"
            description="Manage your agent configurations and system preferences"
            premium
            className="mb-6"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="flex-1 flex flex-col">
          <div className="px-6 lg:px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <TabsList >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 p-6 lg:p-8">
            <div className="max-w-screen-2xl mx-auto">
              <TabsContent value="ai-providers" className="m-0 focus-visible:outline-none animate-in fade-in duration-500">
                <AIProvidersTab
                  userConfigs={enhancedUserConfigs}
                  availableProviders={availableProviders}
                  loading={loading}
                  onDataChange={handleDataChange}
                />
              </TabsContent>

              <TabsContent value="ai-settings" className="m-0 focus-visible:outline-none">
                <AISettingsTab
                  userConfigs={enhancedUserConfigs}
                  systemSettings={systemSettings}
                  onSystemSettingsChange={setSystemSettings}
                />
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
