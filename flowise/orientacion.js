const normalize = (value) => String(value ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const portal = '[Portal del Litigante](https://eje.juscaba.gob.ar/iol-ui/p/inicio)';
const publicSearch = '[Consulta Pública de EJE](https://eje.juscaba.gob.ar/iol-ui/)';
const sign = '[Firma Digital Remota](https://firmar.gob.ar/firmador/)';
const office = '[Oficina de Defensa del Litigante](https://consejo.jusbaires.gob.ar/institucional/organigrama/oficina-de-defensa-del-litigante/)';
const contact = 'Podés comunicarte con la ' + office + ' al (011) 4008-0216 / 0272 o por correo a odl@jusbaires.gob.ar.';
const navigation = '\n\nEscribí **menú** para ver las opciones.';
const areas = [
  ['REG', 'Registro y acceso'], ['FD', 'Firma digital'], ['ESC', 'Escritos judiciales'],
  ['CED', 'Cédulas y notificaciones'], ['CON', 'Consultas y servicios'], ['SOP', 'Soporte técnico']
];
const topicAliases = {
  'VEC-PL-ESC-03': [
    'inicio de una causa', 'inicio de causa', 'iniciar una causa', 'iniciar causa',
    'abrir una causa', 'abrir causa', 'nueva causa', 'causa nueva',
    'inicio de una demanda', 'inicio de demanda', 'iniciar una demanda', 'iniciar demanda',
    'presentar una demanda', 'presentar demanda', 'cargar una demanda', 'sorteo de causa'
  ]
};

function answer(message, cards) {
  const input = String(message ?? '').slice(0, 3000);
  const q = normalize(input);
  if (/\b(?:venc\w* hoy|plazo (?:perentorio|judicial|vence)|in extremis|habilitacion urgente|alta urgente|caducidad|prescripcion)\b/.test(q)) {
    return 'Si hay un posible vencimiento judicial, contactá de inmediato a tu profesional o a la dependencia que interviene para confirmar cómo proceder. Para asistencia con el Portal, ' + contact + ' El chat no confirma plazos ni registra presentaciones.';
  }
  if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b\d{7,11}\b|\b\d{2}-\d{8}-\d\b|\b(?:mi|el|la) (?:clave|otp|pin|contrasena|dni|cuit|cuil|codigo) (?:es|son)\b/i.test(input)) {
    return 'Para cuidar tu información, evitá compartir contraseñas, códigos o identificadores personales por este chat. Contame qué trámite querés hacer sin incluir esos datos.' + navigation;
  }
  if (/\b(?:humano|operador|hablar con alguien|atencion personal|mi ticket|estado del ticket|abrir ticket|generar ticket)\b/.test(q)) return contact + ' Este chat brinda orientación técnica.';
  if (/\b(?:me conviene|que estrategia|que recurso (?:debo|puedo)|calcul\w+.*plazo|cuando vence|asesoramiento legal|que debo alegar)\b/.test(q)) {
    return 'Puedo orientarte en el uso del Portal. Para una decisión sobre tu caso o un plazo, consultá con tu profesional o con la dependencia que interviene.' + navigation;
  }
  if (/\b(?:fuero nacional|fuero federal|lex100|scba|provincia de buenos aires|tribunal electoral|padron electoral)\b/.test(q)) {
    return 'Este chat orienta sobre el Portal del Litigante del Poder Judicial de la Ciudad de Buenos Aires. Para esa consulta, usá el canal del organismo que interviene.' + navigation;
  }
  if (!q || /^(?:hola|buen dia|buenas|menu|menu principal|inicio|volver|atras|ayuda)$/.test(q)) {
    return '¡Hola! Soy el asistente de orientación para el Portal del Litigante. Elegí un número o contame tu consulta.\n\n' +
      areas.map(([, name], index) => (index + 1) + '. ' + name).join('\n');
  }
  const selected = q.match(/^(?:opcion )?([1-6])$/);
  const area = selected ? areas[Number(selected[1]) - 1] : areas.find(([, name]) => normalize(name) === q);
  if (area) {
    return '**' + area[1] + '**\n\n¿Sobre qué tema necesitás orientación?\n\n' +
      cards.filter((card) => card.area === area[0]).map((card) => '- ' + card.title).join('\n') + navigation;
  }
  const words = ' ' + q + ' ';
  const hits = cards.map((card) => {
    const phrases = [card.title, ...card.triggers, ...(topicAliases[card.id] ?? [])];
    return {
      card,
      score: Math.max(0, ...phrases.map(normalize).filter((phrase) => phrase && words.includes(' ' + phrase + ' '))
        .map((phrase) => phrase.split(' ').length))
    };
  }).filter((hit) => hit.score > 0).sort((a, b) => b.score - a.score);
  const exactTitle = hits.find(({ card }) => normalize(card.title) === q);
  if (exactTitle) return renderCard(exactTitle.card);
  if (!hits.length) return 'No encontré una guía concreta para esa consulta. Decime qué estabas intentando hacer en el Portal y en qué pantalla te trabaste. ' + contact + navigation;
  if (hits[1]?.score === hits[0].score) return '¿Tu consulta es sobre **' + hits[0].card.title + '** o sobre **' + hits[1].card.title + '**?' + navigation;
  return renderCard(hits[0].card);
}

function renderCard(card) {
  const links = { portal, publicSearch, sign, office, contact };
  return '**' + card.title + '**\n\n' + card.answer + '\n\n' + links[card.resource] + navigation;
}
