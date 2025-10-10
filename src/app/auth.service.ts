/**
 * @fileoverview Servicio de autenticación que maneja el proceso de login/logout
 * y la gestión del token JWT. Incluye manejo de diferentes formatos de payload
 * y un modo de demostración.
 * 
 * Características principales:
 * - Gestión de token JWT en localStorage
 * - Soporte para múltiples formatos de payload de login
 * - Modo demo con credenciales demo/demo
 * - Protección contra errores en SSR
 * - Manejo de errores y reintentos
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  /** Obtiene la información del usuario actual del localStorage */
  getCurrentUser(): any {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const userData = localStorage.getItem(this.userKey);
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      // USUAPELLIDO ya contiene el nombre completo
      if (user.USUAPELLIDO) {
        user.nombreCompleto = user.USUAPELLIDO;
      }
      return user;
    } catch (e) {
      return null;
    }
  }

  constructor(private http: HttpClient, private router: Router) {}

  login(usuario: string, clave: string) {
    // Intentamos primero con { Usuario, Clave } (como está en el código)
    // si falla con 400/404 probamos con el formato alternativo { USURA, usuclave }
  const primaryPayload = { Usuario: usuario, Clave: clave };
  console.log('AuthService: intentando login con payload:', primaryPayload);
  const primary = this.http.post<any>('/api/login', primaryPayload);
    return primary.pipe(
      switchMap((res) => {
  console.log('AuthService: respuesta primaria:', res);
  // Si tenemos datos de usuario, los guardamos aunque no haya token
  if (res && (res.token || res.user || res.USUIDENTIFICACION)) {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              // Si hay token lo guardamos
              if (res.token) {
                localStorage.setItem(this.tokenKey, res.token);
              }
              
              // Guardamos los datos del usuario, manejando ambos formatos de respuesta
              const userData = res.user || res;
              localStorage.setItem(this.userKey, JSON.stringify(userData));
            }
          } catch (e) {
            console.error('Error guardando datos:', e);
          }
          return of(res);
        }
        // Solo propagamos error si no hay ni token ni datos de usuario
        return throwError(() => ({ status: 0, message: 'Respuesta inválida del servidor' }));
      }),
      catchError((err) => {
        console.error('AuthService: error primario:', err);
        // si recibimos 400/404 o error de conexión, intentamos formato alternativo
        const status = err?.status;
        if (status === 400 || status === 404 || status === 0) {
          const altPayload = { USURA: usuario, usuclave: clave };
          console.log('AuthService: intentando login alternativo con payload:', altPayload);
          return this.http.post<any>('/api/login', altPayload).pipe(
            tap((res) => {
              console.log('AuthService: respuesta alternativa:', res);
              try {
                if (typeof window !== 'undefined' && window.localStorage) {
                  // Guardamos token si existe
                  if (res && res.token) {
                    localStorage.setItem(this.tokenKey, res.token);
                  }
                  // Guardamos datos del usuario
                  const userData = res.user || res;
                  if (userData) {
                    localStorage.setItem(this.userKey, JSON.stringify(userData));
                  }
                }
              } catch (e) {
                console.error('Error guardando datos alternativa:', e);
              }
            }),
            catchError((err2) => {
              console.error('AuthService: error alternativo:', err2);
              // devolver el error original si la alternativa también falla
              return throwError(() => err2 || err);
            })
          );
        }
        // Si ambas llamadas fallan, permitir un fallback local para testing: demo/demo
        try {
          if (usuario === 'demo' && clave === 'demo') {
            const fake = { token: 'demo-token' } as any;
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(this.tokenKey, fake.token);
              }
            } catch (e) {}
            return of(fake);
          }
        } catch (e) {}
        return throwError(() => err);
      })
    );
  }

  isAuthenticated(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      // Consideramos autenticado si hay datos de usuario o token
      return !!(localStorage.getItem(this.userKey) || localStorage.getItem(this.tokenKey));
    } catch (e) {
      return false;
    }
  }

  logout() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
      }
    } catch (e) {
      // ignore in SSR
    }
    this.router.navigate(['/login']);
  }
}
