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

    const normalize = (resp: any): { rows: any[]; totalPages?: number } => {
      // Backend real devuelve: [ { '0': {...}, '1': {...}, ... }, metadata ]
      if (!resp) return { rows: [], totalPages: 1 };

      // Si es array: [ obj_con_claves_numericas, metadata ]
      if (Array.isArray(resp) && resp.length > 0) {
        const first = resp[0];
        
        // Caso: primer elemento es objeto con claves numéricas
        if (first && typeof first === 'object' && !Array.isArray(first)) {
          const numericKeys = Object.keys(first).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b));
          if (numericKeys.length > 0) {
            const rows = numericKeys.map(k => first[k]);
            let totalPages: number | undefined;
            // buscar totalPages en el primer elemento o en el segundo (metadata)
            if ('totalPages' in first) totalPages = first.totalPages;
            if (resp[1] && typeof resp[1] === 'object' && 'totalPages' in resp[1]) {
              totalPages = totalPages ?? resp[1].totalPages;
            }
            return { rows, totalPages };
          }
        }

        // Caso: [ [ {...}, {...} ], meta ] (array de array)
        if (Array.isArray(first)) {
          const totalPages = resp[1]?.totalPages;
          return { rows: first, totalPages };
        }

        // Caso: array plano [ {...}, {...} ]
        if (first && typeof first === 'object') {
          return { rows: resp };
        }
      }

      // Si es objeto simple (no array)
      if (typeof resp === 'object' && !Array.isArray(resp)) {
        // { firmas: [...], totalPaginas }
        if (Array.isArray(resp.firmas)) {
          return { rows: resp.firmas, totalPages: resp.totalPaginas };
        }

        // Objeto con claves numéricas: { '0': {...}, '1': {...} }
        const numericKeys = Object.keys(resp).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b));
        if (numericKeys.length > 0) {
          const rows = numericKeys.map(k => resp[k]);
          return { rows, totalPages: resp.totalPages };
        }
      }

      // Fallback: vacío
      return { rows: [], totalPages: 1 };
    };

    if (this.tipoBusqueda === 'firmas_fecha') {
      this.firmasService.buscarRegistrosPorFecha(this.fechaInicio, this.fechaFin)
        .subscribe({
          next: (resp: any) => {
            const { rows, totalPages } = normalize(resp);
            const total = rows.length || 0;
            this.totalPaginas = totalPages || Math.max(1, Math.ceil(total / this.porPagina));
            this.mostrarPaginacion = this.totalPaginas > 1;

            // Si el backend ya paginó, asumimos que `rows` ya es la página; si no, paginamos localmente
            if (resp && resp.firmas) {
              this.firmas = rows;
            } else if (Array.isArray(resp) && Array.isArray(resp[0])) {
              // caso [rows, meta]
              this.firmas = rows;
            } else {
              const inicio = (this.pagina - 1) * this.porPagina;
              this.firmas = rows.slice(inicio, inicio + this.porPagina);
            }
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
      // firmas_caducar: usar endpoint equivalente y filtrar si hace falta
      this.firmasService.buscarRegistrosPorFecha(this.fechaInicio, this.fechaFin)
        .subscribe({
          next: (resp: any) => {
            const { rows, totalPages } = normalize(resp);
            let filtradas = rows || [];
            if (this.estado && this.estado !== 'Todos') {
              filtradas = filtradas.filter((r: any) => (r.estado || '').toString() === this.estado);
            }

            const total = filtradas.length || 0;
            this.totalPaginas = totalPages || Math.max(1, Math.ceil(total / this.porPagina));
            this.mostrarPaginacion = this.totalPaginas > 1;

            const inicio = (this.pagina - 1) * this.porPagina;
            this.firmas = filtradas.slice(inicio, inicio + this.porPagina);
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

    // Llamamos al backend por POST y esperamos un Blob (archivo xlsx)
    this.firmasService.exportarRegistrosExcel(this.fechaInicio, this.fechaFin)
      .subscribe({
        next: (blob) => {
          const filename = `registros_firmas_${this.fechaInicio.replace(/\//g, '-')}_${this.fechaFin.replace(/\//g, '-')}.xlsx`;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Error al exportar Excel:', err);
          alert('❌ Error al generar el Excel.');
        }
      });
  }
}