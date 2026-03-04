import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // 1. Obtener los datos del almacenamiento
  const token = localStorage.getItem('token');
  const sucursalActiva = localStorage.getItem('sucursalActiva'); // <-- NUEVO

  let authReq = req;
  let headersConfig: any = {}; // Objeto dinámico para guardar todos los headers

  // 2. Si existe el token, lo preparamos
  if (token) {
    headersConfig['Authorization'] = `Bearer ${token}`;
  }

  // 3. Si existe una sucursal activa (el Dueño la seleccionó), la preparamos
  if (sucursalActiva) {
    headersConfig['X-Sucursal-Id'] = sucursalActiva;
  }

  // 4. Si hay algún header configurado, clonamos la petición y se los asignamos
  if (Object.keys(headersConfig).length > 0) {
    authReq = req.clone({
      setHeaders: headersConfig
    });
  }

  // 5. Pasar la petición y manejar errores globales
  return next(authReq).pipe(
    catchError((err) => {
      if (err.status === 401 || err.status === 403) {
        // Borramos basura local y mandamos al login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('sucursalActiva'); // <-- Importante limpiarlo también
        router.navigate(['/auth/login']);
      }
      return throwError(() => err);
    })
  );
};