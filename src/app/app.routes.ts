/**
 * @fileoverview Configuración de rutas principales de la aplicación.
 * Define la estructura de navegación y las protecciones de rutas.
 * 
 * Rutas implementadas:
 * - /login: Página de inicio de sesión (pública)
 * - /dashboard: Panel principal (protegido)
 * - /signup y /registros: Registro de usuarios (público)
 * - /: Redirección a login
 */

import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Sigup } from './signup/signup';
import { Dashboard } from './dashboard/dashboard';
import { AuthGuard } from './auth.guard';
import { Amelia } from './amelia/amelia';
import { Firmas } from './firmas/firmas';
import { Orel } from './orel/orel';
import { Imprenta } from './imprenta/imprenta';
import { Firmador } from './firmador/firmador';
import { Plantillas } from './plantillas/plantillas';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'signup', component: Sigup },
  { path: 'registros', component: Sigup },
  // Rutas del sidebar - todas protegidas con AuthGuard
  { path: 'amelia', component: Amelia, canActivate: [AuthGuard] },
  { path: 'firmas', component: Firmas, canActivate: [AuthGuard] },
  { path: 'orel', component: Orel, canActivate: [AuthGuard] },
  { path: 'imprenta', component: Imprenta, canActivate: [AuthGuard] },
  { path: 'firmador', component: Firmador, canActivate: [AuthGuard] },
  { path: 'plantillas', component: Plantillas, canActivate: [AuthGuard] }
];

