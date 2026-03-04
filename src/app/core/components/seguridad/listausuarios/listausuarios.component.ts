import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { UsuarioResponse, UsuarioRequest, SucursalResponse, EmpresaResponse } from '../../../../models/seguridad.interface'; 
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../../../../services/usuario.service';
import { SucursalService } from '../../../../services/sucursal.service';
import { AuthService } from '../../../../services/auth.service'; // NUEVO IMPORT
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpresaService } from '../../../../services/empresa.service';

@Component({
  selector: 'app-listausuarios',
  imports: [SharedModule],
  templateUrl: './listausuarios.component.html',
  styleUrl: './listausuarios.component.scss',
  providers: [
    UsuarioService, SucursalService, MessageService, EmpresaService
  ]
})
export class Listausuarios implements OnInit {

  // --- LÓGICA DE ROLES ---
  isSuperAdmin: boolean = false;
  usuarioLogueado: UsuarioResponse | null = null;

  selectedEmpresa: number | null = null;
  selectedSucursal: number | null = null;

  empresasFilterOptions: EmpresaResponse[] = [];
  sucursalesFilterOptions: SucursalResponse[] = [];

  empresasFormOptions: EmpresaResponse[] = [];
  sucursalesFormOptions: SucursalResponse[] = [];

  currentSucursalId: number | null = null;

  usuarioDialog: boolean = false;
  deleteUsuarioDialog: boolean = false;

  usuario!: UsuarioResponse; 
  usuarios: UsuarioResponse[] = [];
  
  sucursalesOptions: SucursalResponse[] = [];
  rolesOptions: any[] = []; // Se llena dinámicamente según el rol logueado

  form!: FormGroup;

  totalRecords: number = 0;
  loading: boolean = true;
  rows: number = 10;
  rowsPerPageOptions = [5, 10, 20];
  
  submitted: boolean = false;

  saveConfirmDialog: boolean = false;
  restoreConfirmDialog: boolean = false;

  constructor(
    private usuarioService: UsuarioService,
    private sucursalService: SucursalService, 
    private authService: AuthService, // INYECTADO
    private messageService: MessageService, 
    private empresaService: EmpresaService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Obtener contexto del usuario
    this.usuarioLogueado = this.authService.getUser();
    this.isSuperAdmin = this.authService.hasRole('SUPERADMIN'); 

    this.initForm();

    if (this.isSuperAdmin) {
      // Configuraciones exclusivas para SUPERADMIN
      this.rolesOptions = [
        { label: 'Administrador de Negocio', value: 'DUENO' },
        { label: 'Cajero', value: 'EMPLEADO' },
        { label: 'Superadmin', value: 'SUPERADMIN' }
      ];
      this.loadEmpresasForFilter();
      this.empresaService.listarTodas(0, 1000).subscribe(data => this.empresasFormOptions = data.content);
      this.loadSucursalesForDropdown();
    } else {
      // Configuraciones exclusivas para DUEÑO
      this.rolesOptions = [
        { label: 'Administrador de Negocio', value: 'DUENO' },
        { label: 'Cajero', value: 'EMPLEADO' }
      ];
      
      this.selectedEmpresa = this.usuarioLogueado?.idEmpresa || null;
      
      // Cargamos automáticamente las sucursales de SU empresa
      if (this.selectedEmpresa) {
        this.sucursalService.listarPorEmpresa(0, 1000, this.selectedEmpresa).subscribe(data => {
          this.sucursalesFilterOptions = data.content;
          this.sucursalesFormOptions = data.content;
        });
      }
    }

    this.loadUsuarios({ first: 0, rows: 10 });
  }

  loadEmpresasForFilter() {
    this.empresaService.listarTodas(0, 1000).subscribe(data => {
      this.empresasFilterOptions = data.content;
    });
  }

  loadSucursalesForDropdown() {
    this.sucursalService.listarTodas(0, 1000).subscribe({
        next: (data) => {
            this.sucursalesOptions = data.content;
            if(!this.selectedEmpresa) {
              this.sucursalesFilterOptions = data.content;
            }
        }
    });
  }

  onEmpresaFilterChange() {
    this.selectedSucursal = null;
    
    if (this.selectedEmpresa) {
      this.sucursalService.listarPorEmpresa(0, 1000, this.selectedEmpresa).subscribe(data => {
        this.sucursalesFilterOptions = data.content;
      });
    } else {
      this.sucursalesFilterOptions = this.sucursalesOptions; // Volver a mostrar todas
    }
    this.refreshTable();
  }

  initForm() {
    this.form = this.fb.group({
      rol: [null, Validators.required],     
      // Pre-llenamos con su idEmpresa de forma oculta si es dueño
      idEmpresa: [{value: this.isSuperAdmin ? null : this.usuarioLogueado?.idEmpresa, disabled: true}], 
      idSucursal: [{value: null, disabled: true}],
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onRolChange() {
    const rol = this.form.get('rol')?.value;
    
    this.form.patchValue({ idSucursal: null });

    if (this.isSuperAdmin) {
        // Lógica de SUPERADMIN (Habilitar/Deshabilitar selectores)
        this.form.patchValue({ idEmpresa: null });
        this.sucursalesFormOptions = [];

        if (rol === 'SUPERADMIN') {
            this.form.get('idEmpresa')?.disable();
            this.form.get('idSucursal')?.disable();
            this.form.get('idEmpresa')?.clearValidators();
            this.form.get('idSucursal')?.clearValidators();
        } else {
            this.form.get('idEmpresa')?.enable();
            this.form.get('idEmpresa')?.setValidators([Validators.required]);
            this.form.get('idSucursal')?.disable();
        }
        this.form.get('idEmpresa')?.updateValueAndValidity();
    } else {
        // Lógica de DUEÑO (Empresa siempre oculta/fija, solo interacciona Sucursal)
        if (rol === 'DUENO') {
            this.form.get('idSucursal')?.disable();
            this.form.get('idSucursal')?.clearValidators();
        } else {
            this.form.get('idSucursal')?.enable();
            this.form.get('idSucursal')?.setValidators([Validators.required]);
        }
    }
    this.form.get('idSucursal')?.updateValueAndValidity();
  }

  onEmpresaChange() {
    // Esto solo es activado visualmente por el SUPERADMIN
    const idEmpresa = this.form.get('idEmpresa')?.value;
    const rol = this.form.get('rol')?.value;

    this.form.patchValue({ idSucursal: null }); 

    if (!idEmpresa) {
        this.sucursalesFormOptions = [];
        this.form.get('idSucursal')?.disable();
        return;
    }

    if (rol === 'DUENO') {
        this.form.get('idSucursal')?.disable();
        this.form.get('idSucursal')?.clearValidators();
    } 
    else if (rol === 'CAJERO' || rol === 'EMPLEADO' || rol === 'ADMIN_NEGOCIO') {
        this.form.get('idSucursal')?.enable();
        this.form.get('idSucursal')?.setValidators([Validators.required]);
        
        this.sucursalService.listarPorEmpresa(0, 100, idEmpresa).subscribe({
            next: (data) => {
                this.sucursalesFormOptions = data.content;
            }
        });
    }
    this.form.get('idSucursal')?.updateValueAndValidity();
  }

  loadUsuarios(event: any) {
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

    if (this.selectedSucursal) {
        this.usuarioService.listarPorSucursal(this.selectedSucursal, page, size, sortStr)
            .subscribe(this.processData());

    } else if (this.selectedEmpresa) {
        // DUEÑOS siempre filtrarán aquí inicialmente gracias al ngOnInit
        this.usuarioService.listarPorEmpresa(this.selectedEmpresa, page, size, sortStr)
            .subscribe(this.processData());

    } else {
        // SUPERADMIN viendo el padrón global
        this.usuarioService.listarTodos(page, size, sortStr)
            .subscribe(this.processData());
    }
  }

  processData() {
    return {
      next: (data: any) => {
        this.usuarios = data.content;
        this.totalRecords = data.totalElements;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    };
  }

  refreshTable() {
    this.loadUsuarios({ first: 0, rows: this.rows });
  }

  openNew() {
    this.usuario = {} as UsuarioResponse;
    this.submitted = false;
    this.usuarioDialog = true;
    
    // Si es DUEÑO, mantenemos su empresa invisiblemente
    this.form.reset({
      idEmpresa: this.isSuperAdmin ? null : this.usuarioLogueado?.idEmpresa
    });
    
    this.form.controls['password'].setValidators([Validators.required]);
    this.form.controls['idEmpresa'].disable();
    this.form.controls['idSucursal'].disable();
    
    this.form.updateValueAndValidity();
  }

  clearFilter() {
      this.currentSucursalId = null;
      this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { sucursalId: null },
          queryParamsHandling: 'merge'
      });
  }

  clearFilters() {
      if (this.isSuperAdmin) {
          this.selectedEmpresa = null;
          this.sucursalesFilterOptions = [...this.sucursalesOptions];
      }
      this.selectedSucursal = null;
      this.refreshTable();
  }
  
  editUsuario(usuario: UsuarioResponse) {
    this.usuario = { ...usuario };
    this.usuarioDialog = true;

    this.form.controls['password'].clearValidators();
    this.form.controls['password'].updateValueAndValidity();

    this.form.controls['idEmpresa'].disable();
    this.form.controls['idSucursal'].disable();

    this.form.patchValue({
        username: usuario.username,
        rol: usuario.rol,
        password: '',
        idEmpresa: usuario.idEmpresa || this.usuarioLogueado?.idEmpresa
    });

    // Carga visual de sucursales en edición
    if (this.isSuperAdmin && usuario.idEmpresa) {
        this.sucursalService.listarPorEmpresa(0, 100, usuario.idEmpresa).subscribe(data => {
            this.sucursalesFormOptions = data.content;
            this.cdr.detectChanges(); 
            this.form.patchValue({ idSucursal: usuario.idSucursal });
        });
    } else if (!this.isSuperAdmin) {
        // El DUEÑO ya tiene sus sucursales en sucursalesFormOptions
        this.form.patchValue({ idSucursal: usuario.idSucursal });
    } else {
        this.sucursalesFormOptions = [];
        this.form.patchValue({ idSucursal: null });
    }
  }

  deleteUsuario(usuario: UsuarioResponse){
    this.deleteUsuarioDialog = true;
    this.usuario = {...usuario};
  }

  confirmDelete(){
    this.deleteUsuarioDialog = false;
    this.usuarioService.eliminar(this.usuario.id).subscribe(()=>{
      this.messageService.add({severity:'success', summary:'Usuario desactivado', detail:'Usuario desactivado correctamente'});
      this.refreshTable();
    });
  }

  hideDialog(){
    this.usuarioDialog = false;
    this.submitted = false;
  }

  saveUsuario(){
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.saveConfirmDialog = true;
  }

  confirmSave() {
    this.saveConfirmDialog = false;
    
    const formValues = this.form.getRawValue();

    const requestData: UsuarioRequest = {
      username: formValues.username,
      rol: formValues.rol,
      idSucursal: formValues.idSucursal,
      idEmpresa: formValues.idEmpresa, 
      password: formValues.password ? formValues.password : '' 
    };

    if(this.usuario.id){
      this.usuarioService.actualizar(this.usuario.id, requestData).subscribe({
        next: () => {
             this.messageService.add({severity:'success', summary:'Usuario actualizado', detail:'Usuario actualizado correctamente'});
             this.refreshTable();
             this.usuarioDialog = false;
        },
        error: (err) => {
             console.error(err);
             this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo actualizar el usuario'});
        }
      });
    } else {
      this.usuarioService.crearDesdeSuperadmin(requestData).subscribe({
        next: () => {
            this.messageService.add({severity:'success', summary:'Usuario creado', detail:'Usuario creado correctamente'});
            this.refreshTable();
            this.usuarioDialog = false;
        },
        error: (err) => {
            console.error(err); 
            this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo crear el usuario. Verifica que la Empresa/Sucursal sean válidas.'});
        }
      });
    }
  }

  restaurarUsuario(usuario: UsuarioResponse) {    
    this.usuario = {...usuario};
    this.restoreConfirmDialog = true;
  }

  confirmRestaurar() {
    this.restoreConfirmDialog = false;

    this.usuarioService.restaurar(this.usuario.id).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Usuario Activado', detail: `El usuario ${this.usuario.username} ha sido activado correctamente.`});
        this.refreshTable(); 
      },
      error: (err) => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo activar el usuario.'});
        console.error(err);
      }
    });
  }
}