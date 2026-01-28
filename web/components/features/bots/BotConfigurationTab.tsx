"use client";

import React, { useEffect, useState } from 'react';
import { aiProvidersApi } from '@/lib/api/ai-providers';
import { useTranslation } from 'react-i18next';
import { BotStatus } from '@/lib/types/bots';

// Sub-sections
import { BotIdentitySection } from './details/BotIdentitySection';
import { BotSystemPromptSection } from './details/BotSystemPromptSection';
import { BotIntelligenceSection } from './details/BotIntelligenceSection';

interface BotFormData {
  name: string;
  description: string;
  avatarUrl: string | null;
  systemPrompt: string;
  aiProviderId: string | null;
  aiModelName: string;
  aiParameters: {
    temperature: number;
    maxTokens: number;
  };
  enableAutoLearn: boolean;
  status: BotStatus;
  tags: string[];
}

interface BotConfigurationTabProps {
  formData: BotFormData;
  onChange: (updates: Partial<BotFormData>) => void;
  workspaceId?: string;
  totalServed?: number;
}

export function BotConfigurationTab({ formData, onChange, workspaceId, totalServed = 0 }: BotConfigurationTabProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setLoading(true);
        const userModelsPromise = aiProvidersApi.getAvailableModels();

        const workspaceModelsPromise = workspaceId
          ? aiProvidersApi.getWorkspaceModels(workspaceId)
          : Promise.resolve([]);

        const [userModels, workspaceModels] = await Promise.all([
          userModelsPromise,
          workspaceModelsPromise
        ]);

        const combined = [
          ...(workspaceModels || []).map((p) => ({ ...p, source: 'workspace' })),
          ...(userModels || []).map((p) => ({ ...p, source: 'user' }))
        ];

        // Deduplicate by configId to avoid showing duplicates in dropdown
        const uniqueProviders = combined.filter((provider, index, self) =>
          index === self.findIndex((p) => p.configId === provider.configId)
        );

        setProviders(uniqueProviders);
      } catch (error) {
        console.error('Failed to load AI providers:', error);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };
    loadProviders();
  }, [workspaceId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Identity Section */}
        <BotIdentitySection
          formData={formData}
          onChange={onChange}
        />

        {/* System Prompt Section */}
        <BotSystemPromptSection
          systemPrompt={formData.systemPrompt}
          onChange={(prompt) => onChange({ systemPrompt: prompt })}
        />

        {/* Intelligence Section */}
        <BotIntelligenceSection
          loading={loading}
          providers={providers}
          aiProviderId={formData.aiProviderId}
          aiModelName={formData.aiModelName}
          aiParameters={formData.aiParameters}
          enableAutoLearn={formData.enableAutoLearn}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
