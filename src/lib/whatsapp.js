export function gerarLinkWhatsapp(mensagem) {
  const numero = import.meta.env.VITE_WHATSAPP_NUMERO
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}
