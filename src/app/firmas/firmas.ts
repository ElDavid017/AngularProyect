import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirmasService } from '../services/firmas.service';

@Component({
  selector: 'app-firmas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './firmas.html',
  styleUrls: ['./firmas.css']
})
export class Firmas implements OnInit {
  tipoBusqueda = 'firmas_fecha';
  fechaInicio = '';
  fechaFin = '';
  estado = 'Todos';
  mostrarEstado = false;
  loading = false;
  firmas: any[] = [];
  pagina = 1;
  porPagina = 10;
  totalPaginas = 1;
  mostrarPaginacion = false;

  constructor(private firmasService: FirmasService) {}

  ngOnInit() {
    this.toggleEstado();
  }

  toggleEstado() {
    this.mostrarEstado = this.tipoBusqueda === 'firmas_caducar';
  }

  buscar(nuevaPagina = 1) {
    if (!this.fechaInicio || !this.fechaFin) {
      alert('⚠️ Por favor, ingresa ambas fechas.');
      return;
    }

    if (this.fechaInicio > this.fechaFin) {
      alert('⚠️ La fecha de inicio no puede ser mayor que la fecha de fin.');
      return;
    }

    this.pagina = nuevaPagina;
    this.loading = true;
    this.firmas = [];
    this.mostrarPaginacion = false;

    if (this.tipoBusqueda === 'firmas_fecha') {
      this.firmasService.getFirmasPorFecha(
        this.fechaInicio,
        this.fechaFin,
        this.pagina,
        this.porPagina
      ).subscribe({
        next: (response) => {
          this.firmas = response.firmas || [];
          this.totalPaginas = response.totalPaginas || 1;
          this.mostrarPaginacion = this.totalPaginas > 1;
        },
        error: (error) => {
          console.error('Error al cargar los registros:', error);
          alert('❌ Error al cargar los registros.');
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      this.firmasService.getFirmasEstado(
        this.fechaInicio,
        this.fechaFin,
        this.estado
      ).subscribe({
        next: (response) => {
          this.firmas = response.firmas || [];
          // Calcular paginación manualmente para firmas_caducar
          const total = this.firmas.length;
          this.totalPaginas = Math.ceil(total / this.porPagina) || 1;
          this.mostrarPaginacion = this.totalPaginas > 1;
          // Mostrar solo la página actual
          const inicio = (this.pagina - 1) * this.porPagina;
          const fin = inicio + this.porPagina;
          this.firmas = this.firmas.slice(inicio, fin);
        },
        error: (error) => {
          console.error('Error al cargar los registros:', error);
          alert('❌ Error al cargar los registros.');
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

  cambiarPagina(cambio: number) {
    const nuevaPagina = this.pagina + cambio;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.buscar(nuevaPagina);
    }
  }

  formatearFechaHora(fechaISO: string): string {
    if (!fechaISO) return '—';

    const fecha = new Date(fechaISO);
    if (isNaN(fecha.getTime())) return '—';

    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    
    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
  }

  exportarExcel() {
    if (!this.fechaInicio || !this.fechaFin) {
      alert('⚠️ Por favor, ingresa ambas fechas antes de exportar.');
      return;
    }

    const url = this.firmasService.exportarExcel(
      this.fechaInicio,
      this.fechaFin,
      this.tipoBusqueda
    );
    
    window.location.href = url;
  }
}