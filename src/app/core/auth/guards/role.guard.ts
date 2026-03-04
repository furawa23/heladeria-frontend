import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service'; // Ajusta la ruta a tu auth.service.ts

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Obtenemos los roles permitidos desde la configuración de la ruta
  const expectedRoles = route.data['roles'] as Array<string>;

  // 2. Si ni siquiera está logueado, pa' fuera
  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }

  // 3. Si la ruta no tiene roles configurados, la dejamos pasar (por defecto)
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  // 4. Verificamos si el usuario tiene al menos uno de los roles permitidos
  if (authService.hasAnyRole(expectedRoles)) {
    return true; // ¡Adelante!
  }

  // 5. Si está logueado pero NO tiene el rol, lo mandamos a una ruta segura
  // Puedes mandarlo a '/' (que redirige a empresas) o a una página de "Acceso Denegado"
  console.warn('Acceso denegado: No tienes permiso para ver esta página.');
  router.navigate(['/auth/prohibido']); 
  return false;
};