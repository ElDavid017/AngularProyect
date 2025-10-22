import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlantillasService {
  constructor(private http: HttpClient) {}

  // POST /plantillas/por-caducar -> devuelve JSON (array o objeto con items)
  porCaducar(fechaInicio: string, fechaFin: string): Observable<any> {
    const body = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
    return this.http.post('/api/plantillas/por-caducar', body);
  }

  // Exportar XLSX desde servidor (opcional)
  exportarPorCaducarExcel(fechaInicio: string, fechaFin: string): Observable<Blob> {
    const body = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post('/api/plantillas/por-caducar/export', body, { headers, responseType: 'blob' });
  }
}
