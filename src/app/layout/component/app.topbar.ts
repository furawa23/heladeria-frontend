import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- AÑADIDO ChangeDetectorRef
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { SucursalResponse } from '../../models/seguridad.interface';
import { SharedModule } from '../../shared/shared.module';

// Importamos tus servicios
import { AuthService } from '../../services/auth.service';
import { SucursalService } from '../../services/sucursal.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, SharedModule],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
                <i class="pi pi-box text-primary text-4xl mr-2"></i>
                <span>SISTEMA HELADERÍA</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="flex align-items-center mr-3" *ngIf="!esEmpleado">
                <span class="hidden md:block font-bold mr-3 text-600">SUCURSAL ACTUAL:</span>
                <p-select 
                    [options]="sucursales" 
                    [(ngModel)]="sucursalSeleccionada" 
                    optionLabel="nombre" 
                    optionValue="id"
                    placeholder="Seleccione sucursal" 
                    (onChange)="cambiarSucursal($event.value)"
                    styleClass="w-12rem"
                    [showClear]="true"
                    (onClear)="limpiarSucursal()">
                </p-select>
            </div>

            <div class="flex align-items-center mr-3" *ngIf="esEmpleado">
                 <p-tag severity="info" [value]="'Sucursal: ' + nombreSucursalEmpleado" icon="pi pi-map-marker"></p-tag>
            </div>

            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-user"></i>
                        <span>Perfil</span>
                    </button>
                    <button type="button" class="layout-topbar-action" (click)="logout()">
                        <i class="pi pi-sign-out"></i>
                        <span>Salir</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar implements OnInit {
    items!: MenuItem[];
    
    // Lógica de sucursales
    esEmpleado: boolean = false;
    sucursales: SucursalResponse[] = [];
    sucursalSeleccionada: number | null = null;
    nombreSucursalEmpleado: string = '';

    constructor(
        public layoutService: LayoutService,
        private authService: AuthService,         
        private sucursalService: SucursalService,
        private cdr: ChangeDetectorRef            // <-- INYECTADO AQUÍ
    ) {}

    ngOnInit() {
        this.cargarDatosUsuario();
    }

    cargarDatosUsuario() {
        const usuario = this.authService.getUser();

        if (usuario) {
            this.esEmpleado = usuario.idSucursal != null;

            if (this.esEmpleado) {
                this.nombreSucursalEmpleado = usuario.nombreSucursal;
            } else {
                if (usuario.idEmpresa) {
                    this.sucursalService.listarPorEmpresa(0, 100, usuario.idEmpresa).subscribe({
                        next: (data) => {
                            this.sucursales = data.content; 
                            
                            const savedId = localStorage.getItem('sucursalActiva');
                            this.sucursalSeleccionada = savedId ? parseInt(savedId) : null;

                            // <-- LÍNEA CLAVE: Obligamos a la interfaz a actualizarse con el valor recuperado
                            this.cdr.detectChanges(); 
                        },
                        error: (err) => console.error('Error cargando sucursales para el topbar', err)
                    });
                }
            }
        }
    }

    cambiarSucursal(id: number) {
        if (id) {
            localStorage.setItem('sucursalActiva', id.toString());
        } else {
            localStorage.removeItem('sucursalActiva');
        }
        window.location.reload();
    }

    limpiarSucursal() {
        localStorage.removeItem('sucursalActiva');
        window.location.reload();
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    logout() {
        this.authService.logout();
    }
}