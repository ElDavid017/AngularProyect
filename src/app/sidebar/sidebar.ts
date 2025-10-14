import { Component, Input, Output, EventEmitter } from '@angular/core';
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
    `.welcome-text{font-size:0.9rem;opacity:0.8;margin-bottom:4px}`,
    `nav{flex:1;overflow:auto}`,
    `.nav-list{list-style:none;margin:0;padding:0}`,
    `.nav-link{display:flex;align-items:center;padding:12px 16px;color:rgba(255,255,255,.9);text-decoration:none;transition:background 0.2s ease}`,
    `.nav-link:hover{background:rgba(255,255,255,0.1);color:#fff}`,
    `.nav-link i{width:20px;margin-right:12px;font-size:1.1rem}`
  ]
})
export class Sidebar {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  constructor(public auth: AuthService) {}

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
}