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
    // Leer los parámetros de la URL enviados por el OAuth2SuccessHandler
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const error = params['error'];

      if (token) {
        // Guardar token y redirigir al dashboard
        this.authService.saveOAuth2Token(token);
        this.router.navigate(['/']);
      } else {
        // Si hay error (ej. el usuario canceló o el email no existe en la BD)
        this.router.navigate(['/auth/login'], { 
          queryParams: { error: error || 'google_auth_failed' } 
        });
      }
    });
  }
}