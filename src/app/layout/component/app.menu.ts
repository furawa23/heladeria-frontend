import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

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

    ngOnInit() {
        this.model = [
            {
                label: 'Inicio',
                items: [
                    // Apunta a la ruta raíz que en tu app.routes.ts redirige a 'empresas'
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }
                ]
            },
            {
                label: 'Seguridad',
                items: [
                    { label: 'Empresas', icon: 'pi pi-fw pi-building', routerLink: ['/empresas'] },
                    { label: 'Sucursales', icon: 'pi pi-fw pi-sitemap', routerLink: ['/sucursales'] },
                    { label: 'Usuarios', icon: 'pi pi-fw pi-users', routerLink: ['/usuarios'] }
                ]
            },
            {
                label: 'Almacén',
                items: [
                    { label: 'Categorías', icon: 'pi pi-fw pi-tags', routerLink: ['/categorias'] },
                    { label: 'Productos', icon: 'pi pi-fw pi-box', routerLink: ['/productos'] },
                    { label: 'Mesas', icon: 'pi pi-fw pi-table', routerLink: ['/mesas'] }
                ]
            },
            {
                label: 'Compras',
                items: [
                    { label: 'Proveedores', icon: 'pi pi-fw pi-truck', routerLink: ['/proveedores'] },
                    { label: 'Compras', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/compras'] }
                ]
            },
            {
                label: 'Ventas',
                items: [
                    { label: 'Ventas', icon: 'pi pi-fw pi-wallet', routerLink: ['/ventas'] },
                    { label: 'Caja', icon: 'pi pi-fw pi-inbox', routerLink: ['/caja'] }
                ]
            },
            {
                label: 'Sesión',
                items: [
                    { label: 'Cerrar Sesión', icon: 'pi pi-fw pi-sign-out', routerLink: ['/auth/login'] }
                ]
            }
        ];
    }
}