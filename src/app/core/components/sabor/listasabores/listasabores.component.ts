import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module'; 
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';

// Ajusta las importaciones de tus interfaces y servicios
import { SaborResponse, SaborRequest } from '../../../../models/sabor.interface';
import { ProductoResponse } from '../../../../models/almacen.interface'; 
import { SaboresService } from '../../../../services/sabor.service';
import { ProductoService } from '../../../../services/producto.service';

@Component({
  selector: 'app-lista-sabores',
  imports: [SharedModule], // Asumiendo que aquí tienes exportados los módulos de PrimeNG
  templateUrl: './listasabores.component.html',
  styleUrl: './listasabores.component.scss',
  providers: [
    SaboresService, ProductoService, MessageService
  ]
})
export class ListaSabores implements OnInit {

  // Diálogos
  saborDialog: boolean = false;
  deleteSaborDialog: boolean = false;
  saveConfirmDialog: boolean = false;

  // Datos
  sabor!: SaborResponse; 
  sabores: SaborResponse[] = [];
  productosDisponibles: ProductoResponse[] = []; // Lista para el MultiSelect
  
  form!: FormGroup;

  // Paginación y Estado
  totalRecords: number = 0;
  loading: boolean = true;
  rows: number = 10;
  rowsPerPageOptions = [5, 10, 20];
  submitted: boolean = false;

  constructor(
    private saborService: SaboresService,
    private productoService: ProductoService,
    private messageService: MessageService, 
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProductos(); // Cargamos los productos para el MultiSelect
  }

  initForm() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      precioAdicional: [0, [Validators.required, Validators.min(0)]],
      productosAsignados: [[]] // Array de IDs de productos seleccionados
    });
  }

  // Carga inicial de productos para el dropdown/multiselect
  loadProductos() {
      // Ajusta los parámetros de paginación según tu servicio (ej. obtener todos o una lista grande)
      this.productoService.listarTodas(0, 1000, 'nombre,asc').subscribe({
          next: (data) => {
              this.productosDisponibles = data.content;
          },
          error: () => {
              this.messageService.add({severity:'error', summary:'Error', detail:'No se pudieron cargar los productos'});
          }
      });
  }

  // Lógica principal de carga de sabores
  loadSabores(event: any) {
    this.loading = true;
    const first = event?.first ?? 0;
    const rows = event?.rows ?? 10;
    const page = first / rows;
    const size = rows;

    let sortStr = '';
    if (event.sortField) {
        const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
        sortStr = `${event.sortField},${sortOrder}`;
    }

    this.saborService.listarTodas(page, size, sortStr).subscribe({
      next: (data) => {
        this.sabores = data.content;
        this.totalRecords = data.totalElements;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { 
        this.loading = false; 
      }
    });
  }

  refreshTable() {
    this.loadSabores({ first: 0, rows: this.rows });
  }

  openNew(){
    this.sabor = {} as SaborResponse;
    this.submitted = false;
    this.saborDialog = true;
    this.form.reset({ precioAdicional: 0, productosAsignados: [] });
  }

  editSabor(sabor: SaborResponse){
    this.sabor = {...sabor};
    this.saborDialog = true;
    
    // Al editar, necesitamos cargar qué productos ya tienen este sabor asignado.
    // Asumiendo que tienes un método en ProductoSaborService para esto:
    this.saborService.obtenerProductosPorSabor(sabor.id).subscribe({
        next: (productosAsignadosIds) => {
            this.form.patchValue({
              nombre: sabor.nombre,
              precioAdicional: sabor.precioAdicional,
              productosAsignados: productosAsignadosIds // Lista de IDs
            });
        },
        error: () => {
            // Si falla la carga de asignaciones, igual mostramos el form
            this.form.patchValue({
              nombre: sabor.nombre,
              precioAdicional: sabor.precioAdicional,
              productosAsignados: []
            });
            this.messageService.add({severity:'warn', summary:'Aviso', detail:'No se pudieron cargar las asignaciones de productos'});
        }
    });
  }

  deleteSabor(sabor: SaborResponse){
    this.deleteSaborDialog = true;
    this.sabor = {...sabor};
  }

  confirmDelete(){
    this.deleteSaborDialog = false;
    this.saborService.eliminar(this.sabor.id).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Éxito', detail:'Sabor eliminado correctamente'});
        this.refreshTable();
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo eliminar el sabor'});
      }
    });
  }

  hideDialog(){
    this.saborDialog = false;
    this.submitted = false;
  }

  saveSabor(){
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.saveConfirmDialog = true;
  }

  confirmSave() {
    this.saveConfirmDialog = false;
    const formValues = this.form.getRawValue();
    
    const requestDTO: SaborRequest = {
      nombre: formValues.nombre,
      precioAdicional: formValues.precioAdicional
    };

    const productosSeleccionadosIds: number[] = formValues.productosAsignados || [];

    if(this.sabor.id){
      // 1. Actualizar el sabor base
      this.saborService.actualizar(this.sabor.id, requestDTO).subscribe({
        next: () => {
            // 2. Actualizar las asignaciones a productos
            this.actualizarAsignaciones(this.sabor.id, productosSeleccionadosIds);
        },
        error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Error al actualizar el sabor'})
      });
    } else {
      // 1. Crear nuevo sabor
      this.saborService.crear(requestDTO).subscribe({
        next: (nuevoSabor) => {
            // 2. Asignar los productos al nuevo sabor
            this.actualizarAsignaciones(nuevoSabor.id, productosSeleccionadosIds, true);
        },
        error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Error al crear el sabor'})
      });
    }
  }

  // Método auxiliar para manejar las relaciones ProductoSabor
  private actualizarAsignaciones(saborId: number, productosIds: number[], isNew: boolean = false) {
      this.saborService.asignarProductosASabor(saborId, productosIds).subscribe({
          next: () => {
              const msg = isNew ? 'Sabor creado y asignado correctamente' : 'Sabor y asignaciones actualizados';
              this.messageService.add({severity:'success', summary:'Éxito', detail: msg});
              this.refreshTable();
              this.saborDialog = false;
          },
          error: () => {
              this.messageService.add({severity:'error', summary:'Error parcial', detail:'Sabor guardado, pero falló la asignación a productos'});
              this.refreshTable();
              this.saborDialog = false;
          }
      });
  }
}