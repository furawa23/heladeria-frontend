import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { SucursalResponse, SucursalRequest, EmpresaResponse } from '../../../models/models.interface';
import { MessageService } from 'primeng/api';
import { SucursalService } from '../../../services/sucursal.service';
import { EmpresaService } from '../../../services/empresa.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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

  // Filtros
  selectedEmpresa: number | null = null;
  empresasFilterOptions: EmpresaResponse[] = [];

  // Dropdowns del formulario
  empresasFormOptions: EmpresaResponse[] = [];

  sucursalDialog: boolean = false;
  deleteSucursalDialog: boolean = false;

  sucursal!: SucursalResponse; 
  sucursales: SucursalResponse[] = [];
  
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
    private empresaService: EmpresaService,
    private messageService: MessageService, 
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadEmpresas();

    // 1. Intentamos leer del STATE (Viene oculto)
    const navigation = this.router.getCurrentNavigation(); // Solo funciona en constructor a veces, mejor history.state
    const stateEmpresaId = history.state.empresaId;

    if (stateEmpresaId) {
       this.selectedEmpresa = +stateEmpresaId;
       this.loadSucursales({ first: 0, rows: 10 });
    } 
    // 2. Si no hay state, revisamos QueryParams (por si acaso alguien entra por link antiguo)
    else {
      this.route.queryParams.subscribe(params => {
        if (params['empresaId']) {
          this.selectedEmpresa = +params['empresaId'];
        }
        this.loadSucursales({ first: 0, rows: 10 });
      });
    }
  }

  initForm() {
    this.form = this.fb.group({
      idEmpresa: [null, Validators.required],
      nombre: ['', Validators.required],
      direccion: ['', Validators.required]
    });
  }

  // Cargamos empresas una sola vez para usar en filtro y formulario
  loadEmpresas() {
    this.empresaService.listarTodas(0, 1000).subscribe({
        next: (data) => {
            this.empresasFilterOptions = data.content;
            this.empresasFormOptions = data.content;
            this.cdr.detectChanges();
        }
    });
  }

// Lógica principal de carga con filtro y ordenamiento
  loadSucursales(event: any) {
    this.loading = true;
    const first = event?.first ?? 0;
    const rows = event?.rows ?? 10;
    const page = first / rows;
    const size = rows;

    // --- LÓGICA DE ORDENAMIENTO ---
    let sortStr = '';
    if (event.sortField) {
        // PrimeNG envía 1 para Ascendente, -1 para Descendente
        // Convertimos a 'asc' o 'desc' para Spring Boot
        const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
        sortStr = `${event.sortField},${sortOrder}`;
    }
    // ------------------------------

    if (this.selectedEmpresa) {
        // Filtrado por Empresa (pasamos sortStr como 4to argumento)
        this.sucursalService.listarPorEmpresa(page, size, this.selectedEmpresa, sortStr)
            .subscribe(this.processData());
    } else {
        // Listar Todas (pasamos sortStr como 3er argumento)
        this.sucursalService.listarTodas(page, size, sortStr)
            .subscribe(this.processData());
    }
  }
  // Helper para procesar respuesta
  processData() {
    return {
      next: (data: any) => {
        this.sucursales = data.content;
        this.totalRecords = data.totalElements;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    };
  }

  refreshTable() {
    this.loadSucursales({ first: 0, rows: this.rows });
  }

  // Se ejecuta al cambiar el dropdown de filtro
  onEmpresaFilterChange() {
    this.refreshTable();
  }

  clearFilters() {
      this.selectedEmpresa = null;
      // Limpiamos la URL también
      this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { empresaId: null },
          queryParamsHandling: 'merge'
      });
      this.refreshTable();
  }

  openNew(){
    this.sucursal = {} as SucursalResponse;
    this.submitted = false;
    this.sucursalDialog = true;
    this.form.reset();

    // Si hay una empresa filtrada, la pre-seleccionamos en el formulario
    if (this.selectedEmpresa) {
        this.form.patchValue({ idEmpresa: this.selectedEmpresa });
    }
  }

  editSucursal(sucursal: SucursalResponse){
    this.sucursal = {...sucursal};
    this.sucursalDialog = true;
    
    // Mapeo de datos para editar
    // Aseguramos que idEmpresa se extraiga correctamente si viene en un objeto anidado
    // Asumo que tu SucursalResponse tiene un campo 'empresa' con 'id', o un campo 'idEmpresa' plano.
    // Ajusta esto según tu DTO real:
    const idEmpresaValue = (sucursal as any).idEmpresa || (sucursal as any).empresa?.id;

    this.form.patchValue({
      idEmpresa: idEmpresaValue,
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
    this.sucursalService.eliminar(this.sucursal.id).subscribe(()=>{
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
    
    // Usamos getRawValue por seguridad (buenas prácticas)
    const formValues = this.form.getRawValue();
    
    const sucursalRequest: SucursalRequest = {
      idEmpresa: formValues.idEmpresa,
      nombre: formValues.nombre,
      direccion: formValues.direccion
    };

    if(this.sucursal.id){
      this.sucursalService.actualizar(this.sucursal.id, sucursalRequest).subscribe(()=>{
        this.messageService.add({severity:'success', summary:'Sucursal actualizada', detail:'Sucursal actualizada correctamente'});
        this.refreshTable();
        this.sucursalDialog = false;
      });
    } else {
      this.sucursalService.crear(sucursalRequest).subscribe(()=>{
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