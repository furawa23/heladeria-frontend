import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { 
  VentaResponse, VentaRequest, MesaResponse} from '../../../../models/venta.interface';
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
  actionType: 'COBRAR' | 'CANCELAR' | 'ELIMINAR' = 'COBRAR';

  // Formularios
  form!: FormGroup;        
  detalleForm!: FormGroup; 
  detallesActuales: any[] = []; 

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
  }

  loadMesas() {
    this.mesaService.listarTodas(0, 100, 'numero,asc').subscribe({
      next: (data) => this.mesas = data.content
    });
  }

  loadProductos() {
    this.productoService.listarDisponiblesParaVenta().subscribe({
      next: (data) => this.productos = data,
      error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Error al cargar productos disponibles para venta'})
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
      // ACTUALIZAR
      request.idMesa = this.venta.numeroMesa;
      this.ventaService.actualizar(this.venta.id, request).subscribe({
        next: () => this.finalizarGuardado('Venta actualizada'),
        error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Error al actualizar'})
      });
    } else {
      // CREAR - Unificada: enviamos al backend y este lo evalúa
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

  // --- ACCIONES RÁPIDAS ---

  openActionDialog(venta: VentaResponse, accion: 'COBRAR' | 'CANCELAR' | 'ELIMINAR') {
    this.venta = { ...venta };
    this.actionType = accion;
    this.actionDialog = true;
  }

  confirmAction() {
    this.actionDialog = false;
    
    let obs$;
    if (this.actionType === 'COBRAR') obs$ = this.ventaService.cobrar(this.venta.id);
    else if (this.actionType === 'CANCELAR') obs$ = this.ventaService.cancelar(this.venta.id);
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