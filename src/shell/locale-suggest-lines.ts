/* the Accept-Language suggestion line, in each locale's own voice — its own
   module (react-refresh law) but the SAME lazy chunk as LocaleSuggest (its
   only component consumer); i18n.test pins full coverage of the locked set */
export const SUGGEST: Record<string, string> = {
  en: 'Read this page in English',
  fr: 'Lire cette page en français',
  es: 'Leer esta página en español',
  de: 'Diese Seite auf Deutsch lesen',
  'pt-BR': 'Ler esta página em português',
  ja: 'このページを日本語で読む',
  ko: '이 페이지를 한국어로 읽기',
  'zh-Hans': '以中文阅读此页',
}
