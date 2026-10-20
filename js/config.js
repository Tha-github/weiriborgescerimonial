// Configuração pública do site. Tudo aqui é visível no navegador.
// Nunca colocar senhas, a chave service_role ou outras chaves secretas.
window.WEIRI_CONFIG = Object.freeze({
  // WhatsApp oficial, somente dígitos: 55 + DDD + número.
  whatsapp: '5564992104641',

  // Supabase: Project Settings → API (ou Data API).
  // supabaseUrl: "Project URL", ex.: https://abcdefghijkl.supabase.co
  // supabaseKey: chave PÚBLICA "anon" (legada) ou "publishable" (sb_publishable_...).
  // Enquanto vazios, o destaque da transmissão fica oculto e o painel avisa
  // que ainda não foi configurado.
  supabaseUrl: '',
  supabaseKey: '',
});
