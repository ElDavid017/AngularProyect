import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImprentaService {
  // Usar prefijo /api para que el proxy de Angular redirija al backend
  private apiUrl = '/api/imprenta';

  constructor(private http: HttpClient) {}

  /**
   * Obtener pagos de facturadores por rango de fechas
   * @param fecha_inicio - Formato YYYY-MM-DD
   * @param fecha_fin - Formato YYYY-MM-DD
   * @param generarExcel - true para descargar Excel, false para JSON
   */
  obtenerPagosFacturadores(fecha_inicio: string, fecha_fin: string, generarExcel = false): Observable<any> {
    return this.http.post(`${this.apiUrl}/pagos-facturadores`, 
      { fecha_inicio, fecha_fin, generarExcel },
      generarExcel ? { responseType: 'blob' as 'json' } : {}
    );
  }

  /**
   * Obtener emisores por rango de fechas (con paginación)
   */
  obtenerEmisoresPorFechas(
    fecha_inicio: string, 
    fecha_fin: string, 
    page = 1, 
    pageSize = 50, 
    generarExcel = false
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/emisores-por-fechas`, 
      { fecha_inicio, fecha_fin, page, pageSize, generarExcel },
      generarExcel ? { responseType: 'blob' as 'json' } : {}
    );
  }

  /**
   * Obtener auditoría de planes por rango de fechas (con paginación)
   */
  obtenerAuditoriaPlanesPorFechas(
    fecha_inicio: string, 
    fecha_fin: string, 
    page = 1, 
    pageSize = 50, 
    generarExcel = false
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/auditoria-planes-por-fechas`, 
      { fecha_inicio, fecha_fin, page, pageSize, generarExcel },
      generarExcel ? { responseType: 'blob' as 'json' } : {}
    );
  }
}