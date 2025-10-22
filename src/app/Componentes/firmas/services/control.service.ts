import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FirmasEstadoRequest {
  fecha_inicio: string; // 'YYYY-MM-DD'
  fecha_fin: string;    // 'YYYY-MM-DD'
  estado: string;       // 'Todos' | ...
  page?: number;
  pageSize?: number;
}

export interface FirmasEstadoResponse {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class FirmasService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  obtenerFirmasPorCaducar(payload: FirmasEstadoRequest): Observable<FirmasEstadoResponse> {
    return this.http.post<FirmasEstadoResponse>(`${this.baseUrl}/firmas-estado`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}