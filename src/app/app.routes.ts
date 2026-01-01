import { Routes } from '@angular/router';
import { AppLayout } from './layout/component/app.layout';
import { Listaempresas } from './core/components/listaempresas/listaempresas.component';
import { Listasucursales } from './core/components/listasucursales/listasucursales.component';

export const routes: Routes = [
    {
        path:'',
        component:AppLayout,
        children: [
            {
                path:'empresas', component:Listaempresas,
            },
            {
                path:'sucursales', component:Listasucursales,
            }
        ]
    }
];
