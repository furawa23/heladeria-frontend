import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
// Asegúrate de que SharedModule exporta los módulos de PrimeNG (TableModule, DialogModule, etc.)
import { SharedModule } from '../../../../shared/shared.module'; 

// Services
import { ProductoService } from '../../../../services/producto.service';
import { StockProductoService } from '../../../../services/stockproducto.service';
import { CategoriaProductoService } from '../../../../services/catproducto.service';

// Interfaces
import { 
  ProductoResponse, 
  ProductoRequest, 
  StockProdResponse, 
  RecetaItemRequest,
  CategoriaProdResponse, 
  PresentacionProdResponse,
  PresentacionProdRequest
} from '../../../../models/models.interface';
import { PresentacionProductoService } from '../../../../services/presproducto.service';

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './listaproductos.component.html',
  styleUrl: './listaproductos.component.scss',
  providers: [MessageService, ProductoService, StockProductoService, CategoriaProductoService]
})
export class ListaProductos implements OnInit {

  // --- UI Flags & Dialogs ---
  productoDialog: boolean = false;
  deleteProductoDialog: boolean = false;
  saveConfirmDialog: boolean = false;
  submitted: boolean = false;
  loading: boolean = true;

  // --- Data Sources ---
  productos: ProductoResponse[] = [];
  producto!: ProductoResponse; // Producto seleccionado para acciones
  
  // Listas auxiliares para Dropdowns
  categorias: CategoriaProdResponse[] = [];
  insumosDisponibles: ProductoResponse[] = [];

  // --- VARIABLES PARA PRESENTACIONES ---
  presentacionesDialog: boolean = false;
  listaPresentaciones: PresentacionProdResponse[] = [];
  productoSeseleccionadoParaPresentacion!: ProductoResponse;

  // --- Paginación ---
  totalRecords: number = 0;
  rows: number = 10;
  rowsPerPageOptions = [5, 10, 20];

  // --- Row Expansion (Stock) ---
  // Cache para evitar llamadas repetidas al API al abrir/cerrar la misma fila
  stockCache: { [idProducto: number]: StockProdResponse[] } = {}; 
  expandedRowKeys: { [key: string]: boolean } = {};

  // --- Formulario ---
  form!: FormGroup;
  formPresentacion!: FormGroup;

  constructor(
    private productoService: ProductoService,
    private stockService: StockProductoService,
    private categoriaService: CategoriaProductoService,
    private presentacionService: PresentacionProductoService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarDatosAuxiliares();
    this.formPresentacion = this.fb.group({
      nombre: ['', Validators.required],
      factor: [1, [Validators.required, Validators.min(1)]] // Factor de conversión
    });
  }

  // ==========================================================
  // 1. CARGA INICIAL Y AUXILIARES
  // ==========================================================

  cargarDatosAuxiliares() {
    // 1. Cargar Categorías para el dropdown del formulario
    this.categoriaService.listarTodas(0, 100).subscribe({
      next: (resp) => this.categorias = resp.content,
      error: (err) => console.error('Error cargando categorías', err)
    });

    // 2. Cargar Insumos para el autocompletado/dropdown de la receta
    this.productoService.listarInsumos(0, 100).subscribe({
      next: (resp) => this.insumosDisponibles = resp.content,
      error: (err) => console.error('Error cargando insumos', err)
    });
  }

  loadProductos(event: any) {
    this.loading = true;
    const page = (event?.first ?? 0) / (event?.rows ?? 10);
    const size = event?.rows ?? 10;
    
    // Mapeo de sortField de PrimeNG a Spring Boot
    let sortStr = '';
    if (event.sortField) {
      const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
      sortStr = `${event.sortField},${sortOrder}`;
    }

    this.productoService.listarTodas(page, size, sortStr).subscribe({
      next: (data) => {
        this.productos = data.content;
        this.totalRecords = data.totalElements;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
      }
    });
  }

  // ==========================================================
  // 2. LOGICA DEL FORMULARIO REACTIVO
  // ==========================================================
  
  initForm() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      unidadBase: ['UNIDAD', Validators.required],
      idCategoria: [null, Validators.required], // Dropdown bindeará al ID
      seVende: [false],
      precioUnitarioVenta: [0],
      receta: this.fb.array([]) // Array dinámico
    });

    // Suscripción para validaciones dinámicas:
    // Si 'seVende' es true, el precio es obligatorio.
    this.form.get('seVende')?.valueChanges.subscribe(seVende => {
      const precioControl = this.form.get('precioUnitarioVenta');
      if (seVende) {
        precioControl?.setValidators([Validators.required, Validators.min(0.1)]);
      } else {
        precioControl?.clearValidators();
        precioControl?.setValue(0);
      }
      precioControl?.updateValueAndValidity();
    });
  }

  get recetaArray(): FormArray {
    return this.form.get('receta') as FormArray;
  }

  addRecetaItem(idInsumo: number | null = null, cantidad: number = 0) {
    const itemGroup = this.fb.group({
      insumoId: [idInsumo, Validators.required],
      cantidadUsada: [cantidad, [Validators.required, Validators.min(0.0001)]]
    });
    this.recetaArray.push(itemGroup);
  }

  removeRecetaItem(index: number) {
    this.recetaArray.removeAt(index);
  }

  // ==========================================================
  // 3. LOGICA DE EXPANSIÓN (STOCK)
  // ==========================================================

  onRowExpand(event: any) {
    const prodId = event.data.id;
    
    // Solo cargamos si no está en caché
    if (!this.stockCache[prodId]) {
      this.stockService.listarPorProducto(prodId, 0, 50).subscribe({
        next: (resp) => {
          this.stockCache[prodId] = resp.content;
        },
        error: (err) => console.error(err)
      });
    }
  }

  refreshTable() {
    this.stockCache = {}; // Limpiamos caché por si hubo movimientos
    this.loadProductos({ first: 0, rows: this.rows });
  }

  // ==========================================================
  // 4. ABM (ALTA, BAJA, MODIFICACIÓN)
  // ==========================================================

  openNew() {
    this.producto = {} as ProductoResponse;
    this.submitted = false;
    this.productoDialog = true;
    
    // Resetear form
    this.form.reset({
      unidadBase: 'UNIDAD',
      seVende: false,
      precioUnitarioVenta: 0
    });
    this.recetaArray.clear();
    this.cdr.detectChanges();
  }

  editProducto(prod: ProductoResponse) {
    this.producto = { ...prod };
    this.productoDialog = true;

    // Lógica para encontrar el ID de la categoría basado en el nombre
    // Ya que ProductoResponse trae "categoria": "Helados" (string)
    const categoriaEncontrada = this.categorias.find(c => c.nombre === prod.categoria);
    const idCategoriaVal = categoriaEncontrada ? categoriaEncontrada.id : null;

    this.form.patchValue({
      nombre: prod.nombre,
      unidadBase: prod.unidadBase,
      idCategoria: idCategoriaVal, 
      seVende: prod.seVende,
      precioUnitarioVenta: prod.precioUnitarioVenta
    });

    // Poblar Receta
    this.recetaArray.clear();
    if (prod.receta && prod.receta.length > 0) {
      prod.receta.forEach(item => {
        this.addRecetaItem(item.idInsumo, item.cantidadUsada);
      });
    }

    this.cdr.detectChanges();
  }

// ==========================================================
  // LOGICA DE PRESENTACIONES
  // ==========================================================

  openPresentaciones(prod: ProductoResponse) {
    this.productoSeseleccionadoParaPresentacion = prod;
    this.presentacionesDialog = true;
    this.cargarPresentaciones(prod.id);
    
    // 1. Resetear el formulario primero
    this.formPresentacion.reset({
      nombre: '',
      factor: 1,
      precioVenta: null // Empezamos en null
    });

    // 2. Obtener el control del precio
    const precioControl = this.formPresentacion.get('precioVenta');

    // 3. Validación Condicional
    if (prod.seVende) {
      // Si el producto padre se vende, la presentación TAMBIÉN necesita precio
      precioControl?.setValidators([Validators.required, Validators.min(0.1)]);
    } else {
      // Si es un insumo, no lleva precio de venta
      precioControl?.clearValidators();
      precioControl?.setValue(0); // Opcional: setear a 0 o null
    }
    
    // 4. Actualizar el estado del control para que Angular sepa si es válido o no
    precioControl?.updateValueAndValidity();
  }

  cargarPresentaciones(idProducto: number) {
    this.presentacionService.listarPorProducto(idProducto, 0, 100).subscribe({
      next: (resp) => {
        this.listaPresentaciones = resp.content;
      },
      error: (err) => console.error(err)
    });
  }

  agregarPresentacion() {
    if (this.formPresentacion.invalid) return;

    const formVal = this.formPresentacion.value;

    const nuevaPresentacion: PresentacionProdRequest = {
      nombre: formVal.nombre,
      factor: formVal.factor,
      precioVenta: formVal.precioVenta,
      idProducto: this.productoSeseleccionadoParaPresentacion.id
    };

    this.presentacionService.crear(nuevaPresentacion).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Agregado', detail:'Presentación agregada'});
        // Recargar la lista interna del modal
        this.cargarPresentaciones(this.productoSeseleccionadoParaPresentacion.id); 
        // Resetear solo los inputs
        this.formPresentacion.reset({ nombre: '', factor: 1 });
      },
      error: () => this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo agregar'})
    });
  }

  borrarPresentacion(pres: PresentacionProdResponse) {
    // Podrías poner un confirmDialog aquí si quieres
    this.presentacionService.eliminar(pres.id).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Eliminado', detail:'Presentación eliminada'});
        this.cargarPresentaciones(this.productoSeseleccionadoParaPresentacion.id);
      },
      error: () => this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo eliminar'})
    });
  }

  saveProducto() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }
    
    this.saveConfirmDialog = true;
  }

  confirmSave() {
    this.saveConfirmDialog = false;

    // Preparar DTO
    const formVal = this.form.value;
    
    const recetaRequest: RecetaItemRequest[] = formVal.receta.map((item: any) => ({
      insumoId: item.insumoId,
      cantidadUsada: item.cantidadUsada
    }));

    const request: ProductoRequest = {
      nombre: formVal.nombre,
      unidadBase: formVal.unidadBase,
      idCategoria: formVal.idCategoria,
      seVende: formVal.seVende,
      precioUnitarioVenta: formVal.precioUnitarioVenta,
      receta: recetaRequest
    };

    if (this.producto.id) {
      this.productoService.actualizar(this.producto.id, request).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Actualizado', detail:'Producto actualizado correctamente'});
          this.hideDialog();
          this.refreshTable();
        },
        error: () => this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo actualizar'})
      });
    } else {
      this.productoService.crear(request).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Creado', detail:'Producto creado correctamente'});
          this.hideDialog();
          this.refreshTable();
        },
        error: () => this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo crear'})
      });
    }
  }

  deleteProducto(prod: ProductoResponse) {
    this.deleteProductoDialog = true;
    this.producto = { ...prod };
  }

  confirmDelete() {
    this.deleteProductoDialog = false;
    this.productoService.eliminar(this.producto.id).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Eliminado', detail:'Producto eliminado correctamente'});
        this.refreshTable();
        this.producto = {} as ProductoResponse;
      },
      error: () => this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo eliminar'})
    });
  }

  hideDialog() {
    this.productoDialog = false;
    this.submitted = false;
  }
}