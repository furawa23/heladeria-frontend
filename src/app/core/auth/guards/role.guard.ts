import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['roles'] as Array<string>;

  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }

  // --- NUEVA VALIDACIÓN PARA USUARIOS DE GOOGLE SIN CONFIGURAR ---
  const user = authService.getUser();
  // NOTA: Usa los mismos nombres de campos que usaste en el redirect
  if (user && user.rol !== 'SUPERADMIN' && (!user.idEmpresa || !user.idSucursal)) {
    router.navigate(['/auth/solicitar']);
    return false;
  }
  // ---------------------------------------------------------------

  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  if (authService.hasAnyRole(expectedRoles)) {
    return true; 
  }

  console.warn('Acceso denegado: No tienes permiso para ver esta página.');
  router.navigate(['/auth/prohibido']); 
  return false;
};