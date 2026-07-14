import i18n from '../i18n'

const CHAVES_CONHECIDAS = [
  'horario_nao_encontrado',
  'horario_indisponivel',
  'antecedencia_minima',
  'agendamento_ja_cancelado',
]

export function traduzirErro(mensagem) {
  if (CHAVES_CONHECIDAS.includes(mensagem)) {
    return i18n.t(`erros.${mensagem}`)
  }
  return mensagem
}
