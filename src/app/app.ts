import { Component, signal, OnDestroy, OnInit, HostBinding } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { Navbar } from './General/navbar/navbar';
import { Sidebar } from './General/sidebar/sidebar';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { SidebarService } from './services/sidebar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Sidebar],
  template: `
    <app-navbar *ngIf="showNav" (toggle)="onToggleSidebar()"></app-navbar>
    <app-sidebar *ngIf="showNav && auth.isAuthenticated()" [isOpen]="sidebarOpen" (closeSidebar)="onCloseSidebar()"></app-sidebar>
    <div class="sidebar-overlay" *ngIf="sidebarOpen && showNav && auth.isAuthenticated()" (click)="onToggleSidebar()"></div>
    <router-outlet></router-outlet>
  `,
  styles: [`
    :host {
      display: block;
      padding: 0;
    }
    
    :host ::ng-deep router-outlet + * {
      margin-left: 0;
      margin-top: 60px;
      padding: 20px;
      width: 100%;
      transition: all 0.3s ease;
      min-height: calc(100vh - 60px);
      box-sizing: border-box;
    }

    /* Overlay para móvil */
    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1040;
    }

    /* En móvil, el sidebar se superpone */
    @media (max-width: 991px) {
      :host(.sidebar-open) ::ng-deep router-outlet + * { 
        margin-left: 0; 
        width: 100%; 
      }
    }

    /* En desktop, el contenido se desplaza */
    @media (min-width: 992px) {
      :host(.sidebar-open) ::ng-deep router-outlet + * { 
        margin-left: 260px; 
        width: calc(100% - 260px); 
      }
      :host(:not(.sidebar-open)) ::ng-deep router-outlet + * { 
        margin-left: 0; 
        width: 100%; 
      }
    }
  `]
})
export class App implements OnDestroy {
  /** Título de la aplicación usando signals de Angular */
  protected readonly title = signal('reportes');
  
  /** Indica si la ruta actual es la página de login */
  isLoginRoute = false;
  
  /** Indica si la ruta actual es la página de signup */
  isSignupRoute = false;
  
  /** Controla la visibilidad del navbar */
  showNav = true;

  /** Estado del sidebar (abierto/cerrado) */
  sidebarOpen = false;

  /** Clase en host para desplazar contenido cuando el sidebar está abierto */
  @HostBinding('class.sidebar-open')
  get isSidebarOpenClass() { return this.sidebarOpen; }
  
  /** Suscripción a eventos de navegación */
  private sub: Subscription | null = null;

  constructor(private router: Router, public auth: AuthService, private sidebarSvc: SidebarService) {
    this.updateNavVisibility(this.router.url);
    this.sub = this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd) {
        this.updateNavVisibility(ev.urlAfterRedirects);
      }
    });

    // Cerrar sesión automáticamente cuando se cierra la pestaña o ventana
    // usando un "heartbeat" en localStorage: mientras haya al menos
    // una pestaña abierta, la aplicación actualizará un timestamp en
    // localStorage. Cuando se abra la aplicación y el último timestamp
    // sea más antiguo que el umbral, asumimos que todas las pestañas
    // fueron cerradas y forzamos logout.
    this.setupAutoLogout();
  }

  /** Configura el cierre de sesión automático al cerrar la pestaña/ventana */
  private setupAutoLogout(): void {
    if (typeof window === 'undefined') return;

    const TAB_KEY_PREFIX = 'app_tab_';
    const TAB_HEARTBEAT_INTERVAL_MS = 2000; // actualizamos cada 2s
    const TAB_EXPIRY_MS = 7000; // consideramos tab muerta si no actualiza en 7s

    // Reutilizar tabId durante recargas: almacenarlo en sessionStorage
    let tabId = sessionStorage.getItem('app_tab_id');
    if (!tabId) {
      tabId = (window.crypto && (window.crypto as any).randomUUID)
        ? (window.crypto as any).randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  try { sessionStorage.setItem('app_tab_id', tabId as string); } catch (e) { /* ignore */ }
    }

    const tabKey = `${TAB_KEY_PREFIX}${tabId}`;

    const now = () => Date.now();

    const setTabTimestamp = () => {
      try { localStorage.setItem(tabKey, now().toString()); } catch (e) { /* ignore */ }
    };

    const removeTabKey = () => {
      try { localStorage.removeItem(tabKey); } catch (e) { /* ignore */ }
    };

    const cleanupStaleTabs = () => {
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(TAB_KEY_PREFIX));
        const threshold = now() - TAB_EXPIRY_MS;
        for (const k of keys) {
          const v = parseInt(localStorage.getItem(k) || '0', 10);
          if (!v || v < threshold) {
            try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
          }
        }
      } catch (e) {
        // ignore
      }
    };

    const countActiveTabs = () => {
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(TAB_KEY_PREFIX));
        const threshold = now() - TAB_EXPIRY_MS;
        let count = 0;
        for (const k of keys) {
          const v = parseInt(localStorage.getItem(k) || '0', 10);
          if (v && v >= threshold) count++;
        }
        return count;
      } catch (e) { return 0; }
    };

    // Limpieza inicial de pestañas muertas
    cleanupStaleTabs();

    // Si al iniciar no hay pestañas activas, entendemos que venimos tras
    // cierre de todas las pestañas: eliminamos la sesión para forzar login.
    try {
      if (countActiveTabs() === 0) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
      }
    } catch (e) { /* ignore */ }

    // Registrar esta pestaña y actualizar periódicamente
    setTabTimestamp();
    const tabInterval = setInterval(setTabTimestamp, TAB_HEARTBEAT_INTERVAL_MS);

    // Antes de abandonar, limpiamos sessionStorage (que es por pestaña) y el interval.
    // NO eliminamos la key de localStorage aquí para no confundir recargas con cierres.
    window.addEventListener('beforeunload', () => {
      try { sessionStorage.removeItem('app_tab_id'); } catch (e) { /* ignore */ }
      try { sessionStorage.clear(); } catch (e) { /* ignore */ }
      try { clearInterval(tabInterval); } catch (e) { /* ignore */ }
      // No removemos localStorage.removeItem(tabKey) aquí: dejamos que el
      // mecanismo de expiración limpie las keys cuando ninguna pestaña esté viva.
    });

    // Cuando cambie localStorage (otra pestaña actualiza o borra su key), podemos
    // limpiar keys antiguas. No forzamos logout aquí para evitar interferir en recargas.
    window.addEventListener('storage', (ev: StorageEvent) => {
      if (!ev.key || ev.key.startsWith(TAB_KEY_PREFIX)) {
        cleanupStaleTabs();
      }
    });
  }

  /** Actualiza la visibilidad del navbar según la ruta actual */
  private updateNavVisibility(url: string): void {
    // Ocultar navbar en login, registros y signup
    this.showNav = !['/login', '/registros', '/signup'].includes(url);
    // Actualizar estado de rutas especiales
    this.isLoginRoute = url === '/login';
    this.isSignupRoute = url === '/signup';
    // Asegurar sidebar cerrado cuando no se muestra la navegación
    if (!this.showNav) {
      this.sidebarOpen = false;
    }
  }
  
  /** Método para alternar la visibilidad del sidebar */
  onToggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  /** Método para cerrar el sidebar (llamado desde los enlaces del sidebar) */
  onCloseSidebar() {
    this.sidebarOpen = false;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
