import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../../services/auth.service'; // Ajusta la ruta a tu service

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Usamos el método isLoggedIn() que creamos en el AuthService
  if (authService.isLoggedIn()) {
    return true; // ¡Pase usted!
  } else {
    // No tienes token, vas para afuera
    router.navigate(['/auth/login']);
    return false;
  }
};