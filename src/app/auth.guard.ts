/**
 * @fileoverview Guard de autenticación que protege las rutas que requieren
 * que el usuario esté autenticado. Redirige a /login si no hay sesión.
 * 
 * Implementa:
 * - Verificación de autenticación usando AuthService
 * - Redirección automática al login
 * - Protección de rutas privadas
 */

import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.auth.isAuthenticated()) return true;
    return this.router.parseUrl('/login');
  }
}
