import { Routes } from '@angular/router';
import { AppLayout } from './layout/component/app.layout';
import { Listaempresas } from './core/components/listaempresas/listaempresas.component';
import { Listasucursales } from './core/components/listasucursales/listasucursales.component';
import { Login } from './core/auth/components/login/login.component'; // Importa tu componente Login
import { authGuard } from './core/auth/guards/auth.guard'; // Importa el Guard
import { Listausuarios } from './core/components/listausuarios/listausuarios.component';

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
            }
        ]
    },

    // 3. Cualquier ruta desconocida -> Login
    { path: '**', redirectTo: 'auth/login' }
];