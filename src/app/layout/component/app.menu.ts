import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];
    private authService = inject(AuthService);

    ngOnInit() {
        this.model = [
            {
                label: 'Inicio',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] }
                ]
            },
            {
                label: 'Seguridad',
                visible: this.authService.hasAnyRole(['DUENO', 'SUPERADMIN']),
                items: [
                    { label: 'Empresas', icon: 'pi pi-fw pi-building', routerLink: ['/empresas'], visible: this.authService.hasRole('SUPERADMIN') },
                    { label: 'Sucursales', icon: 'pi pi-fw pi-sitemap', routerLink: ['/sucursales'] },
                    { label: 'Usuarios', icon: 'pi pi-fw pi-users', routerLink: ['/usuarios'] }
                ]
            },
            {
                label: 'Almacén',
                visible: this.authService.hasAnyRole(['DUENO','EMPLEADO']),
                items: [
                    { label: 'Categorías', icon: 'pi pi-fw pi-tags', routerLink: ['/categorias'], visible: this.authService.hasRole('DUENO') },
                    { label: 'Sabores', icon: 'pi pi-fw pi-sparkles', routerLink: ['/sabores'],visible: this.authService.hasAnyRole(['DUENO','EMPLEADO']) },
                    { label: 'Productos', icon: 'pi pi-fw pi-box', routerLink: ['/productos'],visible: this.authService.hasAnyRole(['DUENO','EMPLEADO']) },
                    { label: 'Mesas', icon: 'pi pi-fw pi-table', routerLink: ['/mesas'], visible: this.authService.hasRole('DUENO') }
                ]
            },
            {
                label: 'Compras',
                visible: this.authService.hasAnyRole(['DUENO','EMPLEADO']),
                items: [
                    { label: 'Proveedores', icon: 'pi pi-fw pi-truck', routerLink: ['/proveedores'],visible: this.authService.hasRole('DUENO') },
                    { label: 'Compras', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/compras'],visible: this.authService.hasAnyRole(['DUENO','EMPLEADO'])  }
                ]
            },
            {
                label: 'Ventas',
                visible: this.authService.hasAnyRole(['DUENO','EMPLEADO']),
                items: [
                    { label: 'Ventas', icon: 'pi pi-fw pi-wallet', routerLink: ['/ventas'] },
                    { label: 'Caja', icon: 'pi pi-fw pi-inbox', routerLink: ['/caja'] }
                ]
            }
        ];
    }
}