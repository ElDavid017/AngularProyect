import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styles: [
    `.sidebar{background:#1f3b73;position:fixed;top:0;left:-260px;width:260px;height:100vh;z-index:1050;transition:left .28s ease;display:flex;flex-direction:column;color:#fff;box-shadow:2px 0 10px rgba(0,0,0,0.3)}`,
    `.sidebar.open{left:0}`,
    `.profile-section{padding:12px 10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.04)}`,
    `.profile-avatar{width:52px;height:52px;border-radius:50%;border:2px solid #fff;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1)}`,
    `.profile-avatar i{font-size:24px;color:#fff}`,
  `.user-name{font-weight:600;font-size:1rem}`,
  `.user-email{font-size:0.85rem;opacity:0.9;margin-top:4px;color:#dbe7ff}`,
    `.welcome-text{font-size:0.9rem;opacity:0.8;margin-bottom:4px}`,
    `nav{flex:1;overflow:auto}`,
    `.nav-list{list-style:none;margin:0;padding:0}`,
    `.nav-link{display:flex;align-items:center;padding:12px 16px;color:rgba(255,255,255,.9);text-decoration:none;transition:background 0.2s ease}`,
    `.nav-link:hover{background:rgba(255,255,255,0.1);color:#fff}`,
    `.nav-link i{width:20px;margin-right:12px;font-size:1.1rem}`
  ,`.nav-link.submenu-toggle i{margin-right:6px}`
    ,`.has-submenu > .nav-link { cursor: pointer; justify-content: space-between }`
    ,`.sub-menu{list-style:none;margin:0;padding:0 0 0 12px;background:rgba(255,255,255,0.02)}`
    ,`.sub-item a{display:block;padding:8px 16px;color:rgba(255,255,255,0.9);text-decoration:none}`
    ,`.sub-item a:hover{background:rgba(255,255,255,0.04)}`
    ,`.submenu-caret{margin-left:8px;transition:transform .2s ease}`
    ,`.submenu-caret.rotated{transform:rotate(-180deg)}`
  ]
})
export class Sidebar implements OnInit {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  constructor(public auth: AuthService) {}

ngOnInit(): void {
  const u = this.auth.getCurrentUser();
  if (!u || !u.USUAPELLIDO) {
    this.auth.fetchAndCacheCurrentUser().subscribe({
      next: (data) => {
        if (data) {
          // fuerza redibujo del sidebar con los datos más recientes
          setTimeout(() => {}, 0);
        }
      },
      error: () => {}
    });
  }
}


  /** Devuelve el usuario actual (puede ser null) */
  get currentUser(): any {
    try {
      return this.auth.getCurrentUser();
    } catch (e) {
      return null;
    }
  }

  /** Cierra el sidebar cuando se hace click en un enlace */
  onLinkClick() {
    this.closeSidebar.emit();
  }

  toggleReportes(ev?: Event) {
    // previously used to toggle REPORTES submenu; no-op now
    if (ev) ev.preventDefault();
  }

}