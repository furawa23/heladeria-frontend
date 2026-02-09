import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';

// IMPORTA TUS INTERFACES
import { 
  CompraResponse, 
  CompraRequest, 
  ProveedorResponse,
  ProductoResponse,       
  PresentacionProdResponse 
} from '../../../../models/models.interface';

// IMPORTA TUS SERVICIOS
import { CompraService } from '../../../../services/compra.service';
import { ProveedorService } from '../../../../services/proveedor.service';
import { ProductoService } from '../../../../services/producto.service'; 
import { PresentacionProductoService } from '../../../../services/presproducto.service'; // Asegúrate de que el nombre del archivo coincida

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

  // ... (Diálogos, variables, etc. igual que antes)
  compraDialog: boolean = false;
  deleteCompraDialog: boolean = false;
  compras: CompraResponse[] = [];
  compra!: CompraResponse;
  
  // Datos Auxiliares
  proveedores: ProveedorResponse[] = [];
  productos: ProductoResponse[] = [];             
  // Ya no necesitamos 'presentaciones: any[] = []' global
  presentacionesFiltradas: PresentacionProdResponse[] = []; 

  // Forms
  form!: FormGroup;        
  detalleForm!: FormGroup; 
  detallesActuales: any[] = []; 

  // Paginación
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
    // 1. Cargar Proveedores
    this.proveedorService.listarTodas(0, 1000).subscribe({
      next: (data) => this.proveedores = data.content
    });

    // 2. Cargar Productos
    this.productoService.listarTodas(0, 1000).subscribe({
      next: (data) => {
        this.productos = data.content; 
      },
      error: (err) => console.error("Error cargando productos", err)
    });
    
    // ¡¡Asegúrate de NO tener nada más aquí abajo llamando a presentacionService!!
  }

  // Carga de Compras (Lazy Load)
  loadCompras(event: any) {
    this.loading = true;
  
    // 1. Uso de operador seguro (?.) para evitar error si event es null
    const page = (event?.first ?? 0) / (event?.rows ?? 10);
    const size = event?.rows ?? 10;
    
    // 2. Validación crítica: Verificar si event existe antes de leer sortField
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
        this.loading = false; // Importante: quitar el loading si falla
      }
    });
  }

  // --- LÓGICA IMPORTANTE AQUÍ ---
  onProductoChange(event: any) {
    const productoSeleccionado: ProductoResponse = event.value; 
    
    // Limpiamos presentaciones anteriores siempre que cambia el producto
    this.presentacionesFiltradas = [];
    this.detalleForm.patchValue({ presentacion: null });

    if (productoSeleccionado) {
        // 1. Llamar al servicio para buscar las presentaciones de ESTE producto
        // Pedimos una página grande (100) para traer todas las presentaciones de ese producto
        this.presentacionService.listarPorProducto(productoSeleccionado.id, 0, 100).subscribe({
            next: (data) => {
                this.presentacionesFiltradas = data.content;
            },
            error: (err) => {
                console.error("Error cargando presentaciones", err);
            }
        });

        // 2. Sugerir precio base
        this.detalleForm.patchValue({ 
            precioUnitario: productoSeleccionado.precioUnitarioVenta 
        });
    }
  }

  // --- RESTO DEL CÓDIGO (Igual que antes) ---

  openNew() {
    this.compra = {} as CompraResponse;
    this.detallesActuales = []; 
    this.form.reset({ estado: 'REGISTRADO' });
    this.detalleForm.reset({ cantidad: 1, precioUnitario: 0 });
    this.compraDialog = true;
  }

  editCompra(compra: CompraResponse) {
    this.compra = { ...compra };
    
    // Aquí hay un pequeño reto: al editar, necesitamos cargar las presentaciones
    // del producto de cada detalle si quisiéramos editar la línea, 
    // pero como tu formulario de "Agregar Item" empieza vacío, no es crítico.
    
    this.form.patchValue({
      numeroComprobante: compra.numeroComprobante,
      descripcion: compra.descripcion,
      estado: compra.estado,
      // Si tu backend enviara el idProveedor sería: idProveedor: compra.idProveedor
      // Si no lo envía, el dropdown de proveedor aparecerá vacío o con el ID seleccionado si coincide el value.
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

  agregarDetalle() {
    if (this.detalleForm.invalid) return;

    const val = this.detalleForm.value;
    const producto = val.producto; 
    const presentacion = val.presentacion; 

    const nuevoDetalle = {
      idProducto: producto.id,
      nombreProducto: producto.nombre, 
      idPresentacion: presentacion?.id || null,
      nombrePresentacion: presentacion?.nombre || '-', // Si es null, mostramos guión
      cantidad: val.cantidad,
      precioUnitario: val.precioUnitario,
      subtotal: val.cantidad * val.precioUnitario
    };

    this.detallesActuales.push(nuevoDetalle);
    this.detalleForm.reset({ cantidad: 1, precioUnitario: 0 });
    this.presentacionesFiltradas = []; // Limpiar dropdown de presentaciones opcionalmente
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
      estado: formVal.estado,
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