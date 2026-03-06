import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { SucursalResponse, SucursalRequest, EmpresaResponse, UsuarioResponse } from '../../../../models/seguridad.interface';
import { MessageService } from 'primeng/api';
import { SucursalService } from '../../../../services/sucursal.service';
import { EmpresaService } from '../../../../services/empresa.service';
import { AuthService } from '../../../../services/auth.service'; // NUEVO IMPORT
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

  // --- LÓGICA DE ROLES ---
  isSuperAdmin: boolean = false;
  usuarioLogueado: UsuarioResponse | null = null;

  // Filtros
  selectedEmpresa: number | null = null;
  empresasFilterOptions: EmpresaResponse[] = [];

  // Dropdowns del formulario
  empresasFormOptions: EmpresaResponse[] = [];

  opcionesEstado = [
    { label: 'Todas', value: 'TODAS' },
    { label: 'Activas', value: 'ACTIVAS' },
    { label: 'Inactivas', value: 'INACTIVAS' }
  ];
  filtroEstado: string = 'TODAS';

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
    private authService: AuthService, // INYECTADO
    private messageService: MessageService, 
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Obtener contexto del usuario
    this.usuarioLogueado = this.authService.getUser();
    // Ajusta 'SUPERADMIN' al nombre exacto de tu rol en BD si es diferente
    this.isSuperAdmin = this.authService.hasRole('SUPERADMIN'); 

    this.initForm();

    if (this.isSuperAdmin) {
      // Si es SUPERADMIN, cargamos la lista de empresas y evaluamos URLs/State
      this.loadEmpresas();

      const stateEmpresaId = history.state.empresaId;
      if (stateEmpresaId) {
         this.selectedEmpresa = +stateEmpresaId;
         this.loadSucursales({ first: 0, rows: 10 });
      } else {
        this.route.queryParams.subscribe(params => {
          if (params['empresaId']) {
            this.selectedEmpresa = +params['empresaId'];
          }
          this.loadSucursales({ first: 0, rows: 10 });
        });
      }
    } else {
      // Si es DUEÑO, forzamos su propia empresa, ignoramos QueryParams y no cargamos otras empresas
      this.selectedEmpresa = this.usuarioLogueado?.idEmpresa || null;
      this.loadSucursales({ first: 0, rows: 10 });
    }
  }

  initForm() {
    this.form = this.fb.group({
      // Si no es superadmin, pre-llenamos con su idEmpresa
      idEmpresa: [this.isSuperAdmin ? null : this.usuarioLogueado?.idEmpresa, Validators.required],
      nombre: ['', Validators.required],
      direccion: ['', Validators.required]
    });
  }

  // Cargamos empresas solo si es SUPERADMIN
  loadEmpresas() {
    this.empresaService.listarTodas(0, 1000).subscribe({
        next: (data) => {
            this.empresasFilterOptions = data.content;
            this.empresasFormOptions = data.content;
            this.cdr.detectChanges();
        }
    });
  }

  loadSucursales(event: any) {
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

    if (this.selectedEmpresa) {
        // DUEÑOS siempre caerán aquí gracias a la asignación en ngOnInit
        this.sucursalService.listarPorEmpresa(page, size, this.selectedEmpresa, sortStr)
            .subscribe(this.processData());
    } else {
        // SUPERADMIN viendo todas las sucursales globales
        this.sucursalService.listarTodas(page, size, sortStr)
            .subscribe(this.processData());
    }
  }

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

  onEmpresaFilterChange() {
    this.refreshTable();
  }

  onEstadoChange() {
    this.refreshTable();
  }

  clearFilters() {
      // Solo el SUPERADMIN puede limpiar la empresa de la URL
      if (this.isSuperAdmin) {
        this.selectedEmpresa = null;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { empresaId: null },
            queryParamsHandling: 'merge'
        });
      }
      
      // Todos pueden resetear el estado
      this.filtroEstado = 'TODAS'; 
      this.refreshTable();
  }

  openNew(){
    this.sucursal = {} as SucursalResponse;
    this.submitted = false;
    this.sucursalDialog = true;
    
    // Reseteamos el formulario. Si es dueño, mantenemos su idEmpresa invisible.
    this.form.reset({
      idEmpresa: this.isSuperAdmin ? (this.selectedEmpresa || null) : this.usuarioLogueado?.idEmpresa,
      nombre: '',
      direccion: ''
    });
  }

  editSucursal(sucursal: SucursalResponse){
    this.sucursal = {...sucursal};
    this.sucursalDialog = true;
    
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