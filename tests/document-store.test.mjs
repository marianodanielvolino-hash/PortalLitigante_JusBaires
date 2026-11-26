import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const flow = JSON.parse(readFileSync(new URL('../flowise/flujo-document-store.json', import.meta.url), 'utf8'));
const guardCode = flow.nodes.find(({ id }) => id === 'customFunctionAgentflow_0').data.inputs.customFunctionJavascriptFunction;
const answerCode = flow.nodes.find(({ id }) => id === 'customFunctionAgentflow_1').data.inputs.customFunctionJavascriptFunction;
const guard = new Function('$flow', guardCode);
const render = new Function('$flow', '$retrieved', '$resolved', answerCode);
const answer = (flow, docs) => render(flow, docs, guard(flow));
const fixture = {
  pageContent: '# Inicio de una causa\n\nFicha VEC-PL-ESC-03\n\nConsultas relacionadas: inicio de una causa, abrir una causa\n\nRespuesta:\nUsá el circuito del Portal.\n\nFuente oficial: https://eje.juscaba.gob.ar/iol-ui/p/inicio'
};

test('menús, datos personales y urgencias responden antes de la búsqueda', () => {
  assert.match(guard({ input: 'menú' }), /Respondé con un número/);
  assert.match(guard({ input: 'Mi contraseña es ficticia' }), /evitá compartir/);
  assert.match(guard({ input: 'DNI: 00000001' }), /evitá compartir/);
  assert.match(guard({ input: 'vencimiento hoy' }), /posible vencimiento/);
  assert.match(guard({ input: 'x'.repeat(3001) }), /Resumí tu consulta/);
  assert.equal(guard({ input: '¿Cómo abro una causa?' }), 'Consulta documental: Texto: ¿Cómo abro una causa?');
});

test('la ficha encontrada aporta la respuesta y la URL oficial', () => {
  assert.match(answer({ input: 'Quiero abrir una causa' }, JSON.stringify([fixture])), /Usá el circuito.*\n\n\[Portal del Litigante\]/);
  const malformed = { pageContent: fixture.pageContent.replace('https://eje.juscaba.gob.ar/iol-ui/p/inicio', 'https://example.org/') };
  assert.match(answer({ input: 'Inicio de una causa' }, JSON.stringify([malformed])), /¿En qué pantalla del Portal estás/);
  assert.match(answer({ input: 'Una consulta sin relación' }, JSON.stringify([fixture])), /¿En qué pantalla del Portal estás/);
});

test('códigos del menú permiten entrar y volver sin estado de sesión', () => {
  assert.match(guard({ input: '3' }), /3\.1 Inicio de una causa/);
  assert.equal(guard({ input: '3.1' }), 'Consulta documental: [VEC-PL-ESC-03] Inicio de una causa');
  assert.match(guard({ input: '3.9' }), /Ese código no figura/);
  assert.match(guard({ input: '0' }), /Portal del Litigante · Justicia de la Ciudad/);
  assert.match(guard({ input: 'finalizar' }), /Gracias por consultar/);
  assert.match(guard({ input: 'contacto' }), /Oficina de Defensa del Litigante/);
  assert.match(guard({ input: '1.5' }), /posible vencimiento/);
  assert.match(answer({ input: '3.1' }, JSON.stringify([fixture])), /3 · Volver/);
  assert.match(answer({ input: '3.2' }, JSON.stringify([fixture])), /no pude consultar/);
});

test('84 formulaciones llegan a su intención o a la derivación urgente', () => {
  const probes = JSON.parse(readFileSync(new URL('./consultas-naturales.json', import.meta.url)));
  let total = 0;
  for (const [code, questions] of Object.entries(probes)) {
    for (const input of questions) {
      assert.equal(guard({ input }), guard({ input: code }), input);
      total++;
    }
  }
  assert.equal(total, 84);
});

test('aclara una consulta ambigua y ofrece contacto si faltan fichas', () => {
  assert.match(guard({ input: 'expediente' }), /iniciar una causa nueva o buscar una que ya existe/);
  assert.match(answer({ input: '3.1' }, '[]'), /no pude consultar.*[\s\S]*4008-0216/);
});

test('responde a incidentes cotidianos antes de consultar la base', () => {
  const groups = [
    [/Sin conexión a internet/, 'No tengo internet, que hago ?', 'Se me cortó el wifi', 'Estoy sin conexión'],
    [/Corte de luz en el estudio/, 'No puedo entra xq no tengo luz en mi estudio ?', 'Se fue la luz', 'Se cortó la electricidad en la oficina'],
    [/No puedo abrir el Portal/, 'Está caído el portal', 'El portal está caído?', 'No puedo ingresar al Portal', 'El Portal queda en blanco'],
    [/Se cerró la sesión/, 'Me deslogueó', 'Se me venció la sesión'],
    [/Cómo verificar si se envió/, 'No sé si se envió', 'Mandé dos veces el escrito', 'No tengo constancia', 'Se tildó al enviar'],
    [/Se interrumpió la firma/, 'La firma quedó a medias', 'Se cerró el firmador'],
    [/Usar el Portal desde otro dispositivo/, '¿Puedo entrar desde el celu?', 'No tengo computadora']
  ];
  for (const [expected, ...cases] of groups) {
    for (const input of cases) {
      const result = guard({ input });
      assert.match(result, expected, input);
      assert.match(result, /https:\/\/eje\.juscaba\.gob\.ar\/iol-ui\/p\/inicio/);
      assert.match(result, /contacto/);
    }
  }
  assert.match(guard({ input: 'No tengo internet y me vence el plazo hoy' }), /contactá de inmediato/);
  assert.match(guard({ input: 'Se cortó la luz y tengo que presentar el escrito hoy' }), /contactá de inmediato/);
  assert.match(guard({ input: 'No tengo internet, mi contraseña es ficticia' }), /evitá compartir contraseñas/);
  assert.match(guard({ input: 'No puedo ingresar porque olvidé la contraseña' }), /^Consulta documental:/);
  assert.match(guard({ input: '¿Cómo firmo una presentación desde el celular?' }), /^Consulta documental:/);
});
