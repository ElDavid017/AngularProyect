import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrelService } from '../services/orel.service';

@Component({
  selector: 'app-orel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orel.html',
  styleUrls: ['./orel.css']
})
export class Orel {
  fechaInicio = '';
  fechaFin = '';
  loading = false;
  datos: any[] = [];
  datosCargados = false;
  // cache local para export
  private allDatos: any[] = [];

  // Modal / pending buffers (same pattern que firmas)
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

  // Paginación cliente
  pagina = 1;
  porPagina = 10;
  totalResults = 0;
  totalPaginas = 1;
  mostrarPaginacion = false;

  get startIndex(): number {
    return (this.pagina - 1) * this.porPagina + 1;
  }

  get endIndex(): number {
    return Math.min(this.totalResults, this.pagina * this.porPagina);
  }

  constructor(private orelService: OrelService) {}

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
      IDREGISTRO: get(raw, ['IDREGISTRO','idregistro','id']) || '',
      REGUSERNAME: get(raw, ['REGUSERNAME','regusername','username']) || '',
      REGRUC: get(raw, ['REGRUC','regruc','ruc']) || '',
      REGPLAN: get(raw, ['REGPLAN','regplan']) || '',
      CORREO: get(raw, ['CORREO','correo','email']) || '',
      TELEFONO: get(raw, ['TELEFONO','telefono','celular']) || '',
      VIGENCIA: get(raw, ['VIGENCIA','vigencia']) || '',
      BOT_RECIBIDOS: get(raw, ['BOT_RECIBIDOS','bot_recibidos']) || 0,
      BOT_EMITIDOS: get(raw, ['BOT_EMITIDOS','bot_emitidos']) || 0,
      REGUSER: get(raw, ['REGUSER','reguser']) || '',
      FECHA_INICIO: get(raw, ['FECHA_INICIO','fecha_inicio']) || '',
      FECHA_CADUCIDAD: get(raw, ['FECHA_CADUCIDAD','fecha_caducidad']) || '',
      REGCIUDAD: get(raw, ['REGCIUDAD','regciudad','ciudad']) || '',
      REGRAZON: get(raw, ['REGRAZON','regrazon','razon_social']) || '',
      REGPAGO: get(raw, ['REGPAGO','regpago']) || '',
      FECHA_REGDEMO: get(raw, ['FECHA_REGDEMO','fecha_regdemo']) || '',
      COMENTARIO: get(raw, ['COMENTARIO','comentario']) || '',
      CONTROL: get(raw, ['CONTROL','control']) || '',
      PRECIO: get(raw, ['PRECIO','precio']) || '',
      OBSERVACION: get(raw, ['OBSERVACION','observacion']) || '',
      LICENCIA: get(raw, ['LICENCIA','licencia']) || '',
      BANCO: get(raw, ['BANCO','banco']) || '',
      NRO_COMPROBANTE: get(raw, ['NRO_COMPROBANTE','nro_comprobante']) || '',
      CODIGO_UNICO: get(raw, ['CODIGO_UNICO','codigo_unico','codUnico']) || '',
      ESTADO: get(raw, ['ESTADO','estado']) || ''
    };
  }

  cargarDatos() {
    // Validar fechas
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

    // iniciar modal y carga
    this.modalLoading = true;
    this.modalStartAt = Date.now();
    this.showConfirmModal = true;

    this.orelService.complementoCaducar(this.fechaInicio, this.fechaFin).subscribe({
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
        console.error('Error cargando complemento orel:', err);
        this.pendingDatos = [];
        this.pendingTotalResults = 0;
        this.pendingError = true;
        this.loading = false;
        this.modalLoading = false;
        this.modalMessage = '❌ Error al cargar el reporte Orel Complemento.';
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

    const headers = ['IDREGISTRO','REGUSERNAME','REGRUC','REGPLAN','CORREO','TELEFONO','VIGENCIA','BOT_RECIBIDOS','BOT_EMITIDOS','REGUSER','FECHA_INICIO','FECHA_CADUCIDAD','REGCIUDAD','REGRAZON','REGPAGO','FECHA_REGDEMO','COMENTARIO','CONTROL','PRECIO','OBSERVACION','LICENCIA','BANCO','NRO_COMPROBANTE','CODIGO_UNICO','ESTADO'];

    const data: any[][] = [];
    data.push(headers);
    for (const item of this.allDatos) {
      const row = headers.map(h => item?.[h] ?? item?.[h.toLowerCase()] ?? '');
      data.push(row);
    }

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'OrelComplemento');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orel_complemento_${this.fechaInicio.replace(/\//g,'-')}_${this.fechaFin.replace(/\//g,'-')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  confirmLoad() { this.showConfirmModal = false; }
  cancelLoad() { this.showConfirmModal = false; }
}
