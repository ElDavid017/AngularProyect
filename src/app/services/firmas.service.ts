import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirmasService {
  private apiPrefix = '/api';

  constructor(private http: HttpClient) {}

  // Buscar registros por fecha (uso general). Devuelve Observable<any> (JSON array)
  buscarRegistrosPorFecha(fechaInicio: string, fechaFin: string, cod_distribuidor?: string): Observable<any> {
    const body: any = {
      fecha_inicio: this.toIsoDate(fechaInicio), // convierte dd/mm/yyyy o ISO según tu UI
      fecha_fin: this.toIsoDate(fechaFin)
    };
    if (cod_distribuidor) body.cod_distribuidor = cod_distribuidor;
    return this.http.post<any>(`${this.apiPrefix}/obtener-registros`, body);
  }

  // Alternativa específica si quieres usar el endpoint de firmas-factura
  buscarFirmasFacturaPorFecha(fechaInicio: string, fechaFin: string): Observable<any> {
    const body = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin)
    };
    return this.http.post<any>(`${this.apiPrefix}/obtener-firmas-factura`, body);
  }

  // Nuevo: buscar facturas por rango de fechas en el endpoint factura-por-fechas
  buscarFacturasPorFechas(fechaInicio: string, fechaFin: string, cod_distribuidor?: string): Observable<any> {
    const body: any = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin)
    };
    if (cod_distribuidor) body.cod_distribuidor = cod_distribuidor;
  // Usar el proxy /api para que el dev server reenvíe a http://localhost:3000
  return this.http.post<any>(`${this.apiPrefix}/factura-por-fechas`, body);
  }

  // Exportar Excel para facturas por fecha
  exportarFacturasPorFechasExcel(fechaInicio: string, fechaFin: string, cod_distribuidor?: string): Observable<Blob> {
    const body: any = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin),
      generarExcel: true
    };
    if (cod_distribuidor) body.cod_distribuidor = cod_distribuidor;
  return this.http.post(`${this.apiPrefix}/factura-por-fechas`, body, { responseType: 'blob' });
  }

  // Obtener 'Firmas vendidas' (JSON)
  obtenerFirmasVendidas(): Observable<any> {
    return this.http.post<any>(`${this.apiPrefix}/firmas-vendidas`, {});
  }

  // Buscar firmas generadas que tienen factura (JSON)
  buscarFirmasGeneradasConFactura(fechaInicio: string, fechaFin: string): Observable<any> {
    const body = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin)
    };
    return this.http.post<any>(`${this.apiPrefix}/firmas-generadas-factura`, body);
  }

  // Filtrar distribuidores por fechas (JSON)
  filtrarDistribuidoresPorFechas(fechaInicio: string, fechaFin: string): Observable<any> {
    const body = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin)
    };
    return this.http.post<any>(`${this.apiPrefix}/filtro-distribuidores`, body);
  }

  // Buscar firmas por enganchador (JSON)
  buscarFirmasPorEnganchador(fechaInicio: string, fechaFin: string, codigoEnganchador?: string): Observable<any> {
    const body: any = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin)
    };
    if (codigoEnganchador) body.codigo_enganchador = codigoEnganchador;
    return this.http.post<any>(`${this.apiPrefix}/firmas-por-enganchador`, body);
  }

  // Exportar Excel para firmas por enganchador
  exportarFirmasPorEnganchadorExcel(fechaInicio: string, fechaFin: string, codigoEnganchador?: string): Observable<Blob> {
    const body: any = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin),
      generarExcel: true
    };
    if (codigoEnganchador) body.codigo_enganchador = codigoEnganchador;
    return this.http.post(`${this.apiPrefix}/firmas-por-enganchador`, body, { responseType: 'blob' });
  }

  // Exportar Excel para firmas generadas con factura
  exportarFirmasGeneradasConFactura(fechaInicio: string, fechaFin: string): Observable<Blob> {
    const body = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin),
      generarExcel: true
    };
    return this.http.post(`${this.apiPrefix}/firmas-generadas-factura`, body, { responseType: 'blob' });
  }

  // Descargar Excel de 'Firmas vendidas'
  exportarFirmasVendidasExcel(): Observable<Blob> {
    const body = { generarExcel: true };
    return this.http.post(`${this.apiPrefix}/firmas-vendidas`, body, { responseType: 'blob' });
  }

  // Endpoint para obtener firmas por caducar / estado (devuelve estructura tipo items o array)
  buscarFirmasCaducar(fechaInicio: string, fechaFin: string, estado?: string, cod_distribuidor?: string): Observable<any> {
    const body: any = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin)
    };
    if (estado && estado !== 'Todos') body.estado = estado;
    if (cod_distribuidor) body.cod_distribuidor = cod_distribuidor;
    return this.http.post<any>(`${this.apiPrefix}/firmas-estado`, body);
  }

  // Exportar Excel: llama al mismo endpoint con generarExcel = true y devuelve un Blob
  exportarRegistrosExcel(fechaInicio: string, fechaFin: string, cod_distribuidor?: string): Observable<Blob> {
    const body: any = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin),
      generarExcel: true
    };
    if (cod_distribuidor) body.cod_distribuidor = cod_distribuidor;
    return this.http.post(`${this.apiPrefix}/obtener-registros`, body, { responseType: 'blob' });
  }

  // Exportar Excel para firmas por caducar
  exportarFirmasCaducarExcel(fechaInicio: string, fechaFin: string, estado?: string, cod_distribuidor?: string): Observable<Blob> {
    const body: any = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin),
      generarExcel: true
    };
    if (estado && estado !== 'Todos') body.estado = estado;
    if (cod_distribuidor) body.cod_distribuidor = cod_distribuidor;
    return this.http.post(`${this.apiPrefix}/firmas-estado`, body, { responseType: 'blob' });
  }

  // Helper: convertir dd/mm/yyyy -> YYYY-MM-DD si tu UI entrega dd/mm/yyyy
  private toIsoDate(value: string): string {
    // Si ya recibes YYYY-MM-DD, devolvemos tal cual
    if (!value) return value;
    // Si es dd/mm/yyyy -> convertir
    const parts = value.split('/');
    if (parts.length === 3) {
      const dd = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      const yyyy = parts[2];
      return `${yyyy}-${mm}-${dd}`;
    }
    // fallback
    return value;
  }
}
