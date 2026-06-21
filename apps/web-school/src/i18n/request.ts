import { getRequestConfig } from 'next-intl/server';
import { getMessages, isLocale } from '@eduai365/i18n';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !isLocale(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: getMessages(locale),
  };
});
