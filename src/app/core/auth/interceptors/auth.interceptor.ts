import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // 1. Obtener el token del almacenamiento
  const token = localStorage.getItem('token');

  let authReq = req;

  // 2. Si existe el token, clonar la petición y agregar el Header
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // 3. Pasar la petición y manejar errores globales (ej: token vencido)
  return next(authReq).pipe(
    catchError((err) => {
      // Si el backend dice "No autorizado" (401) o "Prohibido" (403)
      if (err.status === 401 || err.status === 403) {
        // Borramos basura local y mandamos al login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/auth/login']);
      }
      return throwError(() => err);
    })
  );
};