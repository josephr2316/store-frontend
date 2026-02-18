# Verificación: Frontend (Vercel) + Backend (Railway)

Guía para comprobar que la app en Vercel se conecta correctamente al backend desplegado en Railway.

---

## 1. Comprobar que el backend en Railway responde

1. En **Railway** → tu proyecto → servicio del backend → **Settings** → **Networking**.
2. Copia la **URL pública** (ej. `https://store-production-3316.up.railway.app`).
3. En el navegador abre:
   ```
   https://TU-URL-RAILWAY.up.railway.app/actuator/health
   ```
   Debe devolver JSON (ej. `{"status":"UP"}`). Si no carga o da error, el backend no está accesible (revisa variables de entorno y base de datos en Railway).

---

## 2. Variables de entorno en Railway (backend)

En el servicio del backend en Railway → **Variables** asegúrate de tener:

| Variable | Descripción |
|----------|-------------|
| `SPRING_DATASOURCE_URL` | URL JDBC de PostgreSQL (Supabase u otro). Con pooler Supabase incluye `&prepareThreshold=0`. |
| `SPRING_DATASOURCE_USERNAME` | Usuario de la base de datos |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña de la base de datos |
| `APP_JWT_SECRET` | Secreto JWT (mín. 32 caracteres) |
| `APP_JWT_EXPIRATION_MS` | Opcional; ej. `86400000` (24 h) |

Si falta la base de datos o el JWT, verás **"Error temporal de base de datos"** o fallos al iniciar.

---

## 3. Configurar la URL del backend en Vercel (frontend)

La URL del API se define **en el build** con la variable `VITE_API_URL`.

1. En **Vercel** → tu proyecto (frontend) → **Settings** → **Environment Variables**.
2. Añade:
   - **Name:** `VITE_API_URL`
   - **Value:** la URL pública de Railway **sin barra final** (ej. `https://store-production-3316.up.railway.app`)
   - **Environment:** marca al menos **Production** (y Preview si quieres).
3. Guarda y haz un **Redeploy** del proyecto (Build se ejecuta de nuevo y usará esta URL).

Si no defines `VITE_API_URL`, el build usa por defecto `https://store-production-3316.up.railway.app`. Si tu backend en Railway tiene **otra** URL, debes ponerla aquí.

---

## 4. CORS (backend)

El backend ya permite orígenes de Vercel (`https://*.vercel.app`). No hace falta configurar nada más en Railway salvo que quieras restringir orígenes; entonces puedes definir:

- `APP_CORS_ALLOWED_ORIGIN_PATTERNS` = `https://tu-dominio.vercel.app,https://*.vercel.app`

---

## 5. Resumen de errores que puedes ver

| Mensaje en la app | Causa probable | Qué revisar |
|-------------------|----------------|-------------|
| **No se pudo conectar con el servidor** | El frontend no llega al backend (red/CORS/URL). | 1) ¿`/actuator/health` de Railway responde en el navegador? 2) ¿`VITE_API_URL` en Vercel es exactamente la URL de Railway? 3) Redeploy en Vercel después de cambiar `VITE_API_URL`. |
| **Error temporal de base de datos** | El backend sí responde pero falla el acceso a la BD. | Variables `SPRING_DATASOURCE_*` en Railway; que la BD esté activa y acepte conexiones. |
| **Sesión expirada** | Token JWT inválido o caducado. | Iniciar sesión de nuevo. Si persiste, revisa `APP_JWT_SECRET` y `APP_JWT_EXPIRATION_MS` en Railway. |

---

## 6. Comprobar en el navegador

1. Abre la app en Vercel e inicia sesión.
2. Abre **DevTools** (F12) → pestaña **Network**.
3. Recarga la página o navega a Caja / Reportes.
4. Busca peticiones a tu dominio de Railway (ej. `store-production-3316.up.railway.app`).
   - Si no aparece ninguna: la URL del API no es la de Railway (revisa `VITE_API_URL` y redeploy).
   - Si aparecen y salen en rojo (CORS o failed): revisa que el backend esté en marcha y que CORS permita tu origen Vercel.
