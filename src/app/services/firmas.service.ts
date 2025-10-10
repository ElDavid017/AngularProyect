import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirmasService {
  private localUrl = 'http://localhost:3000';
  private remoteUrl = 'http://localhost:3001';

  constructor(private http: HttpClient) {}

  getFirmasPorFecha(fechaInicio: string, fechaFin: string, pagina: number, porPagina: number): Observable<any> {
    // Usar la base remota para buscar por fecha
    return this.http.get(`${this.remoteUrl}/firmas`, {
      params: {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        pagina: pagina.toString(),
        por_pagina: porPagina.toString()
      }
    });
  }

  getFirmasEstado(fechaInicio: string, fechaFin: string, estado: string): Observable<any> {
    // Usar la base local para buscar por caducar
    return this.http.get(`${this.localUrl}/firmas-estado`, {
      params: {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado
      }
    });
  }

  exportarExcel(fechaInicio: string, fechaFin: string, tipo: string): string {
    // Exportar según el tipo de búsqueda
    const url = tipo === 'firmas_fecha' ? this.remoteUrl : this.localUrl;
    return `${url}/exportar-excel?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&tipo=${tipo}`;
  }
}