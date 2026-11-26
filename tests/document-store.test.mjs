import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const flow = JSON.parse(readFileSync(new URL('../flowise/flujo-document-store.json', import.meta.url), 'utf8'));
const guardCode = flow.nodes.find(({ id }) => id === 'customFunctionAgentflow_0').data.inputs.customFunctionJavascriptFunction;
const answerCode = flow.nodes.find(({ id }) => id === 'customFunctionAgentflow_1').data.inputs.customFunctionJavascriptFunction;
const guard = new Function('$flow', guardCode);
const answer = new Function('$flow', '$retrieved', answerCode);
const fixture = {
  pageContent: '# Inicio de una causa\n\nFicha VEC-PL-ESC-03\n\nConsultas relacionadas: inicio de una causa, abrir una causa\n\nRespuesta:\nUsá el circuito del Portal.\n\nFuente oficial: https://eje.juscaba.gob.ar/iol-ui/p/inicio'
};

test('menús, datos personales y urgencias responden antes de la búsqueda', () => {
  assert.match(guard({ input: 'menú' }), /Elegí un número/);
  assert.match(guard({ input: 'Mi contraseña es ficticia' }), /evitá compartir/);
  assert.match(guard({ input: 'DNI: 00000001' }), /evitá compartir/);
  assert.match(guard({ input: 'vencimiento hoy' }), /posible vencimiento/);
  assert.match(guard({ input: 'x'.repeat(3001) }), /Resumí tu consulta/);
  assert.equal(guard({ input: '¿Cómo abro una causa?' }), 'BUSCARFICHA');
});

test('la ficha encontrada aporta la respuesta y la URL oficial', () => {
  assert.match(answer({ input: 'Quiero abrir una causa' }, JSON.stringify([fixture])), /Usá el circuito.*\n\n\[Portal del Litigante\]/);
  const malformed = { pageContent: fixture.pageContent.replace('https://eje.juscaba.gob.ar/iol-ui/p/inicio', 'https://example.org/') };
  assert.match(answer({ input: 'Inicio de una causa' }, JSON.stringify([malformed])), /No encontré una ficha/);
  assert.match(answer({ input: 'Una consulta sin relación' }, JSON.stringify([fixture])), /No encontré una ficha/);
});
