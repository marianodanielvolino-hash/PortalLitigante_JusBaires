# 00_PortalLitigante_JusBaires

Asistente de orientación técnica para el Portal del Litigante de la Ciudad Autónoma de Buenos Aires. El Agentflow V2 maneja un menú de seis áreas, responde con 28 fichas operativas y ofrece el canal oficial de atención humana.

## Funcionamiento

La primera versión busca expresiones normalizadas en fichas curadas y pide precisión cuando hay un empate. Ante falta de evidencia, orienta al canal oficial. Evita confirmar plazos, interpretar casos, solicitar credenciales o anunciar tickets y transferencias. Usa un flujo propio, separado del proyecto electoral.

## Compilación y pruebas

El XLSX original y las fichas curadas se manejan internamente. El compilador coteja los IDs de las fichas con los registros del Portal en el XLSX y genera el JSON que se importa en Flowise. El directorio público contiene la lógica, el esquema y pruebas sintéticas.

```bash
python flowise/compilar.py /ruta/interna/base.xlsx /ruta/interna/fichas-operativas.json /ruta/interna/agente.json
node --test tests/orientacion.test.mjs
```

El compilador requiere `openpyxl`. Importar el JSON como Agentflow V2 y ejecutar las pruebas desde el chat interno. El generador prepara un piloto sin integraciones externas.

## Fuentes de referencia

- [Oficina de Defensa del Litigante](https://consejo.jusbaires.gob.ar/institucional/organigrama/oficina-de-defensa-del-litigante/)
- [Consulta Pública de EJE](https://eje.juscaba.gob.ar/iol-ui/)
- [Portal del Litigante](https://eje.juscaba.gob.ar/iol-ui/p/inicio)
