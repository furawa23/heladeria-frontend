import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { 
  VentaResponse, VentaRequest, MesaResponse, CobrarVentaRequest, PagoVentaRequest
} from '../../../../models/venta.interface';
import { ProductoResponse, PresentacionProdResponse } from '../../../../models/almacen.interface';
import { VentaService } from '../../../../services/venta.service';
import { MesaService } from '../../../../services/mesa.service';
import { ProductoService } from '../../../../services/producto.service'; 
import { PresentacionProductoService } from '../../../../services/presproducto.service';

@Component({
  selector: 'app-listaventas',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './listaventas.component.html',
  styleUrl: './listaventas.component.scss',
  providers: [VentaService, MesaService, ProductoService, PresentacionProductoService, MessageService]
})
export class ListaVentas implements OnInit {

  // Listas de datos
  ventas: VentaResponse[] = [];
  mesas: MesaResponse[] = [];
  productos: ProductoResponse[] = [];             
  presentacionesFiltradas: PresentacionProdResponse[] = []; 

  // Variables de Venta actual
  venta!: VentaResponse;
  mesaSeleccionada: MesaResponse | null = null;
  esVentaRapida: boolean = false;

  // Diálogos
  ventaDialog: boolean = false;
  actionDialog: boolean = false;
  cobrarDialog: boolean = false; // NUEVO: Dialogo exclusivo para cobrar
  actionType: 'CANCELAR' | 'ELIMINAR' = 'CANCELAR'; // COBRAR ya no está aquí

  // Formularios
  form!: FormGroup;        
  detalleForm!: FormGroup; 
  pagoForm!: FormGroup; // NUEVO: Formulario para registrar los pagos

  detallesActuales: any[] = []; 
  pagosActuales: PagoVentaRequest[] = []; // NUEVO: Lista de pagos para la venta

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
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
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

    // Inicializamos el formulario de pagos
    this.pagoForm = this.fb.group({
      metodoPago: ['EFECTIVO', Validators.required],
      monto: [null, [Validators.required, Validators.min(0.1)]]
    });
  }

  loadMesas() {
    this.mesaService.listarTodas(0, 100, 'numero,asc').subscribe({
      next: (data) => {
        this.mesas = data.content;
        this.cdr.detectChanges();
      }
    });
  }

  loadProductos() {
    this.productoService.listarDisponiblesParaVenta().subscribe({
      next: (data) => {
        this.productos = data;
        this.cdr.detectChanges(); // <-- AÑADIR ESTO
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Error', detail:'Error al cargar productos'});
        this.cdr.detectChanges(); // <-- AÑADIR ESTO
      }
    });
  }

  loadVentas(event: any) {
    this.loadingVentas = true;
    const page = (event?.first ?? 0) / (event?.rows ?? 10);
    const size = event?.rows ?? 10;
    
    let sortStr = '';
    if (event && event.sortField) {
        sortStr = `${event.sortField},${event.sortOrder === 1 ? 'asc' : 'desc'}`;
    }
  
    this.ventaService.listarTodas(page, size, sortStr).subscribe({
      next: (data) => {
        this.ventas = data.content;
        this.totalRecords = data.totalElements;
        this.loadingVentas = false;
        this.cdr.detectChanges();
      },
      error: () => this.loadingVentas = false
    });
  }

  onProductoChange(event: any) {
    const prod: ProductoResponse = event.value; 
    this.presentacionesFiltradas = [];
    this.detalleForm.patchValue({ presentacion: null });

    if (prod) {
        this.presentacionService.listarPorProducto(prod.id, 0, 100).subscribe({
            next: (data) => this.presentacionesFiltradas = data.content
        });
    }
  }

  agregarDetalle() {
    if (this.detalleForm.invalid) return;

    const val = this.detalleForm.value;
    const prod = val.producto; 
    const pres = val.presentacion; 

    const precioAplicar = pres ? pres.precioVenta : prod.precioUnitarioVenta;

    const nuevoDetalle = {
      idProducto: prod.id,
      nombreProducto: prod.nombre, 
      idPresentacion: pres?.id || null,
      nombrePresentacion: pres?.nombre || '-', 
      cantidad: val.cantidad,
      precioUnitario: precioAplicar,
      subtotal: val.cantidad * precioAplicar
    };

    this.detallesActuales.push(nuevoDetalle);
    this.detalleForm.reset({ cantidad: 1 });
    this.presentacionesFiltradas = []; 
  }

  eliminarDetalle(index: number) {
    this.detallesActuales.splice(index, 1);
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
      nombrePresentacion: d.nombrePresentacion || '-'
    }));

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
  }

  // --- NUEVA LÓGICA DE COBROS ---

  openCobrarDialog(venta: VentaResponse) {
    this.venta = { ...venta };
    this.pagosActuales = [];
    
    // Autocompletamos por defecto con EFECTIVO por el total de la venta
    this.pagoForm.reset({ metodoPago: 'EFECTIVO', monto: venta.total });
    this.cobrarDialog = true;
  }

  agregarPago() {
    if (this.pagoForm.invalid) return;
    const pago = this.pagoForm.value;
    
    // Verificamos no pasarnos del total
    if (this.totalPagado + pago.monto > this.venta.total + 0.01) {
        this.messageService.add({severity:'warn', summary:'Exceso', detail:'El monto supera el total de la venta'});
        return;
    }

    this.pagosActuales.push({ metodoPago: pago.metodoPago, monto: pago.monto });
    
    // Preparar el form para el monto restante si aplica
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
    // 1. Agregamos esta validación de seguridad
    if (!this.venta || !this.venta.total) {
        return 0;
    }

    // 2. El cálculo normal
    const restante = this.venta.total - this.totalPagado;
    return restante > 0 ? restante : 0;
  }

  ejecutarCobro() {
    // Tolerancia por decimales flotantes
    if (Math.abs(this.totalPagado - this.venta.total) > 0.01) {
        this.messageService.add({severity:'error', summary:'Error de Cuadre', detail:`Los pagos no coinciden con el total (S/ ${this.venta.total})`});
        return;
    }

    const payload: CobrarVentaRequest = {
        pagos: this.pagosActuales // Basado en la propiedad "pago" de tu interface
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
      },
      error: () => this.messageService.add({severity:'error', summary:'Error', detail:`Fallo al ${this.actionType.toLowerCase()}`})
    });
  }
}