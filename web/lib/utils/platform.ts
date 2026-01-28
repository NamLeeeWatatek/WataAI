/**
 * Platform Utilities
 * Centralized utilities for platform icons and colors
 */
import {
  FacebookIcon,
  InstagramIcon,
  ZaloIcon,
  WebsiteIcon
} from '@/components/shared/icons/Logos'
import {
  Mail,
  Youtube,
  Twitter,
  Linkedin,
  Slack,
  Globe,
  Phone,
  ShoppingBag,
  Chrome,
  MessageCircle
} from 'lucide-react'

/**
 * Get platform icon component
 * Returns the icon component class that can be used in JSX
 */
export function getPlatformIcon(type: string): any {
  const iconMap: Record<string, any> = {
    facebook: FacebookIcon,
    messenger: FacebookIcon,
    instagram: InstagramIcon,
    whatsapp: Phone,
    telegram: MessageCircle,
    email: Mail,
    youtube: Youtube,
    twitter: Twitter,
    linkedin: Linkedin,
    tiktok: MessageCircle,
    discord: MessageCircle,
    slack: Slack,
    zalo: ZaloIcon,
    line: MessageCircle,
    viber: MessageCircle,
    wechat: MessageCircle,
    sms: Phone,
    webchat: WebsiteIcon,
    shopify: ShoppingBag,
    google: Chrome,
    hubspot: MessageCircle,
    salesforce: MessageCircle,
    mailchimp: Mail,
    intercom: MessageCircle,
    zapier: MessageCircle,
    notion: MessageCircle,
    airtable: MessageCircle
  }

  return iconMap[type] || MessageCircle
}

/**
 * Get platform color classes (uses globals.css platform-* classes)
 */
export function getPlatformColor(type: string): string {
  const validPlatforms = [
    'facebook',
    'messenger',
    'instagram',
    'whatsapp',
    'telegram',
    'youtube',
    'twitter',
    'linkedin',
    'tiktok',
    'discord',
    'slack',
    'zalo',
    'line',
    'viber',
    'wechat',
    'sms',
    'email',
    'webchat',
    'shopify',
    'google',
    'hubspot',
    'salesforce',
    'mailchimp',
    'intercom',
    'zapier',
    'notion',
    'airtable'
  ]

  return validPlatforms.includes(type) ? `platform-${type}` : 'platform-default'
}


