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

      if (token) {
        // FORZAMOS EL COMPORTAMIENTO ANTIGUO
        localStorage.setItem('token', token);
        this.router.navigate(['/']);
      } else {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}