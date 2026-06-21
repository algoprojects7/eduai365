import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from '@eduai365/i18n';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});
