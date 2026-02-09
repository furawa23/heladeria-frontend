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

export const routes: Routes = [
    // 1. RUTA PÚBLICA (Login)
    // Está fuera del AppLayout para que se vea en pantalla completa
    {
        path: 'auth/login',
        component: Login
    },

    // 2. RUTAS PRIVADAS (Protegidas por el Guard)
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard], // <--- AQUÍ ESTÁ EL CANDADO
        children: [
            // Redirigir '' a 'empresas' (o dashboard) por defecto
            { path: '', redirectTo: 'empresas', pathMatch: 'full' }, 
            
            {
                path: 'empresas', 
                component: Listaempresas,
            },
            {
                path: 'sucursales', 
                component: Listasucursales,
            },
            {
                path: 'usuarios', 
                component: Listausuarios,
            },
            {
                path: 'categorias', 
                component: ListaCategoriasProducto,
            },
            {
                path: 'productos',
                component: ListaProductos,
            },
            {
                path: 'proveedores',
                component: ListaProveedores,
            },
            {
                path: 'compras',
                component: ListaCompras,
            }
        ]
    },

    // 3. Cualquier ruta desconocida -> Login
    { path: '**', redirectTo: 'auth/login' }
];