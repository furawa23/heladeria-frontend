import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SharedModule } from '../../../shared/shared.module';

// Services
import { CajaService } from '../../../services/caja.service';
import { MovimientoCajaService } from '../../../services/movimientocaja.service';
import { AuthService } from '../../../services/auth.service';

// Interfaces
import { CajaResponse, CajaRequest, MovimientoCajaResponse, MovimientoCajaRequest } from '../../../models/caja.interface';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.scss'],
  providers: [MessageService, CajaService, MovimientoCajaService]
})
export class CajaComponent implements OnInit {

  faltaSucursal: boolean = false;

  // --- UI Flags & Dialogs ---
  aperturaDialog: boolean = false;
  movimientoDialog: boolean = false;
  confirmCierreDialog: boolean = false;
  submittedApertura: boolean = false;
  submittedMovimiento: boolean = false;
  loading: boolean = true;

  // --- Data Sources ---
  cajas: CajaResponse[] = [];
  cajaAbierta: CajaResponse | null = null;
  
  // --- Dashboard de Caja Abierta ---
  movimientosCajaAbiertaOriginal: MovimientoCajaResponse[] = [];
  movimientosCajaAbierta: MovimientoCajaResponse[] = [];
  
  // Totales para las tarjetas
  totalIngresosActivos: number = 0;
  totalEgresosActivos: number = 0;
  
  // --- Row Expansion (Movimientos Históricos) ---
  movimientosCache: { [idCaja: number]: MovimientoCajaResponse[] } = {};

  // --- Filtros ---
  opcionesFiltroMov = [
    { label: 'Todos los Movimientos', value: 'TODOS' },
    { label: 'Solo Ingresos', value: 'INGRESO' },
    { label: 'Solo Egresos', value: 'EGRESO' }
  ];
  filtroMovActual: string = 'TODOS';

  // --- Dropdowns ---
  tiposMovimiento = [
    { label: 'Ingreso', value: 'INGRESO' },
    { label: 'Egreso', value: 'EGRESO' }
  ];
  metodosPago = [
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Tarjeta', value: 'TARJETA' },
    { label: 'Yape', value: 'YAPE' },
    { label: 'Plin', value: 'PLIN' }
  ];

  // --- Paginación ---
  totalRecords: number = 0;
  rows: number = 10;
  rowsPerPageOptions = [5, 10, 20];

  // --- Formularios ---
  formApertura!: FormGroup;
  formMovimiento!: FormGroup;

  constructor(
    private cajaService: CajaService,
    private movimientoService: MovimientoCajaService,
    private authService: AuthService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    const sucursalTemporal = localStorage.getItem('sucursalActiva');

    if (!user?.idSucursal && !sucursalTemporal) {
      this.faltaSucursal = true;
      this.loading = false;
      return; 
    }

    this.initForms();
    this.verificarCajaAbierta();
  }

  initForms() {
    this.formApertura = this.fb.group({
      montoInicial: [0, [Validators.required, Validators.min(0)]]
    });

    this.formMovimiento = this.fb.group({
      tipo: ['INGRESO', Validators.required],
      monto: [null, [Validators.required, Validators.min(0.1)]],
      metodoPago: ['EFECTIVO', Validators.required]
    });
  }

  // ==========================================================
  // ESTADO DE CAJA Y CARGA DE DATOS
  // ==========================================================

  verificarCajaAbierta() {
    this.cajaService.obtenerCajaAbierta().subscribe({
      next: (caja) => {
        this.cajaAbierta = caja || null;
        if (this.cajaAbierta) {
            this.cargarMovimientosActivos();
        }
      },
      error: () => {
        this.cajaAbierta = null;
      }
    });
  }

  loadCajas(event: any) {
    this.loading = true;
    const page = (event?.first ?? 0) / (event?.rows ?? 10);
    const size = event?.rows ?? 10;
    
    let sortStr = 'id,desc'; 
    if (event?.sortField) {
      const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
      sortStr = `${event.sortField},${sortOrder}`;
    }

    this.cajaService.listarTodas(page, size, sortStr).subscribe({
      next: (data) => {
        this.cajas = data.content;
        this.totalRecords = data.totalElements;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cajas' });
        console.error(err);
      }
    });
  }

  refreshTable() {
    this.movimientosCache = {}; 
    this.loadCajas({ first: 0, rows: this.rows });
    this.verificarCajaAbierta();
  }

  // ==========================================================
  // LÓGICA DE MOVIMIENTOS CAJA ACTIVA (DASHBOARD)
  // ==========================================================

  cargarMovimientosActivos() {
    if (!this.cajaAbierta) return;
    
    this.movimientoService.listarPorCaja(this.cajaAbierta.id, 0, 1000, 'id,desc').subscribe({
      next: (resp) => {
        this.movimientosCajaAbiertaOriginal = resp.content;
        this.aplicarFiltroMovimientos();
      },
      error: (err) => console.error('Error cargando movimientos de caja activa', err)
    });
  }

  onFiltroMovChange() {
      this.aplicarFiltroMovimientos();
  }

  aplicarFiltroMovimientos() {
      // 1. Filtrar para la tabla
      if (this.filtroMovActual === 'TODOS') {
          this.movimientosCajaAbierta = [...this.movimientosCajaAbiertaOriginal];
      } else {
          this.movimientosCajaAbierta = this.movimientosCajaAbiertaOriginal.filter(
              mov => mov.tipo === this.filtroMovActual
          );
      }

      // 2. Calcular totales globales de la caja para las tarjetas
      this.totalIngresosActivos = this.movimientosCajaAbiertaOriginal
          .filter(m => m.tipo === 'INGRESO')
          .reduce((acc, curr) => acc + curr.monto, 0);

      this.totalEgresosActivos = this.movimientosCajaAbiertaOriginal
          .filter(m => m.tipo === 'EGRESO')
          .reduce((acc, curr) => acc + curr.monto, 0);

      this.cdr.detectChanges();
  }

  // ==========================================================
  // EXPANSIÓN DE FILA (MOVIMIENTOS HISTÓRICOS)
  // ==========================================================

  onRowExpand(event: any) {
    const idCaja = event.data.id;
    if (!this.movimientosCache[idCaja]) {
      this.movimientoService.listarPorCaja(idCaja, 0, 100, 'id,desc').subscribe({
        next: (resp) => {
          this.movimientosCache = { ...this.movimientosCache, [idCaja]: resp.content };
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  // ==========================================================
  // ACCIONES DE CAJA
  // ==========================================================

  openApertura() {
    this.submittedApertura = false;
    this.formApertura.reset({ montoInicial: 0 });
    this.aperturaDialog = true;
  }

  guardarApertura() {
    this.submittedApertura = true;
    if (this.formApertura.invalid) return;

    const req: CajaRequest = { montoInicial: this.formApertura.value.montoInicial };

    this.cajaService.abrirCaja(req).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Caja abierta correctamente' });
        this.aperturaDialog = false;
        this.refreshTable();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo abrir la caja' });
      }
    });
  }

  confirmarCierre() {
    this.confirmCierreDialog = true;
  }

  ejecutarCierre() {
    if (!this.cajaAbierta) return;
    
    this.cajaService.cerrarCaja(this.cajaAbierta.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Caja cerrada correctamente' });
        this.confirmCierreDialog = false;
        this.cajaAbierta = null; 
        this.refreshTable();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo cerrar la caja' });
      }
    });
  }

  // ==========================================================
  // ACCIONES DE MOVIMIENTO
  // ==========================================================

  openMovimiento() {
    this.submittedMovimiento = false;
    this.formMovimiento.reset({ tipo: 'INGRESO', metodoPago: 'EFECTIVO', monto: null });
    this.movimientoDialog = true;
  }

  guardarMovimiento() {
    this.submittedMovimiento = true;
    if (this.formMovimiento.invalid) return;

    const vals = this.formMovimiento.value;
    const req: MovimientoCajaRequest = {
      tipo: vals.tipo,
      monto: vals.monto,
      metodoPago: vals.metodoPago,
      idVenta: 0, 
      idCompra: 0
    };

    this.movimientoService.registrarMovimiento(req).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Movimiento registrado' });
        this.movimientoDialog = false;
        
        // Recargar los movimientos de la caja activa
        this.cargarMovimientosActivos();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo registrar el movimiento' });
      }
    });
  }
}