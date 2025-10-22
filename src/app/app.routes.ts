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
import { Login } from './General/login/login';
import { Sigup } from './General/signup/signup';
import { Dashboard } from './Componentes/dashboard/dashboard';
import { AuthGuard } from './auth.guard';
import { Amelia } from './Componentes/amelia/amelia';
import { Firmas } from './Componentes/firmas/firmas';
import { Orel } from './Componentes/orel/orel';
import { Imprenta } from './Componentes/imprenta/imprenta';
import { Firmador } from './Componentes/firmador/firmador';
import { Plantillas } from './Componentes/plantillas/plantillas';



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


