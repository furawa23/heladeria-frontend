import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module'; // Ajusta la ruta
import { MesaResponse, MesaRequest } from '../../../../models/venta.interface'; // Ajusta la ruta
import { MessageService } from 'primeng/api';
import { MesaService } from '../../../../services/mesa.service'; // Asegúrate de importar el servicio creado
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
  rows: number = 12; // Múltiplo de 3 y 4 ideal para cuadrículas
  rowsPerPageOptions = [12, 24, 36];
  submitted: boolean = false;

  constructor(
    private mesaService: MesaService,
    private messageService: MessageService, 
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      numero: [null, [Validators.required, Validators.min(1)]],
      idSucursal: [null, Validators.required] // Idealmente esto en HTML sería un p-dropdown
    });
  }

  loadMesas(event: any) {
    this.loading = true;
    const first = event?.first ?? 0;
    const rows = event?.rows ?? this.rows;
    const page = first / rows;
    const size = rows;

    // Lógica de ordenamiento por defecto (ej. por número de mesa)
    let sortStr = 'numero,asc';
    if (event.sortField) {
        const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
        sortStr = `${event.sortField},${sortOrder}`;
    }

    this.mesaService.listarTodas(page, size, sortStr).subscribe({
      next: (data: any) => {
        // Suponiendo que tu backend retorna una estructura paginada { content: [], totalElements: X }
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
    this.form.reset();
  }

  editMesa(mesa: MesaResponse){
    this.mesa = {...mesa};
    this.mesaDialog = true;
    
    // Aquí asumimos que tienes el ID de la sucursal o lo buscas, 
    // en este ejemplo lo dejaremos preparado para que lo adaptes según tu lógica de Sucursales.
    this.form.patchValue({
      numero: mesa.numero,
      idSucursal: null // Reemplazar con mesa.idSucursal si la respuesta lo incluye, o manejarlo en el template
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