import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrelService {
  private apiPrefix = '/api';

  constructor(private http: HttpClient) {}

  complementoCaducar(fechaInicio: string, fechaFin: string): Observable<any> {
    const body = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin)
    };
    return this.http.post<any>(`${this.apiPrefix}/orel/complemento-caducar`, body);
  }

  exportarComplementoCaducarExcel(fechaInicio: string, fechaFin: string): Observable<Blob> {
    const body: any = {
      fecha_inicio: this.toIsoDate(fechaInicio),
      fecha_fin: this.toIsoDate(fechaFin),
      generarExcel: true
    };
    return this.http.post(`${this.apiPrefix}/orel/complemento-caducar`, body, { responseType: 'blob' });
  }

  private toIsoDate(value: string): string {
    if (!value) return value;
    const parts = value.split('/');
    if (parts.length === 3) {
      const dd = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      const yyyy = parts[2];
      return `${yyyy}-${mm}-${dd}`;
    }
    return value;
  }
}
