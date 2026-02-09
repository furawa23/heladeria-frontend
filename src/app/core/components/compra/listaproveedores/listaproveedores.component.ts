import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module'; 
import { ProveedorResponse, ProveedorRequest } from '../../../../models/models.interface'; // Ajusta la ruta a tus modelos
import { MessageService } from 'primeng/api';
import { ProveedorService } from '../../../../services/proveedor.service'; // Ajusta la ruta a tu servicio
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-listaproveedores',
  standalone: true, // Asumo que es standalone como el anterior
  imports: [SharedModule],
  templateUrl: './listaproveedores.component.html',
  styleUrl: './listaproveedores.component.scss',
  providers: [
    ProveedorService, MessageService
  ]
})
export class ListaProveedores implements OnInit {

  // Diálogos
  proveedorDialog: boolean = false;
  deleteProveedorDialog: boolean = false;
  saveConfirmDialog: boolean = false;

  // Datos
  proveedor!: ProveedorResponse; 
  proveedores: ProveedorResponse[] = [];
  
  form!: FormGroup;

  // Paginación y Estado
  totalRecords: number = 0;
  loading: boolean = true;
  rows: number = 10;
  rowsPerPageOptions = [5, 10, 20];
  submitted: boolean = false;

  constructor(
    private proveedorService: ProveedorService,
    private messageService: MessageService, 
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    // La carga inicial se dispara por el evento (onLazyLoad) de la tabla
  }

  initForm() {
    this.form = this.fb.group({
      razonSocial: ['', Validators.required],
      ruc: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]], // RUC Perú usualmente 11
      telefono: ['', Validators.required]
    });
  }

  // Lógica principal de carga con paginación y ordenamiento
  loadProveedores(event: any) {
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

    this.proveedorService.listarTodas(page, size, sortStr).subscribe({
      next: (data) => {
        this.proveedores = data.content;
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
    this.loadProveedores({ first: 0, rows: this.rows });
  }

  openNew(){
    this.proveedor = {} as ProveedorResponse;
    this.submitted = false;
    this.proveedorDialog = true;
    this.form.reset();
  }

  editProveedor(proveedor: ProveedorResponse){
    this.proveedor = {...proveedor};
    this.proveedorDialog = true;
    
    this.form.patchValue({
      razonSocial: proveedor.razonSocial,
      ruc: proveedor.ruc,
      telefono: proveedor.telefono
    });
  }

  deleteProveedor(proveedor: ProveedorResponse){
    this.deleteProveedorDialog = true;
    this.proveedor = {...proveedor};
  }

  confirmDelete(){
    this.deleteProveedorDialog = false;
    this.proveedorService.eliminar(this.proveedor.id).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Proveedor eliminado', detail:'Proveedor eliminado correctamente'});
        this.refreshTable();
      },
      error: (err) => {
        this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo eliminar el proveedor'});
      }
    });
  }

  hideDialog(){
    this.proveedorDialog = false;
    this.submitted = false;
  }

  saveProveedor(){
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.saveConfirmDialog = true;
  }

  confirmSave() {
    this.saveConfirmDialog = false;
    
    const formValues = this.form.getRawValue();
    
    const requestDTO: ProveedorRequest = {
      razonSocial: formValues.razonSocial,
      ruc: formValues.ruc,
      telefono: formValues.telefono
    };

    if(this.proveedor.id){
      this.proveedorService.actualizar(this.proveedor.id, requestDTO).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Proveedor actualizado', detail:'Proveedor actualizado correctamente'});
          this.refreshTable();
          this.proveedorDialog = false;
        },
        error: () => {
          this.messageService.add({severity:'error', summary:'Error', detail:'Error al actualizar'});
        }
      });
    } else {
      this.proveedorService.crear(requestDTO).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Proveedor creado', detail:'Proveedor creado correctamente'});
          this.refreshTable();
          this.proveedorDialog = false;
        },
        error: () => {
           this.messageService.add({severity:'error', summary:'Error', detail:'Error al crear'});
        }
      });
    }
  }
}