# 00_PortalLitigante_JusBaires

Asistente de orientación técnica para el Portal del Litigante de la Ciudad Autónoma de Buenos Aires. El Agentflow V2 maneja un menú de seis áreas, responde con 28 fichas operativas y ofrece el canal oficial de atención humana.

## Funcionamiento

El flujo activo consulta `KB_PORTAL_LITIGANTE_JUSBAIRES` por medio de un nodo Retriever. El Document Store contiene las 28 fichas con el identificador, las expresiones relacionadas, la respuesta revisada y la URL oficial. El índice usa OpenAI `text-embedding-3-small` y Faiss, con cinco resultados por consulta. El menú, la privacidad, las urgencias y la derivación se resuelven antes del Retriever. La respuesta muestra la ficha compatible con la consulta y su enlace oficial. Las variantes conocidas apuntan a una ficha por ID y las demás pasan por recuperación semántica con comprobación de coincidencia. Las consultas ambiguas reciben una pregunta concreta y, si faltan resultados, se ofrece el teléfono y el correo oficiales de la ODL.

## Navegación para chat móvil

- Menú principal `1`–`6`, subopciones con códigos completos y consultas en lenguaje natural. Ejemplo `3` → `3.1` abre la ficha **Inicio de una causa**.
- El pie de cada ficha indica el número del área para volver y `0` para abrir el menú principal. También se entienden `menú`, `volver`, `contacto` y `finalizar`.
- Los códigos son estables y se pueden usar desde una conversación nueva. El asistente no pide que se copie el título de la ficha ni depende de recordar el último menú.
- Se validaron los 28 códigos y 14 comprobaciones adicionales en el chat interno de Flowise. La opción `1.5` se deriva directamente por urgencia.

El chat de Flowise tiene tres accesos iniciales configurados en el panel del agente: **Menú**, **Iniciar una causa** y **Contacto**.

### Futuro canal WhatsApp

El flujo entrega texto utilizable con selección por número. La futura integración puede convertir el menú principal y los submenús en listas de WhatsApp, usando los mismos códigos como identificadores de las filas. Los botones de respuesta se pueden reservar para acciones breves, como volver o ir al menú. El transporte debe enviar solo la respuesta final al ciudadano, sin la traza técnica de Flowise. Para los mensajes de texto, debe convertir las negritas y enlaces al formato de WhatsApp.

[Documentación de mensajes interactivos de Meta](https://developers.facebook.com/docs/whatsapp/guides/interactive-messages/?locale=es_ES)

## Ayuda técnica cotidiana

Los cortes de internet o luz, el Portal que no abre, la sesión interrumpida, las dudas sobre el envío, la firma interrumpida y el uso de otro dispositivo tienen respuestas directas. El agente indica qué probar y sugiere verificar la presentación o la constancia antes de repetir un envío. Las variantes sobre PDF y ventanas emergentes apuntan a las fichas de soporte del Document Store.

Los filtros de privacidad y las urgencias conservan prioridad. La actualización se probó en el flujo original con 14 casos, incluidas las dos consultas de conectividad y luz reportadas, una urgencia, un caso de privacidad y un recorrido documental.

## Configuración y mantenimiento

1. Para actualizar una ficha en Flowise, editá el cargador **28 fichas del Portal del Litigante**. Conservá el encabezado, el ID `VEC-PL-…`, los rótulos `Consultas relacionadas:`, `Respuesta:` y `Fuente oficial:`, y el delimitador `<<<FIN-DE-FICHA>>>` entre fichas.
2. Previsualizá los fragmentos y verificá que cada uno contenga una ficha. Procesá el documento y ejecutá **Upsert All Chunks**. Confirmá el estado `UPSERTED` y probá las consultas afectadas en **Retrieval Query** y en el chat interno.
3. Para restaurar el flujo en otra instancia, importá [flujo-document-store.json](flowise/flujo-document-store.json), seleccioná el Document Store de esa instancia en **Buscar en la base del Portal**, guardá y probá el flujo. El export es portátil y se distribuye con el selector de base vacío.

## Pruebas y reversión

Validación del 26 de noviembre de 2026 en el Agentflow original: 84 de 84 consultas naturales, 7 de 7 comprobaciones adicionales y 11 de 11 pruebas automatizadas. Las 84 entradas son variantes configuradas, tres por tema. El conjunto adicional cubrió una variante libre ajena al conjunto, ambigüedad, contacto, privacidad, menú, cierre y consulta fuera de alcance. El aviso de contingencia se verifica con resultados vacíos. Una excepción del nodo nativo Retriever antes de devolver resultados sigue bajo el manejo de errores de Flowise.

En el chat interno se validaron los 28 temas y 16 casos adicionales de navegación, variantes de consulta, privacidad y derivación. El tema de habilitación urgente tomó la ruta de atención directa. La consulta «Inicio de una causa» recuperó `VEC-PL-ESC-03` como primer resultado.

```bash
node --test tests/*.test.mjs
```

`flowise/compilar.py` conserva la compilación de la versión anterior para reversión. Requiere `openpyxl`, el XLSX original y las fichas curadas, que se manejan fuera del repositorio público. Para revertir un despliegue, cargá el respaldo JSON previo en el mismo Agentflow y guardalo desde el canvas.

## Fuentes de referencia

- [Oficina de Defensa del Litigante](https://consejo.jusbaires.gob.ar/institucional/organigrama/oficina-de-defensa-del-litigante/)
- [Consulta Pública de EJE](https://eje.juscaba.gob.ar/iol-ui/)
- [Portal del Litigante](https://eje.juscaba.gob.ar/iol-ui/p/inicio)
