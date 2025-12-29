import { Routes } from '@angular/router';
import { AppLayout } from './layout/component/app.layout';
import { Listaempresas } from './core/components/listaempresas/listaempresas.component';

export const routes: Routes = [
    {
        path:'',
        component:AppLayout,
        children: [
            {
                path:'', component:Listaempresas,
            }
        ]
    }
];
