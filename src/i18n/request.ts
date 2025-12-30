import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
// Static imports for standalone mode compatibility
import frMessages from './messages/fr.json'
import enMessages from './messages/en.json'

export const locales = ['fr', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'

const messagesMap: Record<Locale, typeof frMessages> = {
  fr: frMessages,
  en: enMessages,
}

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

  return {
    locale,
    messages: messagesMap[locale],
  }
})
