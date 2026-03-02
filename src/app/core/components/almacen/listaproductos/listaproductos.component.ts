import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
// Asegúrate de que SharedModule exporta los módulos de PrimeNG (TableModule, DialogModule, etc.)
import { SharedModule } from '../../../../shared/shared.module'; 

// Services
import { ProductoService } from '../../../../services/producto.service';
import { StockProductoService } from '../../../../services/stockproducto.service';
import { CategoriaProductoService } from '../../../../services/catproducto.service';
import { PresentacionProductoService } from '../../../../services/presproducto.service';

// Interfaces
import { 
  ProductoResponse, 
  ProductoRequest, 
  StockProdResponse, 
  RecetaItemRequest,
  CategoriaProdResponse, 
  PresentacionProdResponse,
  PresentacionProdRequest
} from '../../../../models/almacen.interface';


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

  // NUEVA BANDERA PARA ROL
  esEmpleado: boolean = false;

  // --- Data Sources ---
  productos: ProductoResponse[] = [];
  producto!: ProductoResponse; 
  
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
    
    // AQUÍ DETERMINAMOS EL ROL BASADO EN EL ID_SUCURSAL
    const authData = localStorage.getItem('auth'); 
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        // Según tu interfaz, un Usuario tiene idSucursal si es empleado
        this.esEmpleado = parsed.usuario?.idSucursal != null;
      } catch (e) {
        this.esEmpleado = false;
      }
    } else {
      this.esEmpleado = false;
    }

    this.initForm();
    this.cargarDatosAuxiliares();
    this.formPresentacion = this.fb.group({
      nombre: ['', Validators.required],
      factor: [1, [Validators.required, Validators.min(1)]],
      precioVenta: [null]
    });
  }

  // ==========================================================
  // 1. CARGA INICIAL Y AUXILIARES
  // ==========================================================

  cargarDatosAuxiliares() {
    this.categoriaService.listarTodas(0, 100).subscribe({
      next: (resp) => this.categorias = resp.content,
      error: (err) => console.error('Error cargando categorías', err)
    });

    this.productoService.listarInsumos(0, 100).subscribe({
      next: (resp) => this.insumosDisponibles = resp.content,
      error: (err) => console.error('Error cargando insumos', err)
    });
  }

  loadProductos(event: any) {
    this.loading = true;
    const page = (event?.first ?? 0) / (event?.rows ?? 10);
    const size = event?.rows ?? 10;
    
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
      idCategoria: [null, Validators.required],
      seVende: [false],
      precioUnitarioVenta: [0],
      receta: this.fb.array([]),
      // Control para stock inicial
      stock: [0, [Validators.min(0)]] 
    });

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
  // 3. LOGICA DE EXPANSIÓN (STOCK DUEÑO)
  // ==========================================================

  onRowExpand(event: any) {
    // Solo cargamos si es dueño (por seguridad)
    if (this.esEmpleado) return;

    const prodId = event.data.id;
    if (!this.stockCache[prodId]) {
      this.stockService.listarPorProducto(prodId).subscribe({
        next: (resp) => {
          // 1. Reasignamos el objeto completo para que Angular detecte el cambio (Inmutabilidad)
          this.stockCache = { ...this.stockCache, [prodId]: resp };
          
          // 2. Le decimos explícitamente a Angular que redibuje la vista
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  refreshTable() {
    this.stockCache = {}; 
    this.loadProductos({ first: 0, rows: this.rows });
  }

  // ==========================================================
  // 4. ABM (ALTA, BAJA, MODIFICACIÓN)
  // ==========================================================

  openNew() {
    this.producto = {} as ProductoResponse;
    this.submitted = false;
    this.productoDialog = true;
    
    // Resetear form (incluyendo stock en 0)
    this.form.reset({
      unidadBase: 'UNIDAD',
      seVende: false,
      precioUnitarioVenta: 0,
      stock: 0
    });
    this.recetaArray.clear();
    this.cdr.detectChanges();
  }

  editProducto(prod: ProductoResponse) {
    this.producto = { ...prod };
    this.productoDialog = true;

    const categoriaEncontrada = this.categorias.find(c => c.nombre === prod.categoria);
    const idCategoriaVal = categoriaEncontrada ? categoriaEncontrada.id : null;

    this.form.patchValue({
      nombre: prod.nombre,
      unidadBase: prod.unidadBase,
      idCategoria: idCategoriaVal, 
      seVende: prod.seVende,
      precioUnitarioVenta: prod.precioUnitarioVenta,
      stock: 0 
    });

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
    
    this.formPresentacion.reset({
      nombre: '',
      factor: 1,
      precioVenta: null 
    });

    const precioControl = this.formPresentacion.get('precioVenta');

    if (prod.seVende) {
      precioControl?.setValidators([Validators.required, Validators.min(0.1)]);
    } else {
      precioControl?.clearValidators();
      precioControl?.setValue(0);
    }
    
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
        this.cargarPresentaciones(this.productoSeseleccionadoParaPresentacion.id); 
        this.formPresentacion.reset({ nombre: '', factor: 1 });
      },
      error: () => this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo agregar'})
    });
  }

  borrarPresentacion(pres: PresentacionProdResponse) {
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
      receta: recetaRequest,
      // Solo enviamos stock si NO tiene ID (es creación) y si ES empleado
      stock: (!this.producto.id && this.esEmpleado) ? (formVal.stock || 0) : 0
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