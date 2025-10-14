import { Component, signal, OnDestroy, HostBinding } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { Sidebar } from './sidebar/sidebar';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { SidebarService } from './services/sidebar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar, Sidebar],
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
