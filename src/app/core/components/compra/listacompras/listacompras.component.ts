import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { 
  CompraResponse, 
  CompraRequest, 
  ProveedorResponse
} from '../../../../models/compra.interface';
import { ProductoResponse, PresentacionProdResponse } from '../../../../models/almacen.interface';
import { CompraService } from '../../../../services/compra.service';
import { ProveedorService } from '../../../../services/proveedor.service';
import { ProductoService } from '../../../../services/producto.service'; 
import { PresentacionProductoService } from '../../../../services/presproducto.service';

@Component({
  selector: 'app-listacompras',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './listacompras.component.html',
  styleUrl: './listacompras.component.scss',
  providers: [
    CompraService, 
    MessageService, 
    ProveedorService, 
    ProductoService,            
    PresentacionProductoService 
  ] 
})
export class ListaCompras implements OnInit {

  compraDialog: boolean = false;
  deleteCompraDialog: boolean = false;
  
  // Nuevo diálogo para Confirmar/Cancelar
  actionDialog: boolean = false;
  actionType: 'CONFIRMAR' | 'CANCELAR' = 'CONFIRMAR';

  compras: CompraResponse[] = [];
  compra!: CompraResponse;
  
  proveedores: ProveedorResponse[] = [];
  productos: ProductoResponse[] = [];             
  presentacionesFiltradas: PresentacionProdResponse[] = []; 

  form!: FormGroup;        
  detalleForm!: FormGroup; 
  detallesActuales: any[] = []; 

  totalRecords: number = 0;
  loading: boolean = true;
  rows: number = 10;
  rowsPerPageOptions = [5, 10, 20];

  constructor(
    private compraService: CompraService,
    private proveedorService: ProveedorService,
    private productoService: ProductoService,         
    private presentacionService: PresentacionProductoService, 
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadAuxiliarData();
  }

  initForms() {
    this.form = this.fb.group({
      idProveedor: [null, Validators.required],
      numeroComprobante: ['', Validators.required],
      descripcion: [''],
      estado: ['REGISTRADO'] 
    });

    this.detalleForm = this.fb.group({
      producto: [null, Validators.required], 
      presentacion: [null], 
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]]
    });
  }

  loadAuxiliarData() {
    this.proveedorService.listarTodas(0, 1000).subscribe({
      next: (data) => this.proveedores = data.content
    });

    this.productoService.listarTodas(0, 1000).subscribe({
      next: (data) => this.productos = data.content,
      error: (err) => console.error("Error cargando productos", err)
    });
  }

  loadCompras(event: any) {
    this.loading = true;
    const page = (event?.first ?? 0) / (event?.rows ?? 10);
    const size = event?.rows ?? 10;
    
    let sortStr = '';
    if (event && event.sortField) {
        sortStr = `${event.sortField},${event.sortOrder === 1 ? 'asc' : 'desc'}`;
    }
  
    this.compraService.listarTodas(page, size, sortStr).subscribe({
      next: (data) => {
        this.compras = data.content;
        this.totalRecords = data.totalElements;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false; 
      }
    });
  }

  onProductoChange(event: any) {
    const productoSeleccionado: ProductoResponse = event.value; 
    this.presentacionesFiltradas = [];
    this.detalleForm.patchValue({ presentacion: null });

    if (productoSeleccionado) {
        this.presentacionService.listarPorProducto(productoSeleccionado.id, 0, 100).subscribe({
            next: (data) => this.presentacionesFiltradas = data.content,
            error: (err) => console.error("Error cargando presentaciones", err)
        });

        this.detalleForm.patchValue({ 
            precioUnitario: productoSeleccionado.precioUnitarioVenta 
        });
    }
  }

  openNew() {
    this.compra = {} as CompraResponse;
    this.detallesActuales = []; 
    this.form.reset({ estado: 'REGISTRADO' });
    this.detalleForm.reset({ cantidad: 1, precioUnitario: 0 });
    this.compraDialog = true;
  }

  editCompra(compra: CompraResponse) {
    // Validar regla de negocio: Solo se actualizan compras REGISTRADAS
    if (compra.estado !== 'REGISTRADO') {
        this.messageService.add({severity:'warn', summary:'Acción no permitida', detail:'Solo se pueden editar compras en estado REGISTRADO'});
        return;
    }

    this.compra = { ...compra };
    
    // Mapeo inverso: Buscar el ID del proveedor basado en la Razón Social que llega del DTO
    const provEncontrado = this.proveedores.find(p => p.razonSocial === compra.proveedor);
    
    this.form.patchValue({
      numeroComprobante: compra.numeroComprobante,
      descripcion: compra.descripcion,
      estado: compra.estado,
      idProveedor: provEncontrado ? provEncontrado.id : null
    });

    this.detallesActuales = compra.detalles.map(d => ({
      idProducto: d.idProducto,
      nombreProducto: d.nombreProducto, 
      idPresentacion: d.idPresentacion,
      nombrePresentacion: d.nombrePresentacion,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      subtotal: d.subtotal
    }));

    this.compraDialog = true;
  }

  // --- NUEVAS ACCIONES DE ESTADO ---
  openConfirmar(compra: CompraResponse) {
      this.compra = { ...compra };
      this.actionType = 'CONFIRMAR';
      this.actionDialog = true;
  }

  openCancelar(compra: CompraResponse) {
      this.compra = { ...compra };
      this.actionType = 'CANCELAR';
      this.actionDialog = true;
  }

  confirmStateAction() {
      this.actionDialog = false;
      // ASUMIMOS que tienes estos métodos en tu compraService.
      // Si no, debes agregarlos: confirmar(id: number) y cancelar(id: number)
      const actionObs = this.actionType === 'CONFIRMAR' 
          ? this.compraService.confirmar(this.compra.id) 
          : this.compraService.cancelar(this.compra.id);

      actionObs.subscribe({
          next: () => {
              this.messageService.add({severity:'success', summary:'Éxito', detail:`Compra ${this.actionType.toLowerCase()}a correctamente`});
              this.loadCompras(null);
          },
          error: () => this.messageService.add({severity:'error', summary:'Error', detail:`Error al ${this.actionType.toLowerCase()} la compra`})
      });
  }
  // ---------------------------------

  agregarDetalle() {
    if (this.detalleForm.invalid) return;

    const val = this.detalleForm.value;
    const producto = val.producto; 
    const presentacion = val.presentacion; 

    const nuevoDetalle = {
      idProducto: producto.id,
      nombreProducto: producto.nombre, 
      idPresentacion: presentacion?.id || null,
      nombrePresentacion: presentacion?.nombre || '-', 
      cantidad: val.cantidad,
      precioUnitario: val.precioUnitario,
      subtotal: val.cantidad * val.precioUnitario
    };

    this.detallesActuales.push(nuevoDetalle);
    this.detalleForm.reset({ cantidad: 1, precioUnitario: 0 });
    this.presentacionesFiltradas = []; 
  }

  eliminarDetalle(index: number) {
    this.detallesActuales.splice(index, 1);
  }

  calcularTotalCompra(): number {
    return this.detallesActuales.reduce((acc, item) => acc + item.subtotal, 0);
  }

  saveCompra() {
    if (this.form.invalid) {
      this.messageService.add({severity:'warn', summary:'Datos incompletos', detail:'Complete los datos de la compra'});
      return;
    }
    if (this.detallesActuales.length === 0) {
      this.messageService.add({severity:'warn', summary:'Sin detalles', detail:'Agregue productos'});
      return;
    }

    const formVal = this.form.value;

    const request: CompraRequest = {
      descripcion: formVal.descripcion,
      numeroComprobante: formVal.numeroComprobante,
      estado: 'REGISTRADO', // Forzamos esto ya que el backend lo hace de todos modos
      idProveedor: formVal.idProveedor, 
      detalles: this.detallesActuales.map(d => ({
        idProducto: d.idProducto,
        idPresentacion: d.idPresentacion,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario
      }))
    };

    if (this.compra.id) {
      this.compraService.actualizar(this.compra.id, request).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Actualizado', detail:'Compra actualizada'});
          this.compraDialog = false;
          this.loadCompras(null);
        },
        error: (err) => this.messageService.add({severity:'error', summary:'Error', detail:'Error al actualizar'})
      });
    } else {
      this.compraService.crear(request).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Creado', detail:'Compra registrada'});
          this.compraDialog = false;
          this.loadCompras(null);
        },
        error: (err) => this.messageService.add({severity:'error', summary:'Error', detail:'Error al crear'})
      });
    }
  }

  deleteCompra(compra: CompraResponse) {
    this.deleteCompraDialog = true;
    this.compra = { ...compra };
  }

  confirmDelete() {
    this.deleteCompraDialog = false;
    this.compraService.eliminar(this.compra.id).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Eliminado', detail:'Compra eliminada'});
        this.loadCompras(null);
      },
      error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Error al eliminar'})
    });
  }
}