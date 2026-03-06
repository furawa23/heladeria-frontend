import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';

import { 
  VentaResponse, VentaRequest, MesaResponse, CobrarVentaRequest, PagoVentaRequest
} from '../../../../models/venta.interface';
import { ProductoResponse, PresentacionProdResponse } from '../../../../models/almacen.interface';
import { VentaService } from '../../../../services/venta.service';
import { MesaService } from '../../../../services/mesa.service';
import { ProductoService } from '../../../../services/producto.service'; 
import { PresentacionProductoService } from '../../../../services/presproducto.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-listaventas',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './listaventas.component.html',
  styleUrl: './listaventas.component.scss',
  providers: [VentaService, MesaService, ProductoService, PresentacionProductoService, MessageService]
})
export class ListaVentas implements OnInit {

  @ViewChild('dt') dt!: Table;

  // --- NUEVA BANDERA ---
  faltaSucursal: boolean = false;

  // --- FILTROS DE MESAS ---
  opcionesEstadoMesa = [
    { label: 'Todas las Mesas', value: 'TODAS' },
    { label: 'Libres', value: 'LIBRES' },
    { label: 'Ocupadas', value: 'OCUPADAS' }
  ];
  filtroEstadoMesa: string = 'TODAS';
  mesasFiltradas: MesaResponse[] = []; 

  // --- FILTROS DE VENTAS ---
  opcionesEstadoVenta = [
    { label: 'Todas las Ventas', value: 'TODAS' },
    { label: 'Creadas', value: 'CREADA' },
    { label: 'Pagadas', value: 'PAGADA' },
    { label: 'Canceladas', value: 'CANCELADA' }
  ];
  filtroEstadoVenta: string = 'TODAS';

  // Listas de datos
  ventas: VentaResponse[] = [];
  mesas: MesaResponse[] = [];
  productos: ProductoResponse[] = [];             
  presentacionesFiltradas: PresentacionProdResponse[] = []; 

  // Variables de Venta actual
  venta!: VentaResponse;
  mesaSeleccionada: MesaResponse | null = null;
  esVentaRapida: boolean = false;
  stockDisponible: number | null = null; // Control de stock visual

  // Diálogos
  ventaDialog: boolean = false;
  actionDialog: boolean = false;
  cobrarDialog: boolean = false; 
  actionType: 'CANCELAR' | 'ELIMINAR' = 'CANCELAR'; 

  // Formularios
  form!: FormGroup;        
  detalleForm!: FormGroup; 
  pagoForm!: FormGroup; 

  detallesActuales: any[] = []; 
  pagosActuales: PagoVentaRequest[] = []; 

  // Dropdown para métodos de pago
  metodosPago = [
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Tarjeta', value: 'TARJETA' },
    { label: 'Yape', value: 'YAPE' },
    { label: 'Plin', value: 'PLIN' }
  ];

  // Tabla Ventas
  totalRecords: number = 0;
  loadingVentas: boolean = true;
  rows: number = 10;

  constructor(
    private ventaService: VentaService,
    private mesaService: MesaService,
    private productoService: ProductoService,         
    private presentacionService: PresentacionProductoService, 
    private authService: AuthService, 
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    const sucursalTemporal = localStorage.getItem('sucursalActiva');

    if (!user?.idSucursal && !sucursalTemporal) {
      this.faltaSucursal = true;
      this.loadingVentas = false;
      return; 
    }

    this.initForms();
    this.loadMesas();
    this.loadProductos();
  }

  initForms() {
    this.form = this.fb.group({
      numeroComprobante: ['', Validators.required],
      estado: ['CREADA'] 
    });

    this.detalleForm = this.fb.group({
      producto: [null, Validators.required], 
      presentacion: [null], 
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });

    this.pagoForm = this.fb.group({
      metodoPago: ['EFECTIVO', Validators.required],
      monto: [null, [Validators.required, Validators.min(0.1)]]
    });
  }

  // ==========================================
  // LÓGICA DE MESAS
  // ==========================================
  loadMesas() {
    this.mesaService.listarTodas(0, 100, 'numero,asc').subscribe({
      next: (data) => {
        this.mesas = data.content;
        this.aplicarFiltroMesas(); 
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltroMesas() {
    if (this.filtroEstadoMesa === 'LIBRES') {
      this.mesasFiltradas = this.mesas.filter(m => m.libre);
    } else if (this.filtroEstadoMesa === 'OCUPADAS') {
      this.mesasFiltradas = this.mesas.filter(m => !m.libre);
    } else {
      this.mesasFiltradas = [...this.mesas];
    }
  }

  onFiltroMesaChange() {
    this.aplicarFiltroMesas();
  }

  clearFiltroMesa() {
    this.filtroEstadoMesa = 'TODAS';
    this.aplicarFiltroMesas();
  }

  refreshMesas() {
    this.loadMesas();
  }

  // ==========================================
  // LÓGICA DE VENTAS
  // ==========================================
  loadVentas(event: any) {
    this.loadingVentas = true;
    const page = (event?.first ?? 0) / (event?.rows ?? this.rows);
    const size = event?.rows ?? this.rows;
    
    let sortStr = '';
    if (event && event.sortField) {
        sortStr = `${event.sortField},${event.sortOrder === 1 ? 'asc' : 'desc'}`;
    }
  
    this.ventaService.listarTodas(page, size, sortStr).subscribe({
      next: (data) => {
        let resultados = data.content;
        
        if (this.filtroEstadoVenta !== 'TODAS') {
            resultados = resultados.filter((v: VentaResponse) => v.estado === this.filtroEstadoVenta);
        }

        this.ventas = resultados;
        this.totalRecords = this.filtroEstadoVenta !== 'TODAS' ? resultados.length : data.totalElements;
        this.loadingVentas = false;
        this.cdr.detectChanges();
      },
      error: () => this.loadingVentas = false
    });
  }

  onFiltroVentaChange() {
    this.refreshVentas();
  }

  clearFiltroVenta() {
    this.filtroEstadoVenta = 'TODAS';
    this.refreshVentas();
  }

  refreshVentas() {
    if (this.dt) {
      this.dt.reset();
    } else {
      this.loadVentas({ first: 0, rows: this.rows });
    }
  }

  loadProductos() {
    this.productoService.listarDisponiblesParaVenta().subscribe({
      next: (data) => {
        this.productos = data;
        this.cdr.detectChanges(); 
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Error', detail:'Error al cargar productos'});
        this.cdr.detectChanges(); 
      }
    });
  }

  onProductoChange(event: any) {
    const prod: ProductoResponse = event.value; 
    this.presentacionesFiltradas = [];
    this.detalleForm.patchValue({ presentacion: null, cantidad: 1 });

    if (prod) {
        this.presentacionService.listarPorProducto(prod.id, 0, 100).subscribe({
            next: (data) => this.presentacionesFiltradas = data.content
        });
        this.actualizarValidadorCantidad(prod, null);
    } else {
        this.stockDisponible = null;
        this.detalleForm.get('cantidad')?.clearValidators();
        this.detalleForm.get('cantidad')?.setValidators([Validators.required, Validators.min(1)]);
        this.detalleForm.get('cantidad')?.updateValueAndValidity();
    }
  }

  onPresentacionChange(event: any) {
    const pres = event.value;
    const prod = this.detalleForm.get('producto')?.value;
    this.actualizarValidadorCantidad(prod, pres);
  }

  actualizarValidadorCantidad(prod: ProductoResponse, pres: any) {
    if (!prod) return;

    let maxStockBase = prod.stock || 0; 
    let factor = pres ? pres.factor : 1;
    
    this.stockDisponible = Math.floor(maxStockBase / factor);

    const cantidadCtrl = this.detalleForm.get('cantidad');
    cantidadCtrl?.setValidators([
        Validators.required, 
        Validators.min(1), 
        Validators.max(this.stockDisponible) 
    ]);
    
    cantidadCtrl?.updateValueAndValidity(); 
  }

  agregarDetalle() {
    if (this.detalleForm.invalid) return;

    const val = this.detalleForm.value;
    const prod = val.producto; 
    const pres = val.presentacion; 

    const precioAplicar = pres ? pres.precioVenta : prod.precioUnitarioVenta;
    const cantidadARestar = val.cantidad * (pres ? pres.factor : 1);

    const nuevoDetalle = {
      idProducto: prod.id,
      nombreProducto: prod.nombre, 
      idPresentacion: pres?.id || null,
      nombrePresentacion: pres?.nombre || '-', 
      cantidad: val.cantidad,
      precioUnitario: precioAplicar,
      subtotal: val.cantidad * precioAplicar,
      cantidadRestadaMemoria: cantidadARestar // Guardamos esto por si lo elimina
    };

    this.detallesActuales.push(nuevoDetalle);
    
    // REDUCCIÓN EN MEMORIA
    if (prod) {
        prod.stock -= cantidadARestar;
    }

    this.detalleForm.reset({ cantidad: 1 });
    this.presentacionesFiltradas = []; 
    this.stockDisponible = null;
  }

  eliminarDetalle(index: number) {
    const detalle = this.detallesActuales[index];
    
    // Devolver el stock en memoria al producto original
    const prodOriginal = this.productos.find(p => p.id === detalle.idProducto);
    if (prodOriginal && detalle.cantidadRestadaMemoria) {
        prodOriginal.stock += detalle.cantidadRestadaMemoria;
    }

    this.detallesActuales.splice(index, 1);

    // Re-evaluar el validador por si el usuario está viendo el mismo producto
    const prodActualForm = this.detalleForm.get('producto')?.value;
    const presActualForm = this.detalleForm.get('presentacion')?.value;
    if (prodActualForm) {
        this.actualizarValidadorCantidad(prodActualForm, presActualForm);
    }
  }

  calcularTotalVenta(): number {
    return this.detallesActuales.reduce((acc, item) => acc + item.subtotal, 0);
  }

  // --- FLUJO DE CREACIÓN DE VENTAS ---
  openVentaRapida() {
    this.esVentaRapida = true;
    this.mesaSeleccionada = null;
    this.prepararFormularioVenta();
  }

  seleccionarMesa(mesa: MesaResponse) {
    if (!mesa.libre) {
      this.messageService.add({severity:'info', summary:'Mesa Ocupada', detail:'Gestione la venta desde la tabla inferior.'});
      return;
    }
    this.esVentaRapida = false;
    this.mesaSeleccionada = mesa;
    this.prepararFormularioVenta();
  }

  prepararFormularioVenta() {
    this.venta = {} as VentaResponse;
    this.detallesActuales = []; 
    this.form.reset({ estado: 'CREADA' });
    this.detalleForm.reset({ cantidad: 1 });
    this.ventaDialog = true;
    this.stockDisponible = null; // Reiniciar visual
  }

  editVenta(venta: VentaResponse) {
    if (venta.estado !== 'CREADA') {
        this.messageService.add({severity:'warn', summary:'Denegado', detail:'Solo puede editar ventas CREADAS'});
        return;
    }

    this.venta = { ...venta };
    this.esVentaRapida = venta.numeroMesa == null;
    this.mesaSeleccionada = null; 
    
    this.form.patchValue({
      numeroComprobante: venta.numeroComprobante,
      estado: venta.estado
    });

    this.detallesActuales = venta.detalles.map(d => ({
      ...d,
      nombrePresentacion: d.nombrePresentacion || '-',
      cantidadRestadaMemoria: 0 // Si edita, no afectamos en memoria lo que ya viene guardado
    }));

    this.stockDisponible = null;
    this.ventaDialog = true;
  }

  saveVenta() {
    if (this.form.invalid || this.detallesActuales.length === 0) {
      this.messageService.add({severity:'warn', summary:'Faltan datos', detail:'Complete el comprobante y agregue productos.'});
      return;
    }

    const request: VentaRequest = {
      numeroComprobante: this.form.value.numeroComprobante,
      estado: 'CREADA',
      total: this.calcularTotalVenta(),
      idMesa: this.mesaSeleccionada ? this.mesaSeleccionada.id : undefined,
      detalles: this.detallesActuales.map(d => ({
        idProducto: d.idProducto,
        idPresentacion: d.idPresentacion,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario
      }))
    };

    if (this.venta.id) {
      request.idMesa = this.venta.numeroMesa;
      this.ventaService.actualizar(this.venta.id, request).subscribe({
        next: () => this.finalizarGuardado('Venta actualizada'),
        error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Error al actualizar'})
      });
    } else {
      this.ventaService.crear(request).subscribe({
        next: () => {
          const mensaje = this.esVentaRapida 
            ? 'Venta Rápida registrada' 
            : `Venta en Mesa ${this.mesaSeleccionada?.numero} registrada`;
          this.finalizarGuardado(mensaje);
        },
        error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Error al crear la venta'})
      });
    }
  }

  finalizarGuardado(mensaje: string) {
    this.messageService.add({severity:'success', summary:'Éxito', detail: mensaje});
    this.ventaDialog = false;
    this.loadVentas(null);
    this.loadMesas(); 
    this.loadProductos(); // Recargar productos para restaurar el stock real de BD
  }

  // --- NUEVA LÓGICA DE COBROS ---

  openCobrarDialog(venta: VentaResponse) {
    this.venta = { ...venta };
    this.pagosActuales = [];
    
    this.pagoForm.reset({ metodoPago: 'EFECTIVO', monto: venta.total });
    this.cobrarDialog = true;
  }

  agregarPago() {
    if (this.pagoForm.invalid) return;
    const pago = this.pagoForm.value;
    
    if (this.totalPagado + pago.monto > this.venta.total + 0.01) {
        this.messageService.add({severity:'warn', summary:'Exceso', detail:'El monto supera el total de la venta'});
        return;
    }

    this.pagosActuales.push({ metodoPago: pago.metodoPago, monto: pago.monto });
    
    const restante = this.montoRestante;
    if (restante > 0) {
        this.pagoForm.reset({ metodoPago: 'EFECTIVO', monto: restante });
    } else {
        this.pagoForm.reset({ metodoPago: 'EFECTIVO', monto: 0 });
    }
  }

  eliminarPago(index: number) {
    this.pagosActuales.splice(index, 1);
    this.pagoForm.patchValue({ monto: this.montoRestante });
  }

  get totalPagado(): number {
    return this.pagosActuales.reduce((sum, p) => sum + p.monto, 0);
  }

  get montoRestante(): number {
    if (!this.venta || !this.venta.total) {
        return 0;
    }
    const restante = this.venta.total - this.totalPagado;
    return restante > 0 ? restante : 0;
  }

  ejecutarCobro() {
    if (Math.abs(this.totalPagado - this.venta.total) > 0.01) {
        this.messageService.add({severity:'error', summary:'Error de Cuadre', detail:`Los pagos no coinciden con el total (S/ ${this.venta.total})`});
        return;
    }

    const payload: CobrarVentaRequest = {
        pagos: this.pagosActuales 
    };

    this.ventaService.cobrar(this.venta.id, payload).subscribe({
        next: () => {
            this.messageService.add({severity:'success', summary:'Cobrado', detail:'Venta cobrada e ingresada a caja con éxito'});
            this.cobrarDialog = false;
            this.loadVentas(null);
            this.loadMesas();
        },
        error: (err) => {
            this.messageService.add({severity:'error', summary:'Error', detail: err.error?.message || 'No se pudo cobrar la venta'});
        }
    });
  }

  // --- ACCIONES SECUNDARIAS (Cancelar / Eliminar) ---

  openActionDialog(venta: VentaResponse, accion: 'CANCELAR' | 'ELIMINAR') {
    this.venta = { ...venta };
    this.actionType = accion;
    this.actionDialog = true;
  }

  confirmAction() {
    this.actionDialog = false;
    
    let obs$;
    if (this.actionType === 'CANCELAR') obs$ = this.ventaService.cancelar(this.venta.id);
    else obs$ = this.ventaService.eliminar(this.venta.id);

    obs$.subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Procesado', detail:`Venta ${this.actionType.toLowerCase()}a con éxito`});
        this.loadVentas(null);
        this.loadMesas(); 
        this.loadProductos(); // Recargar productos para restaurar stock en la vista
      },
      error: () => this.messageService.add({severity:'error', summary:'Error', detail:`Fallo al ${this.actionType.toLowerCase()}`})
    });
  }
}