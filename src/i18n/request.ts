import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export const locales = ['fr', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'

export default getRequestConfig(async () => {
  let locale: Locale = defaultLocale

  try {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get('locale')?.value
    if (cookieLocale && locales.includes(cookieLocale as Locale)) {
      locale = cookieLocale as Locale
    }
  } catch {
    // If cookies() fails (e.g., during static generation), use default locale
    locale = defaultLocale
  }

  let messages
  try {
    messages = (await import(`./messages/${locale}.json`)).default
  } catch {
    // Fallback to French if locale file not found
    messages = (await import('./messages/fr.json')).default
    locale = 'fr'
  }

  return {
    locale,
    messages,
  }
})
