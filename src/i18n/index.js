import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ptBR from './locales/pt-BR.json'
import jaJP from './locales/ja-JP.json'

function detectarIdioma() {
  return navigator.language?.startsWith('ja') ? 'ja-JP' : 'pt-BR'
}

const idiomaInicial = detectarIdioma()

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    'ja-JP': { translation: jaJP },
  },
  lng: idiomaInicial,
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = idiomaInicial
document.title = idiomaInicial === 'ja-JP' ? 'バーバーショップ - 予約' : 'Barbearia - Agendamento'

export default i18n
