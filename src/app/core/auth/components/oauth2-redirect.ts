import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  template: `
    <div class="flex justify-content-center align-items-center h-screen">
      <h3>Autenticando con Google...</h3>
    </div>
  `
})
export class Oauth2RedirectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const error = params['error'];

      if (token) {
        // Nos suscribimos y esperamos a que el usuario se guarde en localStorage
// Dentro de tu ngOnInit()
this.authService.saveOAuth2Token(token).subscribe({
  next: (user) => {
    
    // CORRECCIÓN AQUÍ: Usamos idEmpresa e idSucursal, y excluimos al SUPERADMIN
    if (user.rol !== 'SUPERADMIN' && (!user.idEmpresa || !user.idSucursal)) {
      this.router.navigate(['/auth/solicitar']);
    } else {
      // Si tiene todo correcto (o es Superadmin), va a la raíz
      this.router.navigate(['/']);
    }
    
  },
  error: (err) => {
    console.error('Error obteniendo datos del usuario de Google', err);
    this.router.navigate(['/auth/login'], { 
      queryParams: { error: 'fetch_user_failed' } 
    });
  }
});
      } else {
        this.router.navigate(['/auth/login'], { 
          queryParams: { error: error || 'google_auth_failed' } 
        });
      }
    });
  }
}