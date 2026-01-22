import { useTranslation } from 'react-i18next';
import { vi, enUS } from 'date-fns/locale';
import { Locale } from 'date-fns';

export function useDateLocale(): Locale {
    const { i18n } = useTranslation();

    // Check if language is explicitly set to Vietnamese
    // Handles 'vi', 'vi-VN', etc.
    const isVietnamese = i18n.language?.startsWith('vi');

    return isVietnamese ? vi : enUS;
}
