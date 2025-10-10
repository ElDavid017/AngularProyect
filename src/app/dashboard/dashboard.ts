import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {
  dropdownOpen = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    this.syncDom();
  }

  closeDropdown() {
    if (this.dropdownOpen) {
      this.dropdownOpen = false;
      this.syncDom();
    }
  }

  // Sync simple DOM elements because template is static HTML file
  private syncDom() {
    try {
      const menu = document.getElementById('configMenu');
      const btn = document.getElementById('configBtn');
      if (menu && btn) {
        if (this.dropdownOpen) {
          menu.classList.add('show');
          menu.setAttribute('aria-hidden', 'false');
          btn.setAttribute('aria-expanded', 'true');
        } else {
          menu.classList.remove('show');
          menu.setAttribute('aria-hidden', 'true');
          btn.setAttribute('aria-expanded', 'false');
        }
      }
    } catch (e) {
      // Silently ignore if running server-side or DOM not available
    }
  }

  // Listener for clicks anywhere to close dropdown when clicked outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const configBtn = document.getElementById('configBtn');
    const configMenu = document.getElementById('configMenu');
    if (!configBtn || !configMenu) return;

    if (configBtn.contains(target)) {
      // click on button toggles
      this.toggleDropdown();
      return;
    }

    if (!configMenu.contains(target)) {
      // clicked outside -> close
      this.closeDropdown();
    }
  }

  // Nuevo: alternar sidebar (puede usarse en móvil)
  toggleSidebar() {
    try {
      const aside = document.querySelector('.sidebar') as HTMLElement | null;
      if (!aside) return;
      aside.classList.toggle('open');
    } catch (e) {
      // ignore in SSR
    }
  }

  onSolicitarFirma() {
    // Placeholder: abrir modal o navegar a la vista de solicitud firma
    console.log('Solicitar firma - persona natural');
  }

  onSolicitarFirmaJuridica() {
    // Placeholder: abrir modal o navegar a la vista de solicitud firma jurídica
    console.log('Solicitar firma - persona jurídica');
  }

  logout() {
    // Placeholder: limpiar sesión y redirigir a login
    try {
      // Aquí podrías limpiar tokens/localStorage
      window.location.href = '/login';
    } catch (e) {
      console.warn('Logout fallback', e);
    }
  }
}
