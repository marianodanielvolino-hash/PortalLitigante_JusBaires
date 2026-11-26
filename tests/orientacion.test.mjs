import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const code = readFileSync(new URL('../flowise/orientacion.js', import.meta.url), 'utf8');
const answer = new Function('input', 'cards', code + '\nreturn answer(input, cards);');
const cards = [
  { area: 'REG', title: 'Alta de prueba', triggers: ['crear cuenta'], answer: 'Usá el formulario oficial.', resource: 'portal' },
  { area: 'SOP', title: 'Error de prueba', triggers: ['crear cuenta', 'no veo la causa'], answer: 'Revisá la pantalla.', resource: 'publicSearch' }
];

test('menú y navegación', () => {
  assert.equal((answer('Hola', cards).match(/^\d+\. /gm) ?? []).length, 6);
  assert.match(answer('opción 1', cards), /Alta de prueba/);
  assert.doesNotMatch(answer('menú', cards), /https?:/);
});
test('orientación sustentada y desambiguación', () => {
  assert.match(answer('No veo la causa', cards), /Consulta Pública de EJE/);
  assert.match(answer('Quiero crear cuenta', cards), /¿Tu consulta es sobre/);
});
test('contacto, urgencia y privacidad', () => {
  assert.match(answer('Quiero hablar con un operador', cards), /4008-0216/);
  assert.match(answer('Tengo un vencimiento hoy', cards), /no confirma plazos/);
  assert.doesNotMatch(answer('Mi DNI es 12345678', cards), /12345678/);
});
test('derivación y límite de jurisdicción', () => {
  assert.match(answer('Fuero nacional', cards), /organismo que interviene/);
  assert.match(answer('Una pregunta ajena al tema', cards), /No encontré/);
});
