import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module'; // Ajusta la ruta si es necesario
import { CategoriaProdResponse, CategoriaProdRequest } from '../../../../models/almacen.interface';
import { MessageService } from 'primeng/api';
import { CategoriaProductoService } from '../../../../services/catproducto.service'; // Asegúrate de importar el servicio creado
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-listacategoriasproducto',
  imports: [SharedModule],
  templateUrl: './listacategoriasproducto.component.html',
  styleUrl: './listacategoriasproducto.component.scss',
  providers: [
    CategoriaProductoService, MessageService
  ]
})
export class ListaCategoriasProducto implements OnInit {

  // Diálogos
  categoriaDialog: boolean = false;
  deleteCategoriaDialog: boolean = false;
  saveConfirmDialog: boolean = false;

  // Datos
  categoria!: CategoriaProdResponse; 
  categorias: CategoriaProdResponse[] = [];
  
  form!: FormGroup;

  // Paginación y Estado
  totalRecords: number = 0;
  loading: boolean = true;
  rows: number = 10;
  rowsPerPageOptions = [5, 10, 20];
  submitted: boolean = false;

  constructor(
    private categoriaService: CategoriaProductoService,
    private messageService: MessageService, 
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    // La carga inicial se dispara automáticamente por el evento (onLazyLoad) de la tabla
  }

  initForm() {
    this.form = this.fb.group({
      nombre: ['', Validators.required]
    });
  }

  // Lógica principal de carga con paginación y ordenamiento
  loadCategorias(event: any) {
    this.loading = true;
    const first = event?.first ?? 0;
    const rows = event?.rows ?? 10;
    const page = first / rows;
    const size = rows;

    // --- LÓGICA DE ORDENAMIENTO ---
    let sortStr = '';
    if (event.sortField) {
        const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
        sortStr = `${event.sortField},${sortOrder}`;
    }

    this.categoriaService.listarTodas(page, size, sortStr).subscribe({
      next: (data) => {
        this.categorias = data.content;
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
    // Forzamos la recarga simulando un evento de lazy load o reseteando
    this.loadCategorias({ first: 0, rows: this.rows });
  }

  openNew(){
    this.categoria = {} as CategoriaProdResponse;
    this.submitted = false;
    this.categoriaDialog = true;
    this.form.reset();
  }

  editCategoria(categoria: CategoriaProdResponse){
    this.categoria = {...categoria};
    this.categoriaDialog = true;
    
    this.form.patchValue({
      nombre: categoria.nombre
    });
  }

  deleteCategoria(categoria: CategoriaProdResponse){
    this.deleteCategoriaDialog = true;
    this.categoria = {...categoria};
  }

  confirmDelete(){
    this.deleteCategoriaDialog = false;
    this.categoriaService.eliminar(this.categoria.id).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Categoría eliminada', detail:'Categoría eliminada correctamente'});
        this.refreshTable();
      },
      error: (err) => {
        this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo eliminar la categoría'});
      }
    });
  }

  hideDialog(){
    this.categoriaDialog = false;
    this.submitted = false;
  }

  saveCategoria(){
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.saveConfirmDialog = true;
  }

  confirmSave() {
    this.saveConfirmDialog = false;
    
    const formValues = this.form.getRawValue();
    
    const requestDTO: CategoriaProdRequest = {
      nombre: formValues.nombre
    };

    if(this.categoria.id){
      this.categoriaService.actualizar(this.categoria.id, requestDTO).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Categoría actualizada', detail:'Categoría actualizada correctamente'});
          this.refreshTable();
          this.categoriaDialog = false;
        },
        error: () => {
          this.messageService.add({severity:'error', summary:'Error', detail:'Error al actualizar'});
        }
      });
    } else {
      this.categoriaService.crear(requestDTO).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Categoría creada', detail:'Categoría creada correctamente'});
          this.refreshTable();
          this.categoriaDialog = false;
        },
        error: () => {
           this.messageService.add({severity:'error', summary:'Error', detail:'Error al crear'});
        }
      });
    }
  }
}