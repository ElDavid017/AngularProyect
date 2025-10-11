/* Dev backend server (JS) to provide /firmas endpoints during development
   Uses stored procedures: obtener_registros_por_fechas, FirmasporVencer
*/

// Permitir especificar la ruta del archivo .env como argumento: `node dev-server.js .env.remote`
const envPath = process.argv[2] || process.env.ENVFILE || '.env';
require('dotenv').config({ path: envPath });
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const XLSX = require('xlsx');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Redirigir la raíz del backend al frontend para evitar 'Cannot GET /' cuando se abre el servidor API directamente
app.get('/', (req, res) => {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:4200';
  return res.redirect(frontend);
});

// Si el navegador solicita una página HTML (por ejemplo al recargar una ruta SPA como /firmas),
// redirigir al frontend para que sea Angular quien resuelva la ruta.
app.use((req, res, next) => {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:4200';
  // Solo aplicar para peticiones GET que acepten HTML
  if (req.method === 'GET' && req.accepts && req.accepts('html')) {
    return res.redirect(frontend + req.originalUrl);
  }
  next();
});

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'firmasecuador',
  multipleStatements: true,
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error al conectar a la base de datos:', err);
    return;
  }
  console.log(`✅ Conectado a la base de datos '${process.env.DB_NAME || 'firmasecuador'}' en ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306} (env: ${envPath})`);
});

// (GET /firmas removed to avoid SPA reload issues; use POST /obtener-registros)
// POST equivalente a /firmas (para frontend que envía JSON)
app.post('/obtener-registros', (req, res) => {
  const { fecha_inicio, fecha_fin, pagina = 1, por_pagina = 10, generarExcel = false } = req.body;
  if (!fecha_inicio || !fecha_fin) return res.status(400).send('Debes proporcionar ambas fechas.');

  const sql = `CALL obtener_registros_por_fechas(?, ?)`;
  console.log('POST /obtener-registros', { fecha_inicio, fecha_fin, pagina, por_pagina, generarExcel });

  db.query(sql, [fecha_inicio, fecha_fin], (err, results) => {
    if (err) {
      console.error('❌ Error en la consulta (POST obtener-registros):', err);
      return res.status(500).send('Error en la consulta.');
    }

    let firmas = Array.isArray(results) && results[0] ? results[0] : [];

    // Si piden generar Excel, devolvemos el archivo
    if (generarExcel) {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(firmas);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Firmas');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', `attachment; filename=registros_firmas.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    }

    const inicio = (Number(pagina) - 1) * Number(por_pagina);
    const fin = inicio + Number(por_pagina);
    const pageData = firmas.slice(inicio, fin);

    const totalSql = `SELECT COUNT(*) AS total_firmas FROM registroa WHERE DATE(horaIngreso) BETWEEN ? AND ?`;
    db.query(totalSql, [fecha_inicio, fecha_fin], (totalErr, totalResults) => {
      if (totalErr) {
        console.error('❌ Error al obtener el total de firmas (POST):', totalErr);
        return res.status(500).send('Error al obtener el total de firmas.');
      }
      const total = totalResults && totalResults[0] ? totalResults[0].total_firmas : 0;
      const totalPaginas = Math.ceil(total / Number(por_pagina || 10));

      res.json({ firmas: pageData, totalPaginas });
    });
  });
});

// (GET /firmas-estado removed; use POST /firmas-estado)
// POST equivalente a /firmas-estado
app.post('/firmas-estado', (req, res) => {
  const { fecha_inicio, fecha_fin, estado = 'Todos' } = req.body;
  if (!fecha_inicio || !fecha_fin) return res.status(400).send('Debes proporcionar ambas fechas.');

  const sql = `CALL FirmasporVencer(?, ?, ?)`;
  console.log('POST /firmas-estado', { fecha_inicio, fecha_fin, estado });
  db.query(sql, [fecha_inicio, fecha_fin, estado], (err, results) => {
    if (err) {
      console.error('❌ Error en la consulta (POST firmas-estado):', err);
      return res.status(500).send('Error en la consulta.');
    }
    const firmas = Array.isArray(results) && results[0] ? results[0] : [];
    res.json({ firmas });
  });
});

// (GET /exportar-excel removed; use POST /exportar-excel)
// POST equivalente a /exportar-excel (acepta generarExcel en body también)
app.post('/exportar-excel', (req, res) => {
  const { fecha_inicio, fecha_fin, tipo = 'firmas_fecha', estado = 'Todos' } = req.body;
  if (!fecha_inicio || !fecha_fin) return res.status(400).send('Debes proporcionar ambas fechas.');

  let sql;
  let params = [];
  let filename = 'firmas.xlsx';

  if (tipo === 'firmas_fecha') {
    sql = `CALL obtener_registros_por_fechas(?, ?)`;
    params = [fecha_inicio, fecha_fin];
    filename = 'firmas_fecha.xlsx';
  } else if (tipo === 'firmas_caducar') {
    sql = `CALL FirmasporVencer(?, ?, ?)`;
    params = [fecha_inicio, fecha_fin, estado];
    filename = 'firmas_caducar.xlsx';
  } else {
    return res.status(400).send('Tipo de consulta no válido.');
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('❌ Error al generar Excel (POST):', err);
      return res.status(500).send('Error en la consulta.');
    }

    const firmas = Array.isArray(results) && results[0] ? results[0] : [];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(firmas);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Firmas');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);
  });
});

app.listen(port, () => {
  console.log(`Dev backend listening on http://localhost:${port}`);
});
