import { createPool, Pool, RowDataPacket } from 'mysql2/promise';
import * as dotenv from 'dotenv';

// Interfaces para los resultados
interface Firma extends RowDataPacket {
  id: number;
  horaIngreso: Date;
  estado: string;
  [key: string]: any; // Para otros campos que puedan venir del procedimiento
}

interface FirmaResult {
  firmas: Firma[];
  totalPaginas?: number;
}

// Cargar variables de entorno desde el archivo .env
dotenv.config();

// Configuración de la base de datos (personalizable mediante variables de entorno)
const DB_HOST = process.env['DB_HOST'] || 'localhost';
const DB_PORT = Number(process.env['DB_PORT'] || 3306);
const DB_USER = process.env['DB_USER'] || 'root';
const DB_PASS = process.env['DB_PASS'] || '';
const DB_NAME = process.env['DB_NAME'] || 'firmasecuador';

let pool: Pool | null = null;

// Función para obtener el pool de conexiones
function getPool(): Pool {
  if (!pool) {
    pool = createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true
    });
  }
  return pool;
}

// Buscar usuario por ID
export async function findUserById(usuid: string): Promise<any | null> {
  const p = getPool();
  try {
    const [rows] = await p.query('SELECT * FROM seg_maeusuario WHERE USUIDENTIFICACION = ?', [usuid]);
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch (error) {
    console.error(`Error al encontrar el usuario con ID ${usuid}:`, error);
    throw new Error('Error al buscar el usuario.');
  }
}

// Validar credenciales de usuario
export async function validateUser(identificacion: string, nombre: string): Promise<any | null> {
  const p = getPool();
  try {
    const [rows] = await p.query(
      'SELECT * FROM seg_maeusuario WHERE USUIDENTIFICACION = ? AND USUNOMBRE = ?',
      [identificacion, nombre]
    );
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch (error) {
    console.error('Error al validar usuario:', error);
    throw new Error('Error al validar las credenciales.');
  }
}

// Crear un nuevo usuario
export async function createUser(data: any): Promise<any> {
  const p = getPool();

  // Mapeo de campos del formulario a las columnas reales de la tabla
  const mapping: Record<string, string> = {
    usuid: 'USUIDENTIFICACION',
    usuclave: 'USUCLAVE',
    usuruci: 'USURUCI',
    usuapellido: 'USUAPELLIDO',
    usunombre: 'USUNOMBRE',
    comcodigo: 'COMCODIGO',
    usuperfil: 'USUPERFIL',
    usuFechainicio: 'USUFECHAINICIO',
    usuFechafinal: 'USUFECHAFINAL',
    nivel: 'NIVEL',
    direccion: 'DIRECCION',
    perfil_codigo: 'PERFIL_CODIGO',
    ven_codigo: 'VEN_CODIGO',
    telefono: 'telefono',
    correo: 'correo',
    horaIngreso: 'horaIngreso',
    id_f: 'id_f',
    bod_codigo: 'BOD_CODIGO',
    lazzate: 'LAZZATE',
    empresa: 'EMPRESA',
    pto_emision: 'PTO_EMISION',
    nuevo_usr: 'nuevo_usr',
    regalo: 'regalo',
    firma_un_anio: 'firma_un_anio',
    puntos_reclamados: 'puntos_reclamados'
  };

  // Comprobar si los datos ya tienen nombres de columnas de base de datos
  const hasDbKeys = Object.keys(data).some((k) => k === 'USUIDENTIFICACION' || k === 'USUCLAVE');
  const row: Record<string, any> = {};

  // Si los datos ya tienen las columnas en el formato de la base de datos, usarlos tal cual
  if (hasDbKeys) {
    for (const key of Object.keys(data)) {
      if (data[key] !== undefined && data[key] !== null) row[key] = data[key];
    }
  } else {
    // Si los datos no tienen nombres de columna correctos, hacer el mapeo
    for (const key of Object.keys(mapping)) {
      if (data[key] !== undefined && data[key] !== null) {
        row[mapping[key]] = data[key];
      }
    }
  }

  // Validar que al menos un campo válido ha sido proporcionado
  const fields = Object.keys(row);
  if (fields.length === 0) throw new Error('No hay campos válidos para insertar');

  const values = fields.map((f) => row[f]);
  const placeholders = fields.map(() => '?').join(',');
  const sql = `INSERT INTO seg_maeusuario (${fields.join(',')}) VALUES (${placeholders})`;

  try {
    const [result] = await p.query(sql, values);
    return result;
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    throw new Error('Error al crear el usuario.');
  }
}

  // Obtener firmas por fecha con paginación
export async function getFirmasPorFecha(fechaInicio: string, fechaFin: string, pagina: number, porPagina: number): Promise<FirmaResult> {
  const p = getPool();
  const offset = (pagina - 1) * porPagina;
  
  try {
    // Llamar al procedimiento para obtener los registros
    const [results] = await p.query<Firma[][]>('CALL obtener_registros_por_fechas(?, ?)', [fechaInicio, fechaFin]);
    let firmas = results[0] || [];

    // Aplicar paginación en memoria
    const inicio = (pagina - 1) * porPagina;
    const fin = inicio + porPagina;
    firmas = firmas.slice(inicio, fin);

    // Obtener el total de registros para la paginación
    const [totalResult] = await p.query(
      'SELECT COUNT(*) AS total_firmas FROM firmasecuador.registroa WHERE DATE(horaIngreso) BETWEEN ? AND ?',
      [fechaInicio, fechaFin]
    );
    
    const total = Array.isArray(totalResult) ? (totalResult[0] as any).total_firmas : 0;
    const totalPaginas = Math.ceil(total / porPagina);

    return {
      firmas,
      totalPaginas
    };
  } catch (error) {
    console.error('Error al obtener firmas por fecha:', error);
    throw new Error('Error al obtener firmas por fecha.');
  }
}  // Obtener firmas por estado
export async function getFirmasEstado(fechaInicio: string, fechaFin: string, estado: string = 'Todos'): Promise<FirmaResult> {
  const p = getPool();
  try {
    // Llamar al procedimiento almacenado FirmasporVencer
    const [results] = await p.query<Firma[][]>('CALL FirmasporVencer(?, ?, ?)', [fechaInicio, fechaFin, estado]);
    const firmas = results[0] || [];

    return { firmas };
  } catch (error) {
    console.error('Error al obtener firmas por estado:', error);
    throw new Error('Error al obtener firmas por estado.');
  }
}

// Nueva función para exportar a Excel
export async function getFirmasParaExcel(fechaInicio: string, fechaFin: string, tipo: string = 'firmas_fecha', estado: string = 'Todos'): Promise<Firma[]> {
  const p = getPool();
  try {
    let sql: string;
    let params: any[];

    if (tipo === 'firmas_fecha') {
      sql = 'CALL obtener_registros_por_fechas(?, ?)';
      params = [fechaInicio, fechaFin];
    } else if (tipo === 'firmas_caducar') {
      sql = 'CALL FirmasporVencer(?, ?, ?)';
      params = [fechaInicio, fechaFin, estado];
    } else {
      throw new Error('Tipo de consulta no válido');
    }

    const [results] = await p.query<Firma[][]>(sql, params);
    return results[0] || [];
  } catch (error) {
    console.error('Error al obtener datos para Excel:', error);
    throw new Error('Error al obtener datos para Excel.');
  }
}