'use client'

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'
import { Globe } from 'lucide-react'

const languages = [
  { code: 'en', nameKey: 'english', flag: '🇺🇸' },
  { code: 'vi', nameKey: 'vietnamese', flag: '🇻🇳' },
]

interface LanguageSwitcherProps {
  variant?: 'ghost' | 'landing' | 'dashboard'
  size?: 'sm' | 'icon'
  className?: string
}

export function LanguageSwitcher({
  variant = 'ghost',
  size = 'sm',
  className = ''
}: LanguageSwitcherProps = {}) {
  const { i18n, t } = useTranslation()

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={`gap-2 ${
            variant === 'landing' ? 'text-current hover:text-current hover:bg-current/10' : ''
          } ${className}`}
          suppressHydrationWarning
        >
          <Globe className="h-4 w-4" />
          {size !== 'icon' && t(currentLanguage.nameKey)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={i18n.language === language.code ? 'bg-accent' : ''}
            suppressHydrationWarning
          >
            <span className="mr-2">{language.flag}</span>
            {t(language.nameKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
