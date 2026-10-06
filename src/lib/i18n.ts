export const locales = ['en', 'hi', 'gu'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

export async function getMessages(locale: string) {
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    return (await import(`../../messages/${defaultLocale}.json`)).default;
  }
}
