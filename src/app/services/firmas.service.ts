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
  buscarRegistrosPorFecha(fechaInicio: string, fechaFin: string): Observable<any> {
    const body = {
      fecha_inicio: this.toIsoDate(fechaInicio), // convierte dd/mm/yyyy o ISO según tu UI
      fecha_fin: this.toIsoDate(fechaFin)
    };
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

  // Exportar Excel: llama al mismo endpoint con generarExcel = true y devuelve un Blob
  exportarRegistrosExcel(fechaInicio: string, fechaFin: string): Observable<Blob> {
    const body = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin),
      generarExcel: true
    };
    return this.http.post(`${this.apiPrefix}/obtener-registros`, body, { responseType: 'blob' });
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
