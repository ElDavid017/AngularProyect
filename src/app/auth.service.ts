

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { of, throwError, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  /** Normaliza el objeto usuario para asegurar que tenga USUAPELLIDO y USUPERFIL */
  private normalizeUser(u: any): any {
    if (!u || typeof u !== 'object') return u;
    
    // Normalizar USUAPELLIDO (nombre)
    const posiblesNombre = [
      'USUAPELLIDO', 'usuapellido', 'USU_APELLIDO', 'apellido', 'apellidos', 'APELLIDO', 'APELLIDOS',
      'NombreCompleto', 'nombreCompleto', 'NOMBRE_COMPLETO'
    ];
    let valorNombre = u['USUAPELLIDO'];
    if (!valorNombre) {
      for (const k of posiblesNombre) {
        if (u[k] && typeof u[k] === 'string') { valorNombre = u[k]; break; }
      }
    }
    if (valorNombre && !u['USUAPELLIDO']) {
      u['USUAPELLIDO'] = String(valorNombre).trim();
    }
    // mantener compatibilidad con vistas anteriores
    if (u['USUAPELLIDO'] && !u['nombreCompleto']) {
      u['nombreCompleto'] = u['USUAPELLIDO'];
    }

    // Normalizar USUPERFIL (perfil/rol)
    const posiblesPerfil = [
      'USUPERFIL', 'usuperfil', 'perfil', 'PERFIL', 'rol', 'ROL', 'role', 'ROLE'
    ];
    let valorPerfil = u['USUPERFIL'];
    if (!valorPerfil) {
      for (const k of posiblesPerfil) {
        if (u[k] && typeof u[k] === 'string') { valorPerfil = u[k]; break; }
      }
    }
    if (valorPerfil && !u['USUPERFIL']) {
      u['USUPERFIL'] = String(valorPerfil).trim();
    }
    // Si no hay perfil, usar valor por defecto
    if (!u['USUPERFIL']) {
      u['USUPERFIL'] = 'Usuario';
    }

    return u;
  }

  /** Obtiene la información del usuario actual del localStorage */
  getCurrentUser(): any {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const userData = localStorage.getItem(this.userKey);
      if (!userData) return null;
      
      const user = this.normalizeUser(JSON.parse(userData));
      // persistir normalizado por si faltaba el campo
      try { localStorage.setItem(this.userKey, JSON.stringify(user)); } catch (e) {}
      return user;
    } catch (e) {
      return null;
    }
  }

  constructor(private http: HttpClient, private router: Router) {}

  /** Obtiene el usuario desde el backend y lo cachea en localStorage */
  fetchAndCacheCurrentUser(): Observable<any> {
    return this.http.get<any>('/api/me').pipe(
      tap((res) => {
        const user = this.normalizeUser(res);
        try { localStorage.setItem(this.userKey, JSON.stringify(user)); } catch {}
      }),
      catchError((err) => {
        console.error('AuthService: no se pudo cargar /api/me', err);
        return of(null);
      })
    );
  }

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
              const userData = this.normalizeUser(res.user || res);
              localStorage.setItem(this.userKey, JSON.stringify(userData));
              // Refrescar desde backend para asegurar que USUAPELLIDO esté actualizado
              try { this.fetchAndCacheCurrentUser().subscribe(); } catch {}
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
                  const userData = this.normalizeUser(res.user || res);
                  if (userData) {
                    localStorage.setItem(this.userKey, JSON.stringify(userData));
                    try { this.fetchAndCacheCurrentUser().subscribe(); } catch {}
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
