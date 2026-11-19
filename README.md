# RAGFlow Expedientes — Chatbot

Front aparte (Vue 3 + Vite) para consultar expedientes con botones de preguntas predeterminadas y un campo de texto libre. Habla con el orquestador n8n (`consulta-expedientes-rag`) y con el servicio de seguridad **a través de un proxy de Vite**, por lo que no hay CORS ni se necesita ngrok.

```
Navegador ──► localhost:3001 (Vite) ──/n8n──────► n8n local (:5678) ──► Backend RAG / Gemini
                                     └─/seguridad─► Servicio de seguridad (login)
```

## Requisitos
- Node 18 o superior (probado con Node 22 y npm 10).
- n8n levantado en `http://localhost:5678`.
- Acceso de red al servicio de seguridad (`SEGURIDAD_URL`).

## Paso a paso en VS Code

### 1. Preparar n8n (una sola vez)
1. Abrir `http://localhost:5678`.
2. **Desactivar** el workflow anterior `Consulta expedientes RAG - orquestador` (dos workflows con el mismo webhook no pueden estar activos a la vez).
3. Importar `src/other/data1/Consulta expedientes RAG - orquestador v2.json` (menú ⋯ → *Import from file*).
4. En los nodos **Interpretar pregunta** y **Redactar respuesta** comprobar que la credencial sea **Gemini API**. Si n8n la perdió, volver a seleccionarla.
5. Activar el workflow con el interruptor **Active** (arriba a la derecha). El chatbot usa la URL de producción `/webhook/…`, no `/webhook-test/…`.

### 2. Abrir el proyecto en VS Code
1. **File → Open Folder…** y elegir `C:\Users\lestalla\Pictures\chatbotRAGFLOW`.
2. Abrir la terminal integrada (**Terminal → New Terminal**).
3. Comprobar: `node -v` y `npm -v`.

### 3. Instalar y revisar la configuración
```
npm install
```
Revisar el archivo `.env` (solo URLs, sin claves):

| Variable | Valor por defecto |
|---|---|
| `N8N_URL` | `http://localhost:5678` |
| `N8N_WEBHOOK_PATH` | `/webhook/consulta-expedientes-rag` |
| `SEGURIDAD_URL` | `http://172.29.55.29:8084/api/v1` (el `VITE_API_SEGURIDAD` del `.env.dev` del front) |

Si cambia el `.env`, reinicie el servidor.

### 4. Levantar el front
```
npm run dev
```
Abrir `http://localhost:3001`. Para detenerlo: `Ctrl + C`.

### 5. Usarlo
1. Ingresar con su usuario y clave (los valida el servicio de seguridad).
2. Elegir un botón de **Consultas** (sin IA) o de **Con IA**, o escribir una pregunta (3 a 500 caracteres).
3. En un listado, usar **Detalle** o **Trazabilidad** de cada fila, sin conocer el id.
4. En un resumen aparece siempre la insignia **«Analizados X de Y»**, tomada de los datos del orquestador.

## Comandos
| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 3001 |
| `npm test` | 16 pruebas de la lógica (catálogo, sesión, errores, cobertura) |
| `npm run build` | Compilación de producción en `dist/` |

## Solución de problemas
| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| «El orquestador no está activo» | Workflow inactivo en n8n | Activarlo (**Active**) |
| «No hay conexión con el orquestador» | n8n apagado o `N8N_URL` incorrecta | Levantar n8n y revisar `.env` |
| «No se pudo conectar con el servicio de seguridad» | Sin red a `SEGURIDAD_URL` o URL incorrecta | Revisar `.env` y la VPN/red |
| «Su sesión venció» | Token vencido (`AUTH_002`) | Ingresar de nuevo |
| Puerto 3001 en uso | Otro proceso lo ocupa | Cerrarlo; el puerto está fijo (`strictPort`) |
| Las preguntas con IA tardan | Dos llamadas al modelo | Esperar hasta 60 s |

## Seguridad
- La clave de Gemini permanece en n8n; el navegador nunca la ve.
- La contraseña no se guarda. El token vive en `sessionStorage` y se borra al cerrar la pestaña.
- El perfil sale del login (no se elige libremente). Quien tiene varios perfiles ve un selector solo con los suyos.
- El backend sigue decidiendo los permisos: el orquestador solo reenvía el token.

## Estructura
```
chatbotRAGFLOW/
├─ vite.config.js        proxy /n8n y /seguridad, puerto 3001
├─ .env                  URLs de destino
├─ src/
│  ├─ catalogo.js        preguntas predeterminadas (datos)
│  ├─ presentacion.js    cobertura «analizados X de Y», fechas
│  ├─ servicios/         auth.js, orquestador.js, errores.js
│  └─ componentes/       LoginView, ChatView, MensajeBot, VistaDatos
└─ tests/logica.test.js
```

Para agregar una pregunta, añadir un registro en `src/catalogo.js` (perfiles, tipo de consulta, parámetros).
