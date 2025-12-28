"use client";

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { metadataApi, type ModelOption, type ProviderModelsResponse } from '@/lib/api/metadata';

interface ModelSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  filterProvider?: string;
  className?: string;
}

export function ModelSelector({
  value,
  onChange,
  filterProvider,
  className
}: ModelSelectorProps) {
  const { t } = useTranslation()
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      setLoading(true);
      try {
        const response = await metadataApi.getModels();
        const allModels = response.flatMap((p: ProviderModelsResponse) => p.models);
        setModels(allModels);
      } catch (err) {
        console.error('Failed to load models:', err);
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  const filteredModels = filterProvider
    ? models.filter(m => m.provider === filterProvider)
    : models;

  if (loading) {
    return <Spinner className="size-4" />;
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={t('ai.selectModel', 'Select a model')} />
      </SelectTrigger>
      <SelectContent>
        {filteredModels.map((model) => (
          <SelectItem
            key={model.model_name}
            value={model.model_name}
            disabled={!model.is_available}
          >
            <div className="flex items-center gap-2">
              <span>{model.display_name}</span>
              {model.is_recommended && (
                <Badge variant="outline" className="text-[8px] px-1 py-0">
                  {t('common.recommended', 'Recommended')}
                </Badge>
              )}
              {!model.is_available && (
                <Badge variant="secondary" className="text-[8px] px-1 py-0">
                  {t('common.notAvailable', 'Not Available')}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
