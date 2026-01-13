import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { SucursalResponse, SucursalRequest, EmpresaResponse } from '../../../models/models.interface';
import { MessageService } from 'primeng/api';
import { SucursalService } from '../../../services/sucursal.service';
import { EmpresaService } from '../../../services/empresa.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listasucursales',
  imports: [SharedModule],
  templateUrl: './listasucursales.component.html',
  styleUrl: './listasucursales.component.scss',
  providers: [
    SucursalService, EmpresaService, MessageService
  ]
})
export class Listasucursales implements OnInit {

  currentEmpresaId: number | null = null;

  sucursalDialog: boolean = false;
  deleteSucursalDialog: boolean = false;

  sucursal!: SucursalResponse; 
  sucursales: SucursalResponse[] = [];
  
  // Lista para el dropdown de empresas
  empresasOptions: EmpresaResponse[] = [];

  form!: FormGroup;

  totalRecords: number = 0;
  loading: boolean = true;
  rows: number = 10;
  rowsPerPageOptions = [5, 10, 20];
  
  submitted: boolean = false;

  saveConfirmDialog: boolean = false;
  restoreConfirmDialog: boolean = false;

  constructor(
    private sucursalService: SucursalService,
    private empresaService: EmpresaService, // Necesario para llenar el dropdown
    private messageService: MessageService, 
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadEmpresasForDropdown();
    this.route.queryParams.subscribe(params => {
      if (params['empresaId']) {
        this.currentEmpresaId = +params['empresaId'];
      } else {
        this.currentEmpresaId = null;
      }
      this.loadSucursales({ first: 0, rows: 10 });
    });
  }

  initForm() {
    this.form = this.fb.group({
      idEmpresa: [null, Validators.required],
      nombre: ['', Validators.required],
      direccion: ['', Validators.required]
    });
  }

  // Carga las empresas para poder seleccionarlas al crear una sucursal
  loadEmpresasForDropdown() {
    // Pedimos una pagina grande para traer todas, o usar un endpoint 'listAll' si existe
    this.empresaService.listarTodas(0, 1000).subscribe({
        next: (data) => {
            this.empresasOptions = data.content;
        }
    });
  }

  loadSucursales(event: any) {
    this.loading = true;
    const first = event?.first ?? 0;
    const rows = event?.rows ?? 10;
    const page = first / rows;
    const size = rows;

    // LÓGICA CONDICIONAL: ¿Filtramos o traemos todo?
    if (this.currentEmpresaId) {
        this.sucursalService.listarPorEmpresa(page, size, this.currentEmpresaId).subscribe({
            next: (data) => {
                this.sucursales = data.content;
                this.totalRecords = data.totalElements;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => { this.loading = false; }
        });
    } else {
        // Carga normal (todas)
        this.sucursalService.listarTodas(page, size).subscribe({
            next: (data) => {
                this.sucursales = data.content;
                this.totalRecords = data.totalElements;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => { this.loading = false; }
        });
    }
  }

  refreshTable() {
    this.loadSucursales({ first: 0, rows: this.rows });
  }

  openNew(){
    this.sucursal = {} as SucursalResponse;
    this.submitted = false;
    this.sucursalDialog = true;
    this.form.reset();

    // Si hay un filtro activo, seteamos el valor en el dropdown automáticamente
    if (this.currentEmpresaId) {
        this.form.patchValue({ idEmpresa: this.currentEmpresaId });
        // Opcional: Deshabilitar el control para que no lo cambien
        // this.form.controls['idEmpresa'].disable(); 
    }
  }

  clearFilter() {
      this.currentEmpresaId = null;
      // Navegamos a la misma ruta sin parametros para limpiar la URL
      this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { empresaId: null },
          queryParamsHandling: 'merge'
      });
  }

  editSucursal(sucursal: SucursalResponse){
    this.sucursal = {...sucursal};
    this.sucursalDialog = true;
    
    // Al editar, debemos setear los valores. 
    // NOTA: Si sucursalResponse no trae idEmpresa, habrá que ajustar el backend
    // o asumir que no se cambia la empresa. Aquí asumo que lo tienes o lo seleccionas.
    this.form.patchValue({
      // idEmpresa: sucursal.idEmpresa, // Descomentar si tu DTO trae este campo
      nombre: sucursal.nombre,
      direccion: sucursal.direccion
    });
  }

  deleteSucursal(sucursal: SucursalResponse){
    this.deleteSucursalDialog = true;
    this.sucursal = {...sucursal};
  }

  confirmDelete(){
    this.deleteSucursalDialog = false;
    this.sucursalService.eliminar(this.sucursal.id).subscribe((data)=>{
      this.messageService.add({severity:'success', summary:'Sucursal desactivada', detail:'Sucursal desactivada correctamente'});
      this.refreshTable();
    });
  }

  hideDialog(){
    this.sucursalDialog = false;
    this.submitted = false;
  }

  saveSucursal(){
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }
    
    this.saveConfirmDialog = true;
  }

  confirmSave() {
    this.saveConfirmDialog = false;
    
    const formValues = this.form.value;
    const sucursalRequest: SucursalRequest = {
      idEmpresa: formValues.idEmpresa,
      nombre: formValues.nombre,
      direccion: formValues.direccion
    };

    if(this.sucursal.id){
      this.sucursalService.actualizar(this.sucursal.id, sucursalRequest).subscribe((data)=>{
        this.messageService.add({severity:'success', summary:'Sucursal actualizada', detail:'Sucursal actualizada correctamente'});
        this.refreshTable();
        this.sucursalDialog = false;
      });
    } else {
      this.sucursalService.crear(sucursalRequest).subscribe((data)=>{
        this.messageService.add({severity:'success', summary:'Sucursal registrada', detail:'Sucursal registrada correctamente'});
        this.refreshTable();
        this.sucursalDialog = false;
      });
    }
  }

  restaurarSucursal(sucursal: SucursalResponse) {    
    this.sucursal = {...sucursal};
    this.restoreConfirmDialog = true;
  }

  confirmRestaurar() {
    this.restoreConfirmDialog = false;

    this.sucursalService.restaurar(this.sucursal.id).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Sucursal Activada', detail: `La sucursal ${this.sucursal.nombre} ha sido activada correctamente.`});
        this.refreshTable(); 
      },
      error: (err) => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo activar la sucursal.'});
        console.error(err);
      }
    });
  }
}