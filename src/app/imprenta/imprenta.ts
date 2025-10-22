import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImprentaService } from './imprenta.service';

@Component({
  selector: 'app-imprenta',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgForOf],
  templateUrl: './imprenta.html',
  styleUrls: ['./imprenta.css']
})
export class Imprenta implements OnInit {
  // Selector de tipo de reporte (coincide con la plantilla)
  tipoBusqueda: string = 'pagos';

  // Opciones del selector (generadas dinámicamente)
  selectorOptions: Array<{ value: string; label: string }> = [
    { value: 'pagos', label: 'Pagos de Facturadores' },
    { value: 'planes', label: 'Planes de Auditoría' },
    { value: 'emisores', label: 'Emisores' },
  ];

  // Fechas
  fechaInicio: string = '';
  fechaFin: string = '';

  // Resultados y estado
  resultados: any[] = [];
  // Para pagos: almacenar todos los resultados y paginar en cliente
  pagosAll: any[] = [];
  datosCargados = false;
  cargando: boolean = false;
  // Modal de confirmación/carga
  showConfirmModal: boolean = false;
  modalLoading: boolean = false;
  modalMessage: string = '';
  // timing to avoid instant close when response is very fast
  private modalStartAt: number = 0;
  private readonly minModalMs = 700; // mostrar al menos 700ms
  // pending results buffer — no mostrar hasta que el modal se cierre
  private pendingIsPagos = false;
  private pendingPagosAll: any[] = [];
  private pendingResultados: any[] = [];
  private pendingTotal = 0;
  private pendingPage = 1;
  private pendingPageSize = 50;
  private pendingTotalPages = 1;
  private pendingError = false;

  // Paginación (para emisores y planes)
  page = 1;
  pageSize = 50;
  total = 0;
  totalPages = 1;

  constructor(private imprentaService: ImprentaService) {}

  ngOnInit(): void {}

  // Al cambiar el selector reiniciar resultados y paginación
  onTipoBusquedaChange(newTipo: string) {
    this.tipoBusqueda = newTipo;
    this.resultados = [];
    this.datosCargados = false;
    this.total = 0;
    this.page = 1;
    this.totalPages = 1;
  }

  /**
   * Cargar datos según el reporte seleccionado
   */
  cargarDatos(): void {
    // Normalizar posibles formatos (dd/mm/aaaa -> yyyy-mm-dd) antes de validar
    const fi = this.normalizeFecha(this.fechaInicio);
    const ff = this.normalizeFecha(this.fechaFin);
    if (!fi || !ff) {
      // mostrar modal de validación
      this.modalMessage = 'Por favor, ingresa ambas fechas.';
      this.modalLoading = false;
      this.showConfirmModal = true;
      return;
    }

    // Reescribir fechas normalizadas
    this.fechaInicio = fi;
    this.fechaFin = ff;

    // Validaciones adicionales: inicio <= fin y rango máximo 365 días
    const d1 = new Date(this.fechaInicio);
    const d2 = new Date(this.fechaFin);
    if (d1 > d2) {
      this.modalMessage = 'La fecha de inicio no puede ser posterior a la fecha de fin.';
      this.modalLoading = false;
      this.showConfirmModal = true;
      return;
    }
    // Nota: permitimos rangos multi-año (p.ej. 2023-2025). Si se desea, se puede
    // agregar un límite configurable más adelante.

    // Iniciar la carga inmediatamente y mostrar el modal en estado "cargando"
    this.modalLoading = true;
    this.modalStartAt = Date.now();
    this.showConfirmModal = true;
    // ejecutar la búsqueda en segundo plano y cerrar el modal cuando termine
    this.buscar(() => {
      const elapsed = Date.now() - this.modalStartAt;
      const remaining = Math.max(0, this.minModalMs - elapsed);
      setTimeout(() => {
        // primero volcar resultados pendientes
        this.commitPending();
        this.modalLoading = false;
        if (this.showConfirmModal) this.showConfirmModal = false;
      }, remaining);
    });
  }

  // El botón OK ahora solo cierra el modal (la carga sigue en background)
  confirmLoad(): void {
    this.showConfirmModal = false;
  }

  cancelLoad(): void {
    this.showConfirmModal = false;
  }

  // aceptar un callback opcional que se ejecuta cuando la consulta termina (éxito o error)
  buscar(onFinish?: () => void): void {
    // Aceptar que el usuario haya escrito dd/mm/aaaa manualmente -> normalizar
    const fi = this.normalizeFecha(this.fechaInicio);
    const ff = this.normalizeFecha(this.fechaFin);
    if (!fi || !ff) {
      alert('Por favor, ingresa ambas fechas.');
      return;
    }

    // Reescribir a formato ISO esperado por el backend
    this.fechaInicio = fi;
    this.fechaFin = ff;

    this.cargando = true;
    this.datosCargados = false;

    if (this.tipoBusqueda === 'pagos') {
      this.imprentaService.obtenerPagosFacturadores(this.fechaInicio, this.fechaFin, false)
        .subscribe({
          next: (data) => {
            // Guardar en buffer y no mostrar hasta que termine el modal
            this.pendingIsPagos = true;
            this.pendingPagosAll = Array.isArray(data) ? data : [];
            this.pendingTotal = this.pendingPagosAll.length;
            this.pendingTotalPages = Math.max(1, Math.ceil(this.pendingTotal / this.pageSize));
            this.pendingPage = this.page;
            this.pendingPageSize = this.pageSize;
            this.pendingError = false;
            this.cargando = false;
            onFinish?.();
          },
          error: (err) => {
            console.error(err);
            this.pendingIsPagos = false;
            this.pendingPagosAll = [];
            this.pendingTotal = 0;
            this.pendingError = true;
            this.cargando = false;
            // mostrar error en modal
            this.modalMessage = '❌ Error al cargar pagos de facturadores';
            this.modalLoading = false;
            this.showConfirmModal = true;
            onFinish?.();
          }
        });

    } else if (this.tipoBusqueda === 'emisores') {
      this.imprentaService.obtenerEmisoresPorFechas(this.fechaInicio, this.fechaFin, this.page, this.pageSize, false)
        .subscribe({
          next: (data: any) => {
            // Guardar en buffer y esperar al onFinish para mostrar
            this.pendingIsPagos = false;
            this.pendingResultados = data.items ?? data.rows ?? (Array.isArray(data) ? data : []);
            this.pendingTotal = data.total ?? this.pendingResultados.length;
            this.pendingPage = data.page ?? this.page;
            this.pendingPageSize = data.pageSize ?? this.pageSize;
            this.pendingTotalPages = data.totalPages ?? 1;
            this.pendingError = false;
            this.cargando = false;
            onFinish?.();
          },
          error: (err) => {
            console.error(err);
            this.pendingResultados = [];
            this.pendingTotal = 0;
            this.pendingError = true;
            this.cargando = false;
            this.modalMessage = '❌ Error al cargar emisores';
            this.modalLoading = false;
            this.showConfirmModal = true;
            onFinish?.();
          }
        });

    } else if (this.tipoBusqueda === 'planes') {
      this.imprentaService.obtenerAuditoriaPlanesPorFechas(this.fechaInicio, this.fechaFin, this.page, this.pageSize, false)
        .subscribe({
          next: (data: any) => {
            this.pendingIsPagos = false;
            this.pendingResultados = data.items ?? data.rows ?? (Array.isArray(data) ? data : []);
            this.pendingTotal = data.total ?? this.pendingResultados.length;
            this.pendingPage = data.page ?? this.page;
            this.pendingPageSize = data.pageSize ?? this.pageSize;
            this.pendingTotalPages = data.totalPages ?? 1;
            this.pendingError = false;
            this.cargando = false;
            onFinish?.();
          },
          error: (err) => {
            console.error(err);
            this.pendingResultados = [];
            this.pendingTotal = 0;
            this.pendingError = true;
            this.cargando = false;
            this.modalMessage = '❌ Error al cargar planes de auditoría';
            this.modalLoading = false;
            this.showConfirmModal = true;
            onFinish?.();
          }
        });
    }
  }

  // Commit pending buffered results into the UI (call after modal finishes)
  private commitPending() {
    if (this.pendingError) {
      // show nothing on error
      this.resultados = [];
      this.total = 0;
      this.datosCargados = true; // still mark that an attempt finished
      return;
    }

    if (this.pendingIsPagos) {
      this.pagosAll = this.pendingPagosAll;
      this.total = this.pendingTotal;
      this.totalPages = this.pendingTotalPages;
      const start = (this.page - 1) * this.pageSize;
      this.resultados = this.pagosAll.slice(start, start + this.pageSize);
      this.datosCargados = true;
    } else {
      this.resultados = this.pendingResultados;
      this.total = this.pendingTotal;
      this.page = this.pendingPage;
      this.pageSize = this.pendingPageSize;
      this.totalPages = this.pendingTotalPages;
      this.datosCargados = true;
    }
  }

  exportar(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      this.modalMessage = 'Por favor, ingresa ambas fechas.';
      this.modalLoading = false;
      this.showConfirmModal = true;
      return;
    }
    this.cargando = true;

    if (this.tipoBusqueda === 'pagos') {
      this.imprentaService.obtenerPagosFacturadores(this.fechaInicio, this.fechaFin, true)
        .subscribe({
          next: (blob: Blob) => this.downlooadBlob(blob, `pagos_facturadores_${this.fechaInicio}_${this.fechaFin}.xlsx`),
      error: (err) => { console.error(err); this.cargando = false; this.modalMessage = '❌ Error al descargar Excel'; this.modalLoading = false; this.showConfirmModal = true; }
        });

    } else if (this.tipoBusqueda === 'emisores') {
      this.imprentaService.obtenerEmisoresPorFechas(this.fechaInicio, this.fechaFin, 1, 99999, true)
        .subscribe({
          next: (blob: Blob) => this.downlooadBlob(blob, `emisores_${this.fechaInicio}_${this.fechaFin}.xlsx`),
          error: (err) => { console.error(err); this.cargando = false; this.modalMessage = '❌ Error al descargar Excel'; this.modalLoading = false; this.showConfirmModal = true; }
        });

    } else if (this.tipoBusqueda === 'planes') {
      this.imprentaService.obtenerAuditoriaPlanesPorFechas(this.fechaInicio, this.fechaFin, 1, 99999, true)
        .subscribe({
          next: (blob: Blob) => this.downlooadBlob(blob, `auditoria_${this.fechaInicio}_${this.fechaFin}.xlsx`),
          error: (err) => { console.error(err); this.cargando = false; this.modalMessage = '❌ Error al descargar Excel'; this.modalLoading = false; this.showConfirmModal = true; }
        });
    }
  }

  private downlooadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    this.cargando = false;
    this.modalMessage = 'Archivo descargado exitosamente';
    this.modalLoading = false;
    this.showConfirmModal = true;
  }

  /**
   * Descargar Excel
   */
  descargarExcel(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      this.modalMessage = ' Por favor, ingresa ambas fechas.';
      this.modalLoading = false;
      this.showConfirmModal = true;
      return;
    }

    if (this.total === 0) {
      this.modalMessage = ' No hay datos para descargar';
      this.modalLoading = false;
      this.showConfirmModal = true;
      return;
    }

    this.cargando = true;
    this.exportar();
  }

  /**
   * Cambiar de página (solo para emisores y auditoría)
   */
  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    // Para 'pagos' hacemos paginación en cliente (no reconsultar al servidor)
    if (this.tipoBusqueda === 'pagos') {
      const start = (this.page - 1) * this.pageSize;
      this.resultados = this.pagosAll.slice(start, start + this.pageSize);
      return;
    }
    this.cargarDatos();
  }

  /** Helper para la vista: calcula el valor mínimo para mostrar rango */
  minDisplay(a: number, b: number): number {
    return Math.min(a, b);
  }

  /**
   * Obtener las claves del primer registro para mostrar columnas
   */
  get columnas(): string[] {
    return this.resultados.length > 0 ? Object.keys(this.resultados[0]) : [];
  }

  /**
   * Normaliza una fecha ingresada por el usuario.
   * Acepta 'dd/mm/yyyy' o 'yyyy-mm-dd' y devuelve 'yyyy-mm-dd'.
   * Devuelve '' si el formato no es válido.
   */
  private normalizeFecha(input: string): string {
    if (!input) return '';
    input = input.trim();
    // ya está en formato ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    // dd/mm/yyyy -> convertir
    const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const d = m[1];
      const mo = m[2];
      const y = m[3];
      // validar rango básico
      const dd = parseInt(d, 10);
      const mm = parseInt(mo, 10);
      const yyyy = parseInt(y, 10);
      if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1900) return '';
      return `${yyyy}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return '';
  }
}
