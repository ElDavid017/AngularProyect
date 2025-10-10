import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import crypto from 'node:crypto';
import cors from 'cors';
import { validateUser } from './server/db';
import { findUserById, createUser } from './server/db';
import { promises as fs } from 'node:fs';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

// Middlewares para API
app.use(cors());
app.use(express.json());

// Endpoints para firmas
import { getFirmasPorFecha, getFirmasEstado, getFirmasParaExcel } from './server/db';

/**
 * API: GET /api/firmas
 * Query params: fecha_inicio, fecha_fin, pagina, por_pagina
 */
app.get('/api/firmas', async (req, res) => {
  const { fecha_inicio, fecha_fin, pagina = 1, por_pagina = 10 } = req.query;
  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ message: 'fecha_inicio y fecha_fin son requeridos' });
  }
  try {
    const firmas = await getFirmasPorFecha(String(fecha_inicio), String(fecha_fin), Number(pagina), Number(por_pagina));
    return res.json(firmas);
  } catch (err) {
    console.error('Error en /api/firmas:', err);
    return res.status(500).json({ message: 'Error al obtener firmas' });
  }
});

/**
 * API: GET /api/firmas-estado
 * Query params: fecha_inicio, fecha_fin, estado
 */
app.get('/api/firmas-estado', async (req, res) => {
  const { fecha_inicio, fecha_fin, estado } = req.query;
  if (!fecha_inicio || !fecha_fin || !estado) {
    return res.status(400).json({ message: 'fecha_inicio, fecha_fin y estado son requeridos' });
  }
  try {
    const firmas = await getFirmasEstado(String(fecha_inicio), String(fecha_fin), String(estado));
    return res.json(firmas);
  } catch (err) {
    console.error('Error en /api/firmas-estado:', err);
    return res.status(500).json({ message: 'Error al obtener firmas por estado' });
  }
});

// Rutas adicionales sin prefijo /api para compatibilidad con frontend antiguo
app.get('/firmas', async (req, res) => {
  const { fecha_inicio, fecha_fin, pagina = 1, por_pagina = 10 } = req.query;
  if (!fecha_inicio || !fecha_fin) return res.status(400).send('fecha_inicio y fecha_fin son requeridos');
  try {
    const result = await getFirmasPorFecha(String(fecha_inicio), String(fecha_fin), Number(pagina), Number(por_pagina));
    return res.json(result);
  } catch (err) {
    console.error('Error en /firmas:', err);
    return res.status(500).send('Error al obtener firmas');
  }
});

app.get('/firmas-estado', async (req, res) => {
  const { fecha_inicio, fecha_fin, estado = 'Todos' } = req.query;
  if (!fecha_inicio || !fecha_fin) return res.status(400).send('fecha_inicio y fecha_fin son requeridos');
  try {
    const result = await getFirmasEstado(String(fecha_inicio), String(fecha_fin), String(estado));
    return res.json(result);
  } catch (err) {
    console.error('Error en /firmas-estado:', err);
    return res.status(500).send('Error al obtener firmas por estado');
  }
});

app.get('/exportar-excel', async (req, res) => {
  const { fecha_inicio, fecha_fin, tipo = 'firmas_fecha', estado = 'Todos' } = req.query;
  if (!fecha_inicio || !fecha_fin) return res.status(400).send('fecha_inicio y fecha_fin son requeridos');
  try {
    const data = await getFirmasParaExcel(String(fecha_inicio), String(fecha_fin), String(tipo), String(estado));
    // devolver JSON; el frontend original descargaba un XLSX desde otra ruta, manejará en frontend si necesita descargar
    return res.json({ data });
  } catch (err) {
    console.error('Error en /exportar-excel:', err);
    return res.status(500).send('Error al exportar a Excel');
  }
});

/**
 * API: POST /api/login
 * Body: { usuid: string, usuclave: string }
 * Respuesta: 200 con datos públicos del usuario o 401
 */
app.post('/api/login', async (req, res) => {
  const { Usuario, Clave } = req.body || {};
  if (!Usuario || !Clave) {
    return res.status(400).json({ message: 'Usuario and Clave are required' });
  }

  try {
    const user = await validateUser(Usuario, Clave);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Devuelve solo campos públicos
    const publicUser = {
      USUIDENTIFICACION: user.USUIDENTIFICACION,
      USUNOMBRE: user.USUNOMBRE,
    };

    // Generar un token simple para el frontend (no es una implementación JWT completa)
    const token = crypto.randomBytes(32).toString('hex');

    return res.json({ token, user: publicUser });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * API: POST /api/signup
 * Body: objeto con campos de seg_maeusuario
 */
app.post('/api/signup', async (req, res) => {
  const data = req.body || {};
  const usuid = data.usuid;
  if (!usuid) return res.status(400).json({ message: 'USUIDENTIFICACION es requerido' });

  try {
    const existing = await findUserById(usuid);
    if (existing) return res.status(409).json({ message: 'Usuario ya existe' });

    // Inserción directa (recuerda validar/sanitizar según sea necesario)
    await createUser(data);
    return res.status(201).json({ message: 'Usuario creado' });
  } catch (err) {
    console.error('Signup error', err);
    // En entorno dev devolvemos message para depuración
    const message = err && (err as any).message ? (err as any).message : 'Error del servidor';
    return res.status(500).json({ message });
  }
});
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
          response
        ? writeResponseToNodeResponse(response, res)
        : // Si Angular no produce una respuesta (por ejemplo rutas cliente como /login),
          // intentamos devolver index.html como fallback para soportar SPA pushState.
          fs
            .access(join(browserDistFolder, 'index.html'))
            .then(() => res.sendFile(join(browserDistFolder, 'index.html')))
            .catch(() => next()),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  // Usar puerto 3000 por compatibilidad con el frontend que llama a http://localhost:3000
  const port = process.env['PORT'] || 3000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

