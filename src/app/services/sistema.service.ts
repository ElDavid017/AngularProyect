import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SistemaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getConfiguracionDominio(): Observable<any> {
    return this.http.get(`${this.apiUrl}/config/dominio`);
  }

  getCantidadTickets(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tickets/cantidad`);
  }

  getPuntosFirmas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/puntos/firmas`);
  }
}