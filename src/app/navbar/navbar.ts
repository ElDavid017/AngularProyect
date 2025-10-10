import { Component, EventEmitter, Output, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { SidebarService } from '../services/sidebar.service';



@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar implements OnDestroy, AfterViewInit {
  @Output() toggle = new EventEmitter<void>();
  showSolicitar = true;
  private sub: Subscription | null = null;

  constructor(
    private router: Router,
    public auth: AuthService,
    private sidebarService: SidebarService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.updateShowSolicitar(this.router.url);
    this.sub = this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd) {
        this.updateShowSolicitar(ev.urlAfterRedirects);
      }
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.iniciarCiclosDeAnimacion('btnSolicitarFirma', 3, 2000, 5000);
    }
  }

  private updateShowSolicitar(url: string) {
    this.showSolicitar = !['/login', '/registros'].includes(url);
  }

  onToggle() {
    this.toggle.emit();
  }

  onSolicitarFirma() {
    this.router.navigate(['/firmas/natural']);
  }

  onSolicitarFirmaJuridica() {
    this.router.navigate(['/firmas/juridica']);
  }

  iniciarCiclosDeAnimacion(id: string, repeticiones: number, intervalo: number, pausaEntreCiclos: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = document.getElementById(id);
    if (!el) return;

    const ejecutarCiclo = () => {
      let count = 0;
      const animar = () => {
        el.classList.remove('bounce-animation');
        void el.offsetWidth;
        el.classList.add('bounce-animation');
        count++;
        if (count < repeticiones) {
          setTimeout(animar, intervalo);
        } else {
          setTimeout(ejecutarCiclo, pausaEntreCiclos);
        }
      };
      animar();
    };
    ejecutarCiclo();
  }

  logout() {
    try {
      this.auth.logout();
      localStorage.clear();
      this.router.navigate(['/login']);
    } catch {
      window.location.href = '/login';
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
