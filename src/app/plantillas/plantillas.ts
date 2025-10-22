import { Component } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantillasService } from '../services/plantillas.service';

@Component({
  selector: 'app-plantillas',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgForOf],
  templateUrl: './plantillas.html',
  styleUrls: ['./plantillas.css']
})
export class Plantillas {
  fechaInicio = '';
  fechaFin = '';
  loading = false;
  datos: any[] = [];
  datosCargados = false;
  private allDatos: any[] = [];

  // modal/pending
  showConfirmModal = false;
  modalLoading = false;
  modalMessage = '';
  private modalStartAt = 0;
  private readonly minModalMs = 700;
  private pendingDatos: any[] = [];
  private pendingTotalResults = 0;
  private pendingPagina = 1;
  private pendingPorPagina = 10;
  private pendingTotalPaginas = 1;
  private pendingMostrarPaginacion = false;
  private pendingError = false;

  // paginacion
  pagina = 1;
  porPagina = 10;
  totalResults = 0;
  totalPaginas = 1;
  mostrarPaginacion = false;

  get startIndex(): number { return (this.pagina - 1) * this.porPagina + 1; }
  get endIndex(): number { return Math.min(this.totalResults, this.pagina * this.porPagina); }

  constructor(private plantillasService: PlantillasService) {}

  private normalizeRow(raw: any) {
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch (e) { return raw; }
    }
    if (!raw || typeof raw !== 'object') return raw;
    const get = (obj: any, keys: string[]) => {
      for (const k of keys) if (k in obj && obj[k] != null) return obj[k];
      const ks = Object.keys(obj);
      for (const k of keys) {
        const found = ks.find(x => x.toLowerCase() === k.toLowerCase());
        if (found) return obj[found];
      }
      return undefined;
    };

    return {
      ID: get(raw, ['ID','id']) || '',
      MAC: get(raw, ['MAC','mac']) || '',
      RUC: get(raw, ['RUC','ruc']) || '',
      NOMBRE: get(raw, ['NOMBRE','nombre','razon_social']) || '',
      TIPO_PLANTILLA: get(raw, ['TIPO_PLANTILLA','tipo_plantilla']) || '',
      VENDEDOR: get(raw, ['VENDEDOR','vendedor']) || '',
      FECHA_ACTIVACION: get(raw, ['FECHA_ACTIVACION','fecha_activacion']) || '',
      FECHA_CADUCIDAD: get(raw, ['FECHA_CADUCIDAD','fecha_caducidad']) || '',
      COMENTARIO: get(raw, ['COMENTARIO','comentario']) || '',
      TELEFONO: get(raw, ['TELEFONO','telefono','celular']) || '',
      CORREO: get(raw, ['CORREO','correo','email']) || '',
      ESTADO: get(raw, ['ESTADO','estado']) ?? '',
      CIUDAD: get(raw, ['CIUDAD','ciudad']) || '',
      MATRICULADO: get(raw, ['MATRICULADO','matriculado']) || '',
      GRATIS: get(raw, ['GRATIS','gratis']) || 0,
      TERMINOS: get(raw, ['TERMINOS','terminos']) || '',
      PERMISO: get(raw, ['PERMISO','permiso']) || '',
      LICENCIA: get(raw, ['LICENCIA','licencia']) || '',
      PRECIO: get(raw, ['PRECIO','precio']) || '',
      BANCO: get(raw, ['BANCO','banco']) || '',
      COMPROBANTE: get(raw, ['COMPROBANTE','comprobante']) || '',
      ARCHIVO_PAGO: get(raw, ['ARCHIVO_PAGO','archivo_pago']) || 0,
      DOCUMENTO_PAGO: get(raw, ['DOCUMENTO_PAGO','documento_pago']) || null,
      FECHA_COMPROBANTE: get(raw, ['FECHA_COMPROBANTE','fecha_comprobante']) || null,
      NUM_FACTURA: get(raw, ['NUM_FACTURA','num_factura','numero_factura']) || '',
      CODIGO_UNICO: get(raw, ['CODIGO_UNICO','codigo_unico']) || null,
      CONTADOR_USO: get(raw, ['CONTADOR_USO','contador_uso']) || 0,
      CREATED_AT: get(raw, ['CREATED_AT','created_at']) || '',
      UPDATED_AT: get(raw, ['UPDATED_AT','updated_at']) || ''
    };
  }

  cargarDatos() {
    const fi = this.fechaInicio;
    const ff = this.fechaFin;
    if (!fi || !ff) {
      this.modalMessage = ' Por favor, ingresa ambas fechas.';
      this.modalLoading = false;
      this.showConfirmModal = true;
      return;
    }
    if (fi > ff) {
      this.modalMessage = ' La fecha de inicio no puede ser mayor que la fecha de fin.';
      this.modalLoading = false;
      this.showConfirmModal = true;
      return;
    }

    this.modalLoading = true;
    this.modalStartAt = Date.now();
    this.showConfirmModal = true;

    this.plantillasService.porCaducar(this.fechaInicio, this.fechaFin).subscribe({
      next: (resp: any) => {
        const normalizeResponse = (r: any): { rows: any[] } => {
          if (!r) return { rows: [] };
          if (Array.isArray(r)) return { rows: r };
          if (r.items && Array.isArray(r.items)) return { rows: r.items };
          const numericKeys = Object.keys(r).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b));
          if (numericKeys.length>0) return { rows: numericKeys.map(k=>r[k]) };
          if (Array.isArray(r.data)) return { rows: r.data };
          return { rows: [] };
        };

        const { rows } = normalizeResponse(resp);
        const normalized = (rows || []).map((x: any) => this.normalizeRow(x));
        this.pendingDatos = normalized;
        this.pendingTotalResults = normalized.length;
        this.pendingTotalPaginas = Math.max(1, Math.ceil(this.pendingTotalResults / this.porPagina));
        this.pendingMostrarPaginacion = this.pendingTotalPaginas > 1;
        this.pendingPagina = this.pagina;
        this.pendingPorPagina = this.porPagina;
        this.pendingError = false;
        this.loading = false;

        const elapsed = Date.now() - this.modalStartAt;
        const remaining = Math.max(0, this.minModalMs - elapsed);
        setTimeout(() => {
          this.commitPending();
          this.modalLoading = false;
          this.showConfirmModal = false;
        }, remaining);
      },
      error: (err) => {
        console.error('Error cargando plantillas por caducar:', err);
        this.pendingDatos = [];
        this.pendingTotalResults = 0;
        this.pendingError = true;
        this.loading = false;
        this.modalLoading = false;
        this.modalMessage = '\u274c Error al cargar Plantillas por caducar.';
        this.showConfirmModal = true;
      }
    });
  }

  private commitPending() {
    if (this.pendingError) {
      this.datos = [];
      this.totalResults = 0;
      this.datosCargados = true;
      return;
    }
    this.allDatos = Array.isArray(this.pendingDatos) ? this.pendingDatos : [];
    this.totalResults = this.pendingTotalResults;
    this.totalPaginas = this.pendingTotalPaginas;
    this.pagina = Math.min(Math.max(1, this.pendingPagina), Math.max(1, this.totalPaginas));
    this.paginarCliente();
    this.mostrarPaginacion = this.pendingMostrarPaginacion;
    this.datosCargados = true;
  }

  private paginarCliente() {
    if (!this.allDatos || this.allDatos.length === 0) {
      this.datos = [];
      this.pagina = 1;
      return;
    }
    this.pagina = Math.min(Math.max(1, this.pagina), Math.max(1, this.totalPaginas));
    const start = (this.pagina - 1) * this.porPagina;
    this.datos = this.allDatos.slice(start, start + this.porPagina);
  }

  cambiarPagina(cambio: number) {
    const nuevaPagina = this.pagina + cambio;
    if (nuevaPagina < 1 || nuevaPagina > this.totalPaginas) return;
    this.pagina = nuevaPagina;
    this.paginarCliente();
  }

  goToPage(n: number) {
    if (n < 1 || n > this.totalPaginas || n === this.pagina) return;
    this.pagina = n;
    this.paginarCliente();
  }

  async exportarExcel() {
    if (!this.datosCargados || !this.allDatos || this.allDatos.length===0) {
      alert('No hay datos para exportar. Carga los datos primero.');
      return;
    }

    const headers = ['ID','MAC','RUC','NOMBRE','TIPO_PLANTILLA','VENDEDOR','FECHA_ACTIVACION','FECHA_CADUCIDAD','COMENTARIO','TELEFONO','CORREO','ESTADO','CIUDAD','MATRICULADO','GRATIS','TERMINOS','PERMISO','LICENCIA','PRECIO','BANCO','COMPROBANTE','ARCHIVO_PAGO','DOCUMENTO_PAGO','FECHA_COMPROBANTE','NUM_FACTURA','CODIGO_UNICO','CONTADOR_USO','CREATED_AT','UPDATED_AT'];

    const data: any[][] = [];
    data.push(headers);
    for (const item of this.allDatos) {
      const row = headers.map(h => item?.[h] ?? item?.[h.toUpperCase()] ?? item?.[h.toLowerCase()] ?? '');
      data.push(row);
    }

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PlantillasPorCaducar');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantillas_por_caducar_${this.fechaInicio.replace(/\//g,'-')}_${this.fechaFin.replace(/\//g,'-')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  confirmLoad() { this.showConfirmModal = false; }
  cancelLoad() { this.showConfirmModal = false; }
}
