import { Routes } from '@angular/router';
import { AppLayout } from './layout/component/app.layout';
import { Listaempresas } from './core/components/seguridad/listaempresas/listaempresas.component';
import { Listasucursales } from './core/components/seguridad/listasucursales/listasucursales.component';
import { Login } from './core/auth/components/login/login.component'; // Importa tu componente Login
import { authGuard } from './core/auth/guards/auth.guard'; // Importa el Guard
import { Listausuarios } from './core/components/seguridad/listausuarios/listausuarios.component';
import { ListaCategoriasProducto } from './core/components/almacen/listacategoriasproducto/listacategoriasproducto.component';
import { ListaProductos } from './core/components/almacen/listaproductos/listaproductos.component';
import { ListaProveedores } from './core/components/compra/listaproveedores/listaproveedores.component';
import { ListaCompras } from './core/components/compra/listacompras/listacompras.component';
import { ListaMesas } from './core/components/venta/listamesas/listamesas.component';
import { ListaVentas } from './core/components/venta/listaventas/listaventas.component';
import { CajaComponent } from './core/components/caja/caja.component';
import { roleGuard } from './core/auth/guards/role.guard';
import { Access } from './core/auth/components/access';
import { ListaSabores } from './core/components/sabor/listasabores/listasabores.component';

export const routes: Routes = [
    // 1. RUTA PÚBLICA (Login)
    // Está fuera del AppLayout para que se vea en pantalla completa
    {
        path: 'auth/login',
        component: Login
    },
    {
        path: 'auth/prohibido',
        component: Access
    },

    // 2. RUTAS PRIVADAS (Protegidas por el Guard)
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard], // <--- AQUÍ ESTÁ EL CANDADO
        children: [
            // Redirigir '' a 'empresas' (o dashboard) por defecto
            { path: '', redirectTo: 'productos', pathMatch: 'full' },

            {
                path: 'empresas', 
                component: Listaempresas,
                canActivate: [roleGuard],
                data: { roles: ['SUPERADMIN'] }
            },
            {
                path: 'sucursales', 
                component: Listasucursales,
                canActivate: [roleGuard],
                data: { roles: ['SUPERADMIN', 'DUENO'] }
            },
            {
                path: 'usuarios', 
                component: Listausuarios,
                canActivate: [roleGuard],
                data: { roles: ['SUPERADMIN', 'DUENO'] }
            },
            {
                path: 'categorias', 
                component: ListaCategoriasProducto,
                canActivate: [roleGuard],
                data: { roles: ['DUENO'] }
            },
            {
                path: 'productos',
                component: ListaProductos,
                canActivate: [roleGuard],
                data: { roles: ['DUENO', 'EMPLEADO'] }
            },            {
                path: 'sabores',
                component: ListaSabores,
                canActivate: [roleGuard],
                data: { roles: ['DUENO', 'EMPLEADO'] }
            },
            {
                path: 'proveedores',
                component: ListaProveedores,
                canActivate: [roleGuard],
                data: { roles: ['DUENO'] }
            },
            {
                path: 'compras',
                component: ListaCompras,
                canActivate: [roleGuard],
                data: { roles: ['DUENO', 'EMPLEADO'] }
            },
            {
                path: 'mesas',
                component: ListaMesas,
                canActivate: [roleGuard],
                data: { roles: ['DUENO'] }
            },
            {
                path: 'ventas',
                component: ListaVentas,
                canActivate: [roleGuard],
                data: { roles: ['DUENO', 'EMPLEADO'] }
            },
            {
                path: 'caja',
                component: CajaComponent,
                canActivate: [roleGuard],
                data: { roles: ['DUENO', 'EMPLEADO'] }
            }
        ]
    },

    // 3. Cualquier ruta desconocida -> Login
    { path: '**', redirectTo: 'auth/login' }
];