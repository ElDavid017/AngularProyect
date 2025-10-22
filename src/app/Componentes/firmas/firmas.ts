import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { FirmasService } from '../../services/firmas.service';

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
  cod_dis = '';
  codigo_enganchador = '';
  estado = 'Todos';
  mostrarEstado = false; // ya no se usa, pero conservado por compatibilidad
  loading = false;
  datosCargados = false;
  firmas: any[] = [];
  totalResults = 0;
  pagina = 1;
  porPagina = 10;
  totalPaginas = 1;
  mostrarPaginacion = false;
  // copia completa de datos cuando la respuesta trae todos los registros (para paginación en cliente)
  private allFirmas: any[] = [];
  // helpers de paginación
  get startIndex(): number {
    return (this.pagina - 1) * this.porPagina + 1;
  }

  // Normaliza una fila para 'firmas generadas con factura'
  private normalizeFirmasGeneradasFacturaRow(raw: any): any {
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
      id: get(raw, ['id','ID','Id']) || '',
      ruc: get(raw, ['ruc','RUC']) || '',
      codUnico: get(raw, ['codUnico','cod_unico','codigo_unico']) || '',
      cedula: get(raw, ['cedula','Cedula']) || '',
      localizador: get(raw, ['localizador']) || '',
      codDis: get(raw, ['codDis','cod_dis','codidgo_distribuidor']) || '',
      nombre_distribuidor: get(raw, ['nombre_distribuidor','distribuidor','nombreDistribuidor']) || '',
      correo_distribuidor: get(raw, ['correo_distribuidor','correoDistribuidor','email_distribuidor']) || '',
      telefono_distribuidor: get(raw, ['telefono_distribuidor','telefonoDistribuidor','telefono','celular']) || '',
      tipo: get(raw, ['tipo']) || '',
      dia: get(raw, ['dia']) || '',
      mes: get(raw, ['mes']) || '',
      duracion: get(raw, ['duracion','duracion_firma']) || '',
      razon_social: get(raw, ['razon_social','razonSocial']) || '',
      direccion: get(raw, ['direccion']) || '',
      correo: get(raw, ['correo','email']) || '',
      telefono: get(raw, ['telefono','celular']) || '',
      valorC: get(raw, ['valorC','valor']) || '',
      Banco: get(raw, ['Banco','banco']) || '',
      codUserT: get(raw, ['codUserT','cod_user_t']) || '',
      horaIngreso: get(raw, ['horaIngreso','hora_ingreso']) || '',
      horaTramitacion: get(raw, ['horaTramitacion','hora_tramitacion']) || '',
      horaFinalizacion: get(raw, ['horaFinalizacion','hora_finalizacion']) || '',
      tiempoFirma: get(raw, ['tiempoFirma','tiempo_firma']) || '',
      Emisor: get(raw, ['Emisor','emisor']) || '',
      Estado: get(raw, ['Estado','estado']) || '',
      codUserF: get(raw, ['codUserF','cod_user_f']) || '',
      Comentario: get(raw, ['Comentario','comentario']) || '',
      periodo: get(raw, ['periodo','periodo_registro']) || '',
      clave: get(raw, ['clave']) || '',
      correo3: get(raw, ['correo3']) || '',
      creacionClave: get(raw, ['creacionClave','creacion_clave']) || '',
      notificado: get(raw, ['notificado']) || '',
      tipoP: get(raw, ['tipoP','tipo_p']) || '',
      comprobante: get(raw, ['comprobante']) || '',
      recurrencia: get(raw, ['recurrencia']) || '',
      codigo_factura: get(raw, ['codigo_factura','codigoFactura']) || '',
      numero_factura: get(raw, ['numero_factura','numeroFactura']) || '',
      identificacion_factura: get(raw, ['identificacion_factura','identificacionFactura']) || '',
      empresa_distribuidor: get(raw, ['empresa_distribuidor','empresaDistribuidor']) || ''
    };
  }

  // Normaliza una fila para 'filtro_distribuidores'
  private normalizeDistribuidorRow(raw: any): any {
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
      fecha_registro: get(raw, ['fecha_registro','fechaRegistro']) || '',
      codigo_distribuidor: get(raw, ['codigo_distribuidor','codigoDistribuidor','cod_distribuidor']) || '',
      ruc_distribuidor: get(raw, ['ruc_distribuidor','rucDistribuidor']) || '',
      nombre_distribuidor: get(raw, ['nombre_distribuidor','nombreDistribuidor']) || '',
      direccion_distribuidor: get(raw, ['direccion_distribuidor','direccionDistribuidor']) || '',
      telefoo_distribuidor: get(raw, ['telefoo_distribuidor','telefonoDistribuidor','telefono_distribuidor']) || '',
      cant_vendida: get(raw, ['cant_vendida','cantVendida','cantidad_vendida']) || 0,
      ruc_enganchador: get(raw, ['ruc_enganchador','rucEnganchador']) || '',
      nombre_enganchador: get(raw, ['nombre_enganchador','nombreEnganchador']) || ''
    };
  }

  // Normaliza una fila para 'firmas por enganchador'
  private normalizeFirmasPorEnganchadorRow(raw: any): any {
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
      RUC: get(raw, ['RUC','ruc']) || '',
      CEDULA: get(raw, ['CEDULA','cedula']) || '',
      RAZON_SOCIAL: get(raw, ['RAZON_SOCIAL','razon_social','razonSocial']) || '',
      TIPO: get(raw, ['TIPO','tipo']) || '',
      CODIGO_UNICO: get(raw, ['CODIGO_UNICO','codigo_unico','codUnico']) || '',
      DIA: get(raw, ['DIA','dia']) || '',
      MES: get(raw, ['MES','mes']) || '',
      PERIODO: get(raw, ['PERIODO','periodo','periodo_registro']) || '',
      DURACION: get(raw, ['DURACION','duracion','duracion_firma']) || '',
      DIRECCION: get(raw, ['DIRECCION','direccion']) || '',
      CORREO: get(raw, ['CORREO','correo','email']) || '',
      TELEFONO: get(raw, ['TELEFONO','telefono','celular']) || '',
      VALOR_COBRADO: get(raw, ['VALOR_COBRADO','valorC','valor']) || '',
      BANCO: get(raw, ['BANCO','banco']) || '',
      HORA_INGRESO: get(raw, ['HORA_INGRESO','horaIngreso','hora_ingreso']) || '',
      HORA_TRAMITACION: get(raw, ['HORA_TRAMITACION','horaTramitacion','hora_tramitacion']) || '',
      HORA_FINALIZACION: get(raw, ['HORA_FINALIZACION','horaFinalizacion','hora_finalizacion']) || '',
      TIEMPO_FIRMA: get(raw, ['TIEMPO_FIRMA','tiempoFirma','tiempo_firma']) || '',
      EMISOR: get(raw, ['EMISOR','emisor']) || '',
      ESTADO: get(raw, ['ESTADO','estado']) || '',
      COMENTARIO: get(raw, ['COMENTARIO','comentario']) || '',
      PLATAFORMA_FIRMAS: get(raw, ['PLATAFORMA_FIRMAS','plataforma_firmas']) || '',
      NOMBRE_DISTRIBUIDOR: get(raw, ['NOMBRE_DISTRIBUIDOR','nombre_distribuidor']) || '',
      CODIGO_DISTRIBUIDOR: get(raw, ['CODIGO_DISTRIBUIDOR','codigo_distribuidor','codDis']) || '',
      NOMBRE_ENGANCHADOR: get(raw, ['NOMBRE_ENGANCHADOR','nombre_enganchador']) || '',
      CODIGO_ENGANCHADOR: get(raw, ['CODIGO_ENGANCHADOR','codigo_enganchador']) || ''
    };
  }

  get endIndex(): number {
    return Math.min(this.totalResults, this.pagina * this.porPagina);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  constructor(private firmasService: FirmasService) {}

  // Modal de confirmación para cargar datos
  showConfirmModal = false;
  modalLoading = false;
  modalMessage = '';
  private modalStartAt = 0;
  private readonly minModalMs = 700;
  // pending buffer to avoid showing results while modal says 'Cargando'
  private pendingFirmas: any[] = [];
  private pendingTotalResults = 0;
  private pendingPagina = 1;
  private pendingPorPagina = 10;
  private pendingTotalPaginas = 1;
  private pendingMostrarPaginacion = false;
  private pendingError = false;

  ngOnInit() {
    this.toggleEstado();
  }

  cargarDatos() {
    // Si la selección es firmas_vendidas no necesitamos fechas
    if (this.tipoBusqueda !== 'firmas_vendidas') {
      // normalizar fechas si el usuario las ingresó como dd/mm/yyyy
      const fi = this.normalizeFecha(this.fechaInicio);
      const ff = this.normalizeFecha(this.fechaFin);
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
      this.fechaInicio = fi;
      this.fechaFin = ff;
    }
    // iniciar la carga inmediatamente y mostrar modal en estado cargando
    this.modalLoading = true;
    this.modalStartAt = Date.now();
    this.showConfirmModal = true;
    // Si la selección es firmas_vendidas, no necesitamos parametros: descargar Excel directo
  if (this.tipoBusqueda === 'firmas_vendidas') {
      // pedir datos JSON y mostrarlos (la descarga será opcional mediante el botón 'DESCARGAR EXCEL')
      this.firmasService.obtenerFirmasVendidas()
        .subscribe({
          next: (resp: any) => {
            const normalizeResponse = (r: any): { rows: any[] } => {
              if (!r) return { rows: [] };
              if (Array.isArray(r)) return { rows: r };
              // si devuelve { '0': {...}, '1': {...} }
              const numericKeys = Object.keys(r).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b));
              if (numericKeys.length > 0) return { rows: numericKeys.map(k => r[k]) };
              // si viene en items
              if (r.items && Array.isArray(r.items)) return { rows: r.items };
              // si viene en data o firmas
              if (Array.isArray(r.data)) return { rows: r.data };
              if (Array.isArray(r.firmas)) return { rows: r.firmas };
              return { rows: [r] };
            };

            const { rows } = normalizeResponse(resp);
            const normalizedRows = (rows || []).map((x: any) => this.normalizeFirmasVendidasRow(this.deepParse(x)));
            this.pendingFirmas = normalizedRows;
            this.pendingTotalResults = normalizedRows.length;
            this.pendingTotalPaginas = Math.max(1, Math.ceil(this.pendingTotalResults / this.porPagina));
            this.pendingMostrarPaginacion = this.pendingTotalPaginas > 1;
            this.pendingPagina = this.pagina;
            this.pendingPorPagina = this.porPagina;
            this.pendingError = false;
            this.loading = false;

            // respetar mínimo de modal
            const elapsed = Date.now() - this.modalStartAt;
            const remaining = Math.max(0, this.minModalMs - elapsed);
            setTimeout(() => {
              this.commitPending();
              this.modalLoading = false;
              this.showConfirmModal = false;
            }, remaining);
          },
          error: (err: any) => {
            console.error('Error al obtener firmas vendidas:', err);
            this.pendingFirmas = [];
            this.pendingTotalResults = 0;
            this.pendingError = true;
            this.loading = false;
            // mostrar mensaje de error en modal
            this.modalLoading = false;
            this.modalMessage = '❌ Error al cargar Firmas Vendidas';
            this.showConfirmModal = true;
          }
        });
      return;
    }

    // Nuevo selector: firmas por enganchador puede pedirse desde cargarDatos si se selecciona
    if (this.tipoBusqueda === 'firmas_por_enganchador') {
      // validar que exista codigo_enganchador
      if (!this.codigo_enganchador) {
        this.modalMessage = ' Por favor, ingresa el código del enganchador.';
        this.modalLoading = false;
        this.showConfirmModal = true;
        return;
      }
    }

    this.buscar(1, () => {
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

  confirmLoad() {
    // OK ahora solo cierra el modal; la carga sigue en background
    this.showConfirmModal = false;
  }

  cancelLoad() {
    this.showConfirmModal = false;
  }

  private normalizeFecha(input: string): string {
    if (!input) return '';
    input = input.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const d = m[1];
      const mo = m[2];
      const y = m[3];
      const dd = parseInt(d, 10);
      const mm = parseInt(mo, 10);
      const yyyy = parseInt(y, 10);
      if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1900) return '';
      return `${yyyy}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return '';
  }

  // Intentar parsear filas que vengan como JSON stringificado
  private tryParseRow(raw: any): any {
    if (typeof raw === 'string') {
      try { const p = JSON.parse(raw); return p; } catch (e) { return raw; }
    }
    return raw;
  }

  // deep parser: si algún campo viene como JSON stringificado, lo parsea recursivamente
  private deepParse(val: any): any {
    if (typeof val === 'string') {
      let s: any = val.trim();
      // Intentar parseado repetido para manejar strings doble-escapados
      for (let i = 0; i < 3; i++) {
        if (typeof s === 'string') {
          const t = s.trim();
          // si es objeto o array JSON claro
          if (t.startsWith('{') || t.startsWith('[')) {
            try { s = JSON.parse(t); continue; } catch (e) { break; }
          }
          // si está envuelto en comillas (ej: "{...}") intentar parsear
          if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
            try { s = JSON.parse(t); continue; } catch (e) { break; }
          }
        }
        break;
      }
      // si tras intentos quedó parseado a objeto/array, procesarlo recursivamente
      if (typeof s !== 'string') return this.deepParse(s);
      return s;
    }
    if (Array.isArray(val)) return val.map(v => this.deepParse(v));
    if (val && typeof val === 'object') {
      const out: any = {};
      for (const k of Object.keys(val)) {
        out[k] = this.deepParse(val[k]);
      }
      return out;
    }
    return val;
  }

  toggleEstado() {
    // En la nueva lógica COD DIS solo aplica para 'firmas_fecha'
    if (this.tipoBusqueda !== 'firmas_fecha') {
      this.cod_dis = '';
    }
    // Limpiar resultados y paginación al cambiar de selector para evitar que queden datos residuales
    this.firmas = [];
    this.totalResults = 0;
    this.pagina = 1;
    this.totalPaginas = 1;
    this.mostrarPaginacion = false;
    this.datosCargados = false;
    this.loading = false;
  }

  buscar(nuevaPagina = 1, onFinish?: () => void) {
    // marcamos que aún no se cargaron datos (se activará tras ejecutar la búsqueda)
    this.datosCargados = false;

    if (!this.fechaInicio || !this.fechaFin) {
      // mostrar validación en modal
      this.modalMessage = ' Por favor, ingresa ambas fechas.';
      this.modalLoading = false;
      this.showConfirmModal = true;
      return;
    }

    if (this.fechaInicio > this.fechaFin) {
      this.modalMessage = ' La fecha de inicio no puede ser mayor que la fecha de fin.';
      this.modalLoading = false;
      this.showConfirmModal = true;
      return;
    }

    this.pagina = nuevaPagina;
  this.loading = true;
    this.firmas = [];
    this.mostrarPaginacion = false;

    const normalizeResponse = (resp: any): { rows: any[]; totalPages?: number } => {
      if (!resp) return { rows: [], totalPages: 1 };

      // Manejar 'items' cuando la API devuelve { items: [ { '0': {...}, '1': {...} } ] } o { items: [ {...}, {...} ] }
      if (resp.items && Array.isArray(resp.items) && resp.items.length > 0) {
        const items = resp.items;
        const first = items[0];

        // Caso: items = [ { '0': {...}, '1': {...} } ] -> convertir a array de filas
        if (first && typeof first === 'object' && !Array.isArray(first)) {
          const numericKeys = Object.keys(first).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b));
          if (numericKeys.length > 0) {
            const rows = numericKeys.map(k => first[k]);
            const totalPages = resp.totalPages ?? resp.total_paginas ?? (Array.isArray(items[1]) ? undefined : undefined);
            return { rows, totalPages };
          }
        }

        // Caso: items = [ {..}, {..}, ... ] -> items ya es un array de filas
        if (Array.isArray(items) && items.every(it => typeof it === 'object')) {
          const rows = items as any[];
          const totalPages = resp.totalPages ?? resp.total_paginas;
          return { rows, totalPages };
        }
      }

      // Si es array: [ obj_con_claves_numericas, metadata ] o [ [ {...}, {...} ], meta ] o array plano
      if (Array.isArray(resp) && resp.length > 0) {
        const first = resp[0];
        // primer elemento es objeto con claves numéricas
        if (first && typeof first === 'object' && !Array.isArray(first)) {
          const numericKeys = Object.keys(first).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b));
          if (numericKeys.length > 0) {
            const rows = numericKeys.map(k => first[k]);
            const totalPages = resp[1]?.totalPages;
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

        // { items: [ { '0': {...}, '1': {...} } ], ... } ya manejado arriba pero volvemos a comprobar
        if (resp.items && Array.isArray(resp.items) && resp.items.length > 0) {
          const first = resp.items[0];
          if (first && typeof first === 'object') {
            const numericKeys = Object.keys(first).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b));
            if (numericKeys.length > 0) {
              const rows = numericKeys.map(k => first[k]);
              return { rows, totalPages: resp.totalPages };
            }
          }
        }

        // Objeto con claves numéricas: { '0': {...}, '1': {...} }
        const numericKeys = Object.keys(resp).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b));
        if (numericKeys.length > 0) {
          const rows = numericKeys.map(k => resp[k]);
          return { rows, totalPages: resp.totalPages };
        }
      }

      // Fallback
      return { rows: [], totalPages: 1 };
    };

    // usando this.deepParse para normalizar campos string JSON antes de normalizar filas

    const normalizeRow = (raw: any) => {
      // si la fila viene como string JSON, intentar parsearla
      if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch (e) { return raw; }
      }
      if (!raw || typeof raw !== 'object') return raw;

      const get = (candidates: string[]) => {
        for (const k of candidates) {
          if (k in raw && raw[k] != null) return raw[k];
        }
        // case-insensitive fallback
        const keys = Object.keys(raw);
        for (const k of candidates) {
          const found = keys.find(pk => pk.toLowerCase() === k.toLowerCase());
          if (found) return raw[found];
        }
        return undefined;
      };

      const row: any = { ...raw };

      // Campos comunes
      row.cedula = get(['cedula', 'Cedula', 'CÉDULA']) || row.cedula || row.Cedula || row.CEDULA;
      row.razon_social = get(['razon_social', 'razonSocial', 'razon social', 'RazonSocial']) || row.razon_social || row.RazonSocial;
      row.tipo_persona = get(['tipo_persona', 'tipoPersona']) || row.tipo_persona;
      row.fecha_registro = get(['fecha_registro', 'fechaRegistro', 'fecha_registro']) || row.fecha_registro;
      row.celular = get(['celular', 'telefono', 'movil']) || row.celular;
      row.duracion_firma = get(['duracion_firma', 'duracionFirma', 'duracion', 'duracion_firma']) || row.duracion_firma || row.duracion;
      // distribuidor / codigo distribuidor
      row.codidgo_distribuidor = get(['codidgo_distribuidor','codigo_distribuidor','codigodistribuidor','codigo_distribuidor']) || row.codidgo_distribuidor || row.codigo_distribuidor;
      row.distribuidor = get(['distribuidor','Distribuidor']) || row.distribuidor;
      row.periodo_registro = get(['periodo_registro','periodoRegistro','periodo_registro']) || row.periodo_registro;

      // Campos para 'caducar' (mantenemos mayúsculas porque el template las usa)
      const inicioVal = get(['Inicio','inicio','fecha_inicio','fechaInicio']);
      if (inicioVal !== undefined) { row.Inicio = inicioVal; row.inicio = inicioVal; }

      const cadVal = get(['CADUCIDAD','caducidad','fecha_caducidad','fechaCaducidad']);
      if (cadVal !== undefined) { row.CADUCIDAD = cadVal; row.caducidad = cadVal; }

      const estadoVal = get(['Estado','estado','ESTADO']);
      if (estadoVal !== undefined) { row.Estado = estadoVal; row.estado = estadoVal; }

      return row;
    };

    // (normalizeFacturaRow se implementa como método de clase más abajo)

  if (this.tipoBusqueda === 'firmas_fecha') {
      this.firmasService.buscarRegistrosPorFecha(this.fechaInicio, this.fechaFin, this.cod_dis)
        .subscribe({
          next: (resp: any) => {
                const { rows, totalPages } = normalizeResponse(resp);
              const normalizedRows = (rows || []).map(r => normalizeRow(this.deepParse(r)));
                const total = normalizedRows.length || 0;
                // Guardar en buffer y no mostrar hasta commitPending
                this.pendingFirmas = (resp && resp.firmas) ? normalizedRows : (
                  Array.isArray(resp) && Array.isArray(resp[0]) ? normalizedRows : normalizedRows
                );
                this.pendingTotalResults = total;
                this.pendingTotalPaginas = totalPages || Math.max(1, Math.ceil(total / this.porPagina));
                this.pendingMostrarPaginacion = this.pendingTotalPaginas > 1;
                this.pendingPagina = this.pagina;
                this.pendingPorPagina = this.porPagina;
                this.pendingError = false;
                this.loading = false;
                onFinish?.();
            },
          error: (error: any) => {
            console.error('Error al cargar los registros:', error);
            // mostrar error en modal
            this.loading = false;
            this.pendingFirmas = [];
            this.pendingTotalResults = 0;
            this.pendingError = true;
            this.modalLoading = false;
            this.modalMessage = '❌ Error al cargar los registros.';
            this.showConfirmModal = true;
            onFinish?.();
          },
          complete: () => {
            this.loading = false;
          }
        });
    }
  // Nuevo caso: facturas por fecha
    if (this.tipoBusqueda === 'facturas_fecha') {
      this.firmasService.buscarFacturasPorFechas(this.fechaInicio, this.fechaFin, this.cod_dis)
        .subscribe({
          next: (resp: any) => {
            const { rows, totalPages } = normalizeResponse(resp);
            const normalizedRows = (rows || []).map(r => this.normalizeFacturaRow(this.deepParse(r)));
            const total = normalizedRows.length || 0;
            this.pendingFirmas = normalizedRows;
            this.pendingTotalResults = total;
            this.pendingTotalPaginas = totalPages || Math.max(1, Math.ceil(total / this.porPagina));
            this.pendingMostrarPaginacion = this.pendingTotalPaginas > 1;
            this.pendingPagina = this.pagina;
            this.pendingPorPagina = this.porPagina;
            this.pendingError = false;
            this.loading = false;
            onFinish?.();
          },
          error: (error: any) => {
            console.error('Error al cargar facturas por fechas:', error);
            this.loading = false;
            this.pendingFirmas = [];
            this.pendingTotalResults = 0;
            this.pendingError = true;
            this.modalLoading = false;
            this.modalMessage = '❌ Error al cargar las facturas.';
            this.showConfirmModal = true;
            onFinish?.();
          }
        });
    }
    // Nuevo caso: firmas generadas con factura
    if (this.tipoBusqueda === 'firmas_generadas_factura') {
      this.firmasService.buscarFirmasGeneradasConFactura(this.fechaInicio, this.fechaFin)
        .subscribe({
          next: (resp: any) => {
            const { rows, totalPages } = normalizeResponse(resp);
            const normalizedRows = (rows || []).map(r => this.normalizeFirmasGeneradasFacturaRow(this.deepParse(r)));
            const total = normalizedRows.length || 0;
            this.pendingFirmas = normalizedRows;
            this.pendingTotalResults = total;
            this.pendingTotalPaginas = totalPages || Math.max(1, Math.ceil(total / this.porPagina));
            this.pendingMostrarPaginacion = this.pendingTotalPaginas > 1;
            this.pendingPagina = this.pagina;
            this.pendingPorPagina = this.porPagina;
            this.pendingError = false;
            this.loading = false;
            onFinish?.();
          },
          error: (error: any) => {
            console.error('Error al cargar firmas generadas con factura:', error);
            this.loading = false;
            this.pendingFirmas = [];
            this.pendingTotalResults = 0;
            this.pendingError = true;
            this.modalLoading = false;
            this.modalMessage = '❌ Error al cargar firmas generadas con factura.';
            this.showConfirmModal = true;
            onFinish?.();
          }
        });
    }
    // Nuevo caso: filtro de distribuidores por fechas
    if (this.tipoBusqueda === 'filtro_distribuidores') {
      this.firmasService.filtrarDistribuidoresPorFechas(this.fechaInicio, this.fechaFin)
        .subscribe({
          next: (resp: any) => {
            const { rows, totalPages } = normalizeResponse(resp);
            const normalizedRows = (rows || []).map(r => this.normalizeDistribuidorRow(this.deepParse(r)));
            const total = normalizedRows.length || 0;
            this.pendingFirmas = normalizedRows;
            this.pendingTotalResults = total;
            this.pendingTotalPaginas = totalPages || Math.max(1, Math.ceil(total / this.porPagina));
            this.pendingMostrarPaginacion = this.pendingTotalPaginas > 1;
            this.pendingPagina = this.pagina;
            this.pendingPorPagina = this.porPagina;
            this.pendingError = false;
            this.loading = false;
            onFinish?.();
          },
          error: (error: any) => {
            console.error('Error al cargar distribuidores:', error);
            this.loading = false;
            this.pendingFirmas = [];
            this.pendingTotalResults = 0;
            this.pendingError = true;
            this.modalLoading = false;
            this.modalMessage = '❌ Error al cargar los distribuidores.';
            this.showConfirmModal = true;
            onFinish?.();
          }
        });
    }
    // Nuevo caso: firmas por enganchador
    if (this.tipoBusqueda === 'firmas_por_enganchador') {
      this.firmasService.buscarFirmasPorEnganchador(this.fechaInicio, this.fechaFin, this.codigo_enganchador)
        .subscribe({
          next: (resp: any) => {
            const { rows, totalPages } = normalizeResponse(resp);
            const normalizedRows = (rows || []).map(r => this.normalizeFirmasPorEnganchadorRow(this.deepParse(r)));
            const total = normalizedRows.length || 0;
            this.pendingFirmas = normalizedRows;
            this.pendingTotalResults = total;
            this.pendingTotalPaginas = totalPages || Math.max(1, Math.ceil(total / this.porPagina));
            this.pendingMostrarPaginacion = this.pendingTotalPaginas > 1;
            this.pendingPagina = this.pagina;
            this.pendingPorPagina = this.porPagina;
            this.pendingError = false;
            this.loading = false;
            onFinish?.();
          },
          error: (error) => {
            console.error('Error al cargar firmas por enganchador:', error);
            this.loading = false;
            this.pendingFirmas = [];
            this.pendingTotalResults = 0;
            this.pendingError = true;
            this.modalLoading = false;
            this.modalMessage = '❌ Error al cargar firmas por enganchador.';
            this.showConfirmModal = true;
            onFinish?.();
          }
        });
    }
    // Nota: firmas_vendidas se maneja en cargarDatos() porque no necesita parámetros
  }

  private commitPending() {
    if (this.pendingError) {
      this.firmas = [];
      this.totalResults = 0;
      this.datosCargados = true;
      return;
    }
    // Si el buffer contiene todos los registros (array completo), almacenarlos en allFirmas y mostrar page slice
    this.allFirmas = Array.isArray(this.pendingFirmas) ? this.pendingFirmas : [];
    this.totalResults = this.pendingTotalResults;
    this.totalPaginas = this.pendingTotalPaginas;
    this.paginarCliente();
    this.mostrarPaginacion = this.pendingMostrarPaginacion;
    this.datosCargados = true;
  }

  private paginarCliente() {
    if (!this.allFirmas || this.allFirmas.length === 0) {
      this.firmas = [];
      this.pagina = 1;
      return;
    }
    this.pagina = Math.min(Math.max(1, this.pendingPagina), Math.max(1, this.totalPaginas));
    const start = (this.pagina - 1) * this.porPagina;
    this.firmas = this.allFirmas.slice(start, start + this.porPagina);
  }

  cambiarPagina(cambio: number) {
    const nuevaPagina = this.pagina + cambio;
    if (nuevaPagina < 1 || nuevaPagina > this.totalPaginas) return;

    // Si tenemos todos los datos cargados en cliente, solo hacemos slice
    if (this.allFirmas && this.allFirmas.length > 0) {
      this.pagina = nuevaPagina;
      const start = (this.pagina - 1) * this.porPagina;
      this.firmas = this.allFirmas.slice(start, start + this.porPagina);
      this.mostrarPaginacion = this.totalPaginas > 1;
      return;
    }

    // Si no tenemos los datos completos, reconsultar al servidor con la nueva página
    this.buscar(nuevaPagina);
  }

  goToPage(n: number) {
    if (n < 1 || n > this.totalPaginas || n === this.pagina) return;

    if (this.allFirmas && this.allFirmas.length > 0) {
      this.pagina = n;
      const start = (this.pagina - 1) * this.porPagina;
      this.firmas = this.allFirmas.slice(start, start + this.porPagina);
      this.mostrarPaginacion = this.totalPaginas > 1;
      return;
    }

    this.buscar(n);
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

  // Normaliza una fila de 'firmas vendidas' para asegurar campos consistentes
  private normalizeFirmasVendidasRow(raw: any): any {
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
      USUAPELLIDO: get(raw, ['USUAPELLIDO','usuapellido','apellido','USUARIO']) || '',
      codUserT: get(raw, ['codUserT','coduserT','codUser','codUserT']) || get(raw, ['coduser','cod']),
      mes: get(raw, ['mes']) || '',
      periodo: get(raw, ['periodo','periodo_registro']) || '',
      '1_año': get(raw, ['1_año','1_años','1_ano','1año']) || 0,
      '2_años': get(raw, ['2_años','2_años','2_anos']) || 0,
      '3_años': get(raw, ['3_años']) || 0,
      '4_años': get(raw, ['4_años']) || 0,
      '5_años': get(raw, ['5_años']) || 0,
      '1_mes': get(raw, ['1_mes']) || 0,
      '6_meses': get(raw, ['6_meses']) || 0,
      '7_días': get(raw, ['7_días','7_dias']) || 0,
      '15_días': get(raw, ['15_días','15_dias']) || 0,
      'sin_duración': get(raw, ['sin_duración','sin_duracion']) || 0,
      total_firmas: get(raw, ['total_firmas','total']) || 0,
    };
  }

  // Normaliza una fila de factura en un objeto consistente
  private normalizeFacturaRow(raw: any): any {
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

    const base: any = { ...raw };
    base.id = get(raw, ['id','ID']) || base.id;
    base.ruc = get(raw, ['ruc','RUC']) || base.ruc;
    base.codUnico = get(raw, ['codUnico','cod_unico','codigo_unico']) || base.codUnico;
    base.localizador = get(raw, ['localizador']) || base.localizador;
    base.codDis = get(raw, ['codDis','cod_dis','codidgo_distribuidor','codigo_distribuidor']) || base.codDis || base.codidgo_distribuidor;
    base.tipo = get(raw, ['tipo','Tipo']) || base.tipo;
    base.dia = get(raw, ['dia']) || base.dia;
    base.mes = get(raw, ['mes']) || base.mes;
    base.duracion = get(raw, ['duracion','duracion_firma']) || base.duracion || base.duracion_firma;
    base.razon_social = get(raw, ['razon_social','razonSocial','RazonSocial']) || base.razon_social || base.RazonSocial;
    base.direccion = get(raw, ['direccion','Direccion']) || base.direccion;
    base.correo = get(raw, ['correo','email','Correo']) || base.correo;
    base.telefono = get(raw, ['telefono','Telefono','celular']) || base.telefono || base.celular;
    base.valorC = get(raw, ['valorC','valor']) || base.valorC;
    base.Banco = get(raw, ['Banco','banco']) || base.Banco;
    base.codUserT = get(raw, ['codUserT','cod_user_t']) || base.codUserT;
    base.horaIngreso = get(raw, ['horaIngreso','hora_ingreso']) || base.horaIngreso;
    base.horaTramitacion = get(raw, ['horaTramitacion','hora_tramitacion']) || base.horaTramitacion;
    base.Estado = get(raw, ['Estado','estado','ESTADO']) || base.Estado || base.estado;
    base.periodo = get(raw, ['periodo','periodo_registro']) || base.periodo || base.periodo_registro;
    base.clave = get(raw, ['clave']) || base.clave;
    base.tipoP = get(raw, ['tipoP','tipo_p']) || base.tipoP;
    return base;
  }

  exportarExcel() {
    // Para 'firmas_vendidas' no requerimos fechas
    if (this.tipoBusqueda !== 'firmas_vendidas' && (!this.fechaInicio || !this.fechaFin)) {
      this.modalMessage = ' Por favor, ingresa ambas fechas antes de exportar.';
      this.modalLoading = false;
      this.showConfirmModal = true;
      return;
    }

    // Usar el endpoint correcto según el tipo de búsqueda
    let exportObservable: Observable<Blob>;
    let filename: string;

    if (this.tipoBusqueda === 'firmas_caducar') {
      exportObservable = this.firmasService.exportarFirmasCaducarExcel(this.fechaInicio, this.fechaFin, this.estado, this.cod_dis);
      filename = `firmas_caducar_${this.fechaInicio.replace(/\//g, '-')}_${this.fechaFin.replace(/\//g, '-')}.xlsx`;
    } else if (this.tipoBusqueda === 'facturas_fecha') {
      // Generar .xlsx en cliente usando SheetJS
      const filenameXlsx = `facturas_${this.fechaInicio.replace(/\//g, '-')}_${this.fechaFin.replace(/\//g, '-')}.xlsx`;
      this.firmasService.buscarFacturasPorFechas(this.fechaInicio, this.fechaFin, this.cod_dis)
        .subscribe({
          next: async (resp: any) => {
            // Normalize response as before
            const normalizeResponse = (resp2: any): { rows: any[] } => {
              if (!resp2) return { rows: [] };
              if (resp2.items && Array.isArray(resp2.items) && resp2.items.length > 0) {
                const items = resp2.items;
                const first = items[0];
                if (first && typeof first === 'object' && !Array.isArray(first)) {
                  const numericKeys = Object.keys(first).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b));
                  if (numericKeys.length > 0) return { rows: numericKeys.map(k => first[k]) };
                }
                if (Array.isArray(items) && items.every(it => typeof it === 'object')) return { rows: items as any[] };
              }
              if (Array.isArray(resp2) && resp2.length > 0) {
                const first = resp2[0];
                if (first && typeof first === 'object' && !Array.isArray(first)) {
                  const numericKeys = Object.keys(first).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b));
                  if (numericKeys.length > 0) return { rows: numericKeys.map(k => first[k]) };
                }
                if (Array.isArray(first)) return { rows: first };
                if (first && typeof first === 'object') return { rows: resp2 };
              }
              if (typeof resp2 === 'object' && !Array.isArray(resp2)) {
                if (Array.isArray(resp2.firmas)) return { rows: resp2.firmas };
                const numericKeys = Object.keys(resp2).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b));
                if (numericKeys.length > 0) return { rows: numericKeys.map(k => resp2[k]) };
              }
              return { rows: [] };
            };

            const { rows } = normalizeResponse(resp);
            console.log('Export facturas - raw rows count:', (rows || []).length, 'sample:', rows && rows[0]);
            let normalized = (rows || []).map(r => this.normalizeFacturaRow(this.deepParse(r)));
            // Si no vinieron filas pero ya tenemos allFirmas en el cliente, usarlo como fallback
            if ((!normalized || normalized.length === 0) && Array.isArray(this.allFirmas) && this.allFirmas.length > 0) {
              console.warn('Export facturas - response empty, using client cache allFirmas length=', this.allFirmas.length);
              normalized = this.allFirmas.map(r => this.normalizeFacturaRow(this.deepParse(r)));
            }

            console.log('Export facturas - normalized rows count:', (normalized || []).length);

            // Encabezados y orden deseado
            const headers = [
              'id','ruc','codUnico','cedula','localizador','codDis','tipo','dia','mes','duracion','razon_social','direccion','correo','telefono','valorC','Banco','codUserT','horaIngreso','horaTramitacion','Estado','periodo','clave','tipoP'
            ];

            // Fallbacks: si normalized está vacío, probar otras fuentes cliente (allFirmas, pending, visible)
            const mapFactura = (arr: any[]) => (arr || []).map(r => this.normalizeFacturaRow(this.deepParse(r)));
            let finalRows = (normalized || []);
            if (!finalRows || finalRows.length === 0) {
              if (Array.isArray(this.allFirmas) && this.allFirmas.length > 0) finalRows = mapFactura(this.allFirmas);
            }
            if (!finalRows || finalRows.length === 0) {
              if (Array.isArray(this.pendingFirmas) && this.pendingFirmas.length > 0) finalRows = mapFactura(this.pendingFirmas);
            }
            if (!finalRows || finalRows.length === 0) {
              if (Array.isArray(this.firmas) && this.firmas.length > 0) finalRows = mapFactura(this.firmas);
            }

            console.log('Export facturas - using rows count:', (finalRows || []).length);
            console.log('Export facturas - first finalRow sample:', finalRows && finalRows[0]);

            // Construir matriz de datos para SheetJS
            const data: any[][] = [];
            data.push(headers);
            for (const item of finalRows) {
              const row = headers.map(h => item?.[h] ?? item?.[h.toLowerCase()] ?? '');
              data.push(row);
            }

            console.log('Export facturas - data matrix built, total rows:', data.length, 'first data row:', data[1]);

            // Importar dinámicamente sheetjs
            const XLSX = await import('xlsx');
            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Facturas');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filenameXlsx;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          },
          error: (err: any) => {
            console.error('Error al exportar facturas a XLSX:', err);
            this.modalMessage = '❌ Error al generar el Excel de facturas.';
            this.modalLoading = false;
            this.showConfirmModal = true;
          }
        });
      return;
    } else if (this.tipoBusqueda === 'firmas_vendidas') {
      exportObservable = this.firmasService.exportarFirmasVendidasExcel();
      filename = `firmas_vendidas_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else if (this.tipoBusqueda === 'firmas_generadas_factura') {
      const filenameXlsx = `firmas_generadas_factura_${this.fechaInicio.replace(/\//g, '-')}_${this.fechaFin.replace(/\//g, '-')}.xlsx`;
      
      // USAR DIRECTAMENTE allFirmas que ya está normalizado y listo
      // (Mismo patrón que facturas_fecha pero sin hacer llamada al servidor)
      (async () => {
        try {
          const headers = [
            'id','ruc','codUnico','cedula','localizador','codDis','nombre_distribuidor','correo_distribuidor','telefono_distribuidor','tipo','dia','mes','duracion','razon_social','direccion','correo','telefono','valorC','Banco','codUserT','horaIngreso','horaTramitacion','horaFinalizacion','tiempoFirma','Emisor','Estado','codUserF','Comentario','periodo','clave','correo3','creacionClave','notificado','tipoP','comprobante','recurrencia','codigo_factura','numero_factura','identificacion_factura','empresa_distribuidor'
          ];

          // Usar allFirmas directamente (ya está normalizado cuando se cargó)
          let finalRows = Array.isArray(this.allFirmas) && this.allFirmas.length > 0 ? this.allFirmas : [];
          
          // Si allFirmas está vacío, intentar con pendingFirmas o firmas
          if (!finalRows || finalRows.length === 0) {
            finalRows = Array.isArray(this.pendingFirmas) && this.pendingFirmas.length > 0 ? this.pendingFirmas : [];
          }
          if (!finalRows || finalRows.length === 0) {
            finalRows = Array.isArray(this.firmas) && this.firmas.length > 0 ? this.firmas : [];
          }

          console.log('Export firmas_generadas - usando allFirmas directamente, count:', finalRows.length);
          console.log('Export firmas_generadas - primera fila:', finalRows[0]);

          // Si no hay datos, mostrar error
          if (!finalRows || finalRows.length === 0) {
            this.modalMessage = '⚠️ No hay datos para exportar. Por favor, carga los datos primero.';
            this.modalLoading = false;
            this.showConfirmModal = true;
            return;
          }

          // Construir matriz de datos para SheetJS
          const data: any[][] = [];
          data.push(headers);
          for (const item of finalRows) {
            const row = headers.map(h => item?.[h] ?? item?.[h.toLowerCase()] ?? '');
            data.push(row);
          }

          console.log('Export firmas_generadas - matriz construida, total filas:', data.length);
          console.log('Export firmas_generadas - primera fila de datos:', data[1]);

          // Importar dinámicamente sheetjs
          const XLSX = await import('xlsx');
          const ws = XLSX.utils.aoa_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Firmas con Factura');
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([wbout], { type: 'application/octet-stream' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filenameXlsx;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Error al exportar firmas generadas a XLSX:', err);
          this.modalMessage = '❌ Error al generar el Excel de Firmas con Factura.';
          this.modalLoading = false;
          this.showConfirmModal = true;
        }
      })();
      return;
    } else if (this.tipoBusqueda === 'filtro_distribuidores') {
      const filenameXlsx = `distribuidores_${this.fechaInicio.replace(/\//g, '-')}_${this.fechaFin.replace(/\//g, '-')}.xlsx`;
      
      // USAR DIRECTAMENTE allFirmas que ya está normalizado
      (async () => {
        try {
          const headers = [
            'fecha_registro','codigo_distribuidor','ruc_distribuidor','nombre_distribuidor','direccion_distribuidor','telefoo_distribuidor','cant_vendida','ruc_enganchador','nombre_enganchador'
          ];

          // Usar allFirmas directamente (ya está normalizado cuando se cargó)
          let finalRows = Array.isArray(this.allFirmas) && this.allFirmas.length > 0 ? this.allFirmas : [];
          
          // Si allFirmas está vacío, intentar con pendingFirmas o firmas
          if (!finalRows || finalRows.length === 0) {
            finalRows = Array.isArray(this.pendingFirmas) && this.pendingFirmas.length > 0 ? this.pendingFirmas : [];
          }
          if (!finalRows || finalRows.length === 0) {
            finalRows = Array.isArray(this.firmas) && this.firmas.length > 0 ? this.firmas : [];
          }

          console.log('Export distribuidores - usando allFirmas directamente, count:', finalRows.length);
          console.log('Export distribuidores - primera fila:', finalRows[0]);

          // Si no hay datos, mostrar error
          if (!finalRows || finalRows.length === 0) {
            this.modalMessage = '⚠️ No hay datos para exportar. Por favor, carga los datos primero.';
            this.modalLoading = false;
            this.showConfirmModal = true;
            return;
          }

          // Construir matriz de datos para SheetJS
          const data: any[][] = [];
          data.push(headers);
          for (const item of finalRows) {
            const row = headers.map(h => item?.[h] ?? item?.[h.toLowerCase()] ?? '');
            data.push(row);
          }

          console.log('Export distribuidores - matriz construida, total filas:', data.length);
          console.log('Export distribuidores - primera fila de datos:', data[1]);

          // Importar dinámicamente sheetjs
          const XLSX = await import('xlsx');
          const ws = XLSX.utils.aoa_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Distribuidores');
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([wbout], { type: 'application/octet-stream' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filenameXlsx;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Error al exportar distribuidores a XLSX:', err);
          this.modalMessage = '❌ Error al generar el Excel de Distribuidores.';
          this.modalLoading = false;
          this.showConfirmModal = true;
        }
      })();
      return;
    } else {
      // Nuevo: exportar firmas por enganchador (usar allFirmas/pending/fallback)
      if (this.tipoBusqueda === 'firmas_por_enganchador') {
        const filenameXlsx = `firmas_por_enganchador_${this.fechaInicio.replace(/\//g, '-')}_${this.fechaFin.replace(/\//g, '-')}_${this.codigo_enganchador || 'all'}.xlsx`;
        (async () => {
          try {
            const headers = [
              'ID','RUC','CEDULA','RAZON_SOCIAL','TIPO','CODIGO_UNICO','DIA','MES','PERIODO','DURACION','DIRECCION','CORREO','TELEFONO','VALOR_COBRADO','BANCO','HORA_INGRESO','HORA_TRAMITACION','HORA_FINALIZACION','TIEMPO_FIRMA','EMISOR','ESTADO','COMENTARIO','PLATAFORMA_FIRMAS','NOMBRE_DISTRIBUIDOR','CODIGO_DISTRIBUIDOR','NOMBRE_ENGANCHADOR','CODIGO_ENGANCHADOR'
            ];

            let finalRows = Array.isArray(this.allFirmas) && this.allFirmas.length > 0 ? this.allFirmas : [];
            if (!finalRows || finalRows.length === 0) finalRows = Array.isArray(this.pendingFirmas) && this.pendingFirmas.length > 0 ? this.pendingFirmas : [];
            if (!finalRows || finalRows.length === 0) finalRows = Array.isArray(this.firmas) && this.firmas.length > 0 ? this.firmas : [];

            if (!finalRows || finalRows.length === 0) {
              this.modalMessage = '⚠️ No hay datos para exportar. Por favor, carga los datos primero.';
              this.modalLoading = false;
              this.showConfirmModal = true;
              return;
            }

            // Construir matriz
            const data: any[][] = [];
            data.push(headers);
            for (const item of finalRows) {
              const row = headers.map(h => item?.[h] ?? item?.[h.toLowerCase()] ?? '');
              data.push(row);
            }

            const XLSX = await import('xlsx');
            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'FirmasPorEnganchador');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filenameXlsx;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          } catch (err) {
            console.error('Error al exportar firmas por enganchador a XLSX:', err);
            this.modalMessage = '❌ Error al generar el Excel de Firmas por Enganchador.';
            this.modalLoading = false;
            this.showConfirmModal = true;
          }
        })();
        return;
      }
      exportObservable = this.firmasService.exportarRegistrosExcel(this.fechaInicio, this.fechaFin, this.cod_dis);
      filename = `registros_firmas_${this.fechaInicio.replace(/\//g, '-')}_${this.fechaFin.replace(/\//g, '-')}.xlsx`;
    }

    exportObservable.subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Error al exportar Excel:', err);
        this.modalMessage = '❌ Error al generar el Excel.';
        this.modalLoading = false;
        this.showConfirmModal = true;
      }
    });
  }
}