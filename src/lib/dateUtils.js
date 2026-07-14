export function paraISOLocal(date) {
  const ano = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function hojeLocal() {
  return paraISOLocal(new Date())
}

export function formatarDataExibicao(dataISO, idioma) {
  const date = new Date(`${dataISO}T00:00:00`)
  return new Intl.DateTimeFormat(idioma, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
