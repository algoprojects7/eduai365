import en from '../messages/en.json';
import as from '../messages/as.json';

export const locales = ['en', 'as'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  as: 'অসমীয়া',
};

export type Messages = typeof en;

const messagesByLocale: Record<Locale, Messages> = {
  en,
  as,
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getMessages(locale: string): Messages {
  if (isLocale(locale)) {
    return messagesByLocale[locale];
  }
  return messagesByLocale[defaultLocale];
}

export { en, as };
