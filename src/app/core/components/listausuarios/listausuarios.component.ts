import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { UsuarioResponse, UsuarioRequest, SucursalResponse, EmpresaResponse } from '../../../models/models.interface'; // Asegúrate de tener estas interfaces
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../../../services/usuario.service';
import { SucursalService } from '../../../services/sucursal.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpresaService } from '../../../services/empresa.service';

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
  
  // Listas para dropdowns
  sucursalesOptions: SucursalResponse[] = [];

  rolesOptions = [
    { label: 'Administrador de Negocio', value: 'DUENO' },
    { label: 'Cajero', value: 'EMPLEADO' },
    { label: 'Superadmin', value: 'SUPERADMIN' }
  ];

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
    private sucursalService: SucursalService, // Para llenar el dropdown de sucursal
    private messageService: MessageService, 
    private empresaService: EmpresaService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSucursalesForDropdown();
    this.loadEmpresasForFilter();
    this.loadSucursalesForForm();
    this.empresaService.listarTodas(0, 1000).subscribe(data => this.empresasFormOptions = data.content);
    // Detectar si venimos filtrados por una sucursal específica
    this.loadUsuarios({ first: 0, rows: 10 });
  }

  loadEmpresasForFilter() {
    this.empresaService.listarTodas(0, 1000).subscribe(data => {
      this.empresasFilterOptions = data.content;
    });
  }

  loadSucursalesForForm() {
    this.sucursalService.listarTodas(0, 1000).subscribe(data => {
      this.sucursalesFormOptions = data.content;
      if(!this.selectedEmpresa) {
        this.sucursalesFilterOptions = data.content;
      }
    });
  }

  onEmpresaFilterChange() {
    this.selectedSucursal = null; // Reseteamos sucursal al cambiar empresa
    
    if (this.selectedEmpresa) {
      // Si selecciono empresa, cargo SOLO sus sucursales en el filtro de sucursal
      this.sucursalService.listarPorEmpresa(0, 1000, this.selectedEmpresa).subscribe(data => {
        this.sucursalesFilterOptions = data.content;
      });
    } else {
      // Si limpio empresa, muestro todas las sucursales
      this.sucursalesFilterOptions = this.sucursalesFormOptions;
    }
    this.refreshTable();
  }

  initForm() {
    this.form = this.fb.group({
      rol: [null, Validators.required],     // 1. Primero el Rol
      idEmpresa: [{value: null, disabled: true}], // 2. Empresa (inicia deshabilitado)
      idSucursal: [{value: null, disabled: true}],// 3. Sucursal (inicia deshabilitado)
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onRolChange() {
    const rol = this.form.get('rol')?.value;
    
    // Reseteamos valores inferiores
    this.form.patchValue({ idEmpresa: null, idSucursal: null });
    this.sucursalesFormOptions = [];

    if (rol === 'SUPERADMIN') {
        // SUPERADMIN: No tiene empresa ni sucursal (según tu lógica)
        this.form.get('idEmpresa')?.disable();
        this.form.get('idSucursal')?.disable();
        
        // Quitamos validadores si no son necesarios
        this.form.get('idEmpresa')?.clearValidators();
        this.form.get('idSucursal')?.clearValidators();
    } 
    else {
        // DUENO o EMPLEADO: Requieren elegir Empresa primero
        this.form.get('idEmpresa')?.enable();
        this.form.get('idEmpresa')?.setValidators([Validators.required]);
        
        // Sucursal sigue bloqueada hasta que elija empresa
        this.form.get('idSucursal')?.disable();
    }
    this.form.get('idEmpresa')?.updateValueAndValidity();
    this.form.get('idSucursal')?.updateValueAndValidity();
  }

  onEmpresaChange() {
    const idEmpresa = this.form.get('idEmpresa')?.value;
    const rol = this.form.get('rol')?.value;

    this.form.patchValue({ idSucursal: null }); // Limpiar sucursal anterior

    if (!idEmpresa) {
        this.sucursalesFormOptions = [];
        this.form.get('idSucursal')?.disable();
        return;
    }

    if (rol === 'DUENO') {
        // DUEÑO: Empresa seleccionada, pero Sucursal se queda NULL (bloqueada)
        this.form.get('idSucursal')?.disable();
        this.form.get('idSucursal')?.clearValidators();
    } 
    else if (rol === 'CAJERO' || rol === 'EMPLEADO' || rol === 'ADMIN_NEGOCIO') {
        // OTROS ROLES: Deben seleccionar Sucursal de esa empresa
        this.form.get('idSucursal')?.enable();
        this.form.get('idSucursal')?.setValidators([Validators.required]);
        
        // Cargar sucursales de la empresa seleccionada
        this.sucursalService.listarPorEmpresa(0, 100, idEmpresa).subscribe({
            next: (data) => {
                this.sucursalesFormOptions = data.content;
            }
        });
    }
    this.form.get('idSucursal')?.updateValueAndValidity();
  }

  loadSucursalesForDropdown() {
    this.sucursalService.listarTodas(0, 1000).subscribe({
        next: (data) => {
            this.sucursalesOptions = data.content;
        }
    });
  }

loadUsuarios(event: any) {
    this.loading = true;
    const first = event?.first ?? 0;
    const rows = event?.rows ?? 10;
    const page = first / rows;
    const size = rows;

    // JERARQUÍA DE FILTROS
    if (this.selectedSucursal) {
        // 1. Si hay Sucursal seleccionada -> Filtrar por Sucursal
        this.usuarioService.listarPorSucursal(this.selectedSucursal, page, size).subscribe(this.processData());
    } else if (this.selectedEmpresa) {
        // 2. Si hay Empresa seleccionada (y no sucursal) -> Filtrar por Empresa
        this.usuarioService.listarPorEmpresa(this.selectedEmpresa, page, size).subscribe(this.processData());
    } else {
        // 3. Nada seleccionado -> Listar Todos
        this.usuarioService.listarTodos(page, size).subscribe(this.processData());
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
    
    this.form.reset();
    
    // Estado inicial: Password requerido, Selects deshabilitados (hasta elegir rol)
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
      this.selectedEmpresa = null;
      this.selectedSucursal = null;
      // Restauramos la lista completa de sucursales en el filtro
      this.sucursalesFilterOptions = [...this.sucursalesFormOptions];
      this.refreshTable();
  }
  
  editUsuario(usuario: UsuarioResponse) {
    this.usuario = { ...usuario };
    this.usuarioDialog = true;

    // 1. Password opcional al editar
    this.form.controls['password'].clearValidators();
    this.form.controls['password'].updateValueAndValidity();

    // 2. BLOQUEO TOTAL: Deshabilitamos Empresa y Sucursal SIEMPRE
    this.form.controls['idEmpresa'].disable();
    this.form.controls['idSucursal'].disable();

    // 3. Seteamos los datos básicos
    this.form.patchValue({
        username: usuario.username,
        rol: usuario.rol,
        password: '',
        idEmpresa: usuario.idEmpresa // Se setea el valor aunque esté disabled
    });

    // 4. Carga VISUAL de Sucursales
    // Aunque el campo esté bloqueado, necesitamos cargar la lista de opciones
    // para que el dropdown pueda mostrar el NOMBRE de la sucursal seleccionada
    // en lugar de aparecer vacío o solo con el ID.
    if (usuario.idEmpresa) {
        this.sucursalService.listarPorEmpresa(0, 100, usuario.idEmpresa).subscribe(data => {
            this.sucursalesFormOptions = data.content;
            
            // Forzamos detección de cambios para evitar errores visuales (NG0100)
            this.cdr.detectChanges(); 
            
            // Una vez tenemos la lista, seteamos el valor de la sucursal
            this.form.patchValue({ idSucursal: usuario.idSucursal });
        });
    } else {
        // Caso Superadmin o sin empresa: Limpiamos
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
    
    // getRawValue incluye los campos disabled (importante para idSucursal o idEmpresa cuando están bloqueados)
    const formValues = this.form.getRawValue();

    const requestData: UsuarioRequest = {
      username: formValues.username,
      rol: formValues.rol,
      idSucursal: formValues.idSucursal,
      
      // --- AGREGA ESTA LÍNEA ---
      idEmpresa: formValues.idEmpresa, 
      // -------------------------

      password: formValues.password ? formValues.password : '' 
    };

    if(this.usuario.id){
      // Actualizar
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
      // Crear
      this.usuarioService.crearDesdeSuperadmin(requestData).subscribe({
        next: () => {
            this.messageService.add({severity:'success', summary:'Usuario creado', detail:'Usuario creado correctamente'});
            this.refreshTable();
            this.usuarioDialog = false;
        },
        error: (err) => {
            console.error(err); // Mira la consola del navegador si falla
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