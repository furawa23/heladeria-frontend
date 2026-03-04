import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module'; 
import { MesaResponse, MesaRequest } from '../../../../models/venta.interface'; 
import { MessageService } from 'primeng/api';
import { MesaService } from '../../../../services/mesa.service'; 
import { AuthService } from '../../../../services/auth.service'; // <-- NUEVO IMPORT
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-listamesas',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './listamesas.component.html',
  styleUrl: './listamesas.component.scss',
  providers: [
    MesaService, MessageService
  ]
})
export class ListaMesas implements OnInit {

  // --- NUEVA BANDERA ---
  faltaSucursal: boolean = false;
  idSucursalActual: number | null = null; // Para auto-asignar al crear mesas

  // Diálogos
  mesaDialog: boolean = false;
  deleteMesaDialog: boolean = false;
  saveConfirmDialog: boolean = false;

  // Datos
  mesa!: MesaResponse; 
  mesas: MesaResponse[] = [];
  
  form!: FormGroup;

  // Paginación y Estado
  totalRecords: number = 0;
  loading: boolean = true;
  rows: number = 12; 
  rowsPerPageOptions = [12, 24, 36];
  submitted: boolean = false;

  constructor(
    private mesaService: MesaService,
    private authService: AuthService, // <-- INYECTADO
    private messageService: MessageService, 
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // 1. Validar si el usuario requiere seleccionar una sucursal
    const user = this.authService.getUser();
    const sucursalTemporal = localStorage.getItem('sucursalActiva');

    // Si el usuario NO tiene idSucursal (es dueño/superadmin) Y no ha elegido una
    if (!user?.idSucursal && !sucursalTemporal) {
      this.faltaSucursal = true;
      this.loading = false;
      return; // Detenemos la carga
    }

    // 2. Guardamos el ID de la sucursal actual para auto-asignarlo a las mesas nuevas
    this.idSucursalActual = user?.idSucursal || (sucursalTemporal ? parseInt(sucursalTemporal) : null);

    // 3. Continuamos el flujo normal
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      numero: [null, [Validators.required, Validators.min(1)]],
      idSucursal: [this.idSucursalActual, Validators.required] // Asignado automáticamente
    });
  }

  loadMesas(event: any) {
    this.loading = true;
    const first = event?.first ?? 0;
    const rows = event?.rows ?? this.rows;
    const page = first / rows;
    const size = rows;

    let sortStr = 'numero,asc';
    if (event && event.sortField) {
        const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
        sortStr = `${event.sortField},${sortOrder}`;
    }

    this.mesaService.listarTodas(page, size, sortStr).subscribe({
      next: (data: any) => {
        this.mesas = data.content;
        this.totalRecords = data.totalElements;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { 
        this.loading = false; 
      }
    });
  }

  refreshGrid() {
    this.loadMesas({ first: 0, rows: this.rows });
  }

  openNew(){
    this.mesa = {} as MesaResponse;
    this.submitted = false;
    this.mesaDialog = true;
    
    // Reseteamos el form manteniendo el ID de sucursal oculto intacto
    this.form.reset({
      numero: null,
      idSucursal: this.idSucursalActual
    });
  }

  editMesa(mesa: MesaResponse){
    this.mesa = {...mesa};
    this.mesaDialog = true;
    
    this.form.patchValue({
      numero: mesa.numero,
      idSucursal: this.idSucursalActual 
    });
  }

  deleteMesa(mesa: MesaResponse){
    this.deleteMesaDialog = true;
    this.mesa = {...mesa};
  }

  confirmDelete(){
    this.deleteMesaDialog = false;
    this.mesaService.eliminar(this.mesa.id).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Mesa eliminada', detail:'Mesa eliminada correctamente'});
        this.refreshGrid();
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo eliminar la mesa'});
      }
    });
  }

  hideDialog(){
    this.mesaDialog = false;
    this.submitted = false;
  }

  saveMesa(){
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.saveConfirmDialog = true;
  }

  confirmSave() {
    this.saveConfirmDialog = false;
    const formValues = this.form.getRawValue();
    
    const requestDTO: MesaRequest = {
      numero: formValues.numero,
      idSucursal: formValues.idSucursal
    };

    if(this.mesa.id){
      this.mesaService.actualizar(this.mesa.id, requestDTO).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Mesa actualizada', detail:'Mesa actualizada correctamente'});
          this.refreshGrid();
          this.mesaDialog = false;
        },
        error: () => {
          this.messageService.add({severity:'error', summary:'Error', detail:'Error al actualizar'});
        }
      });
    } else {
      this.mesaService.crear(requestDTO).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Mesa creada', detail:'Mesa creada correctamente'});
          this.refreshGrid();
          this.mesaDialog = false;
        },
        error: () => {
           this.messageService.add({severity:'error', summary:'Error', detail:'Error al crear'});
        }
      });
    }
  }
}