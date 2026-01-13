import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse } from '../models/models.interface';
import { environment } from '../enviroment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // URL de tu Backend (Asegúrate de que coincida con tu puerto de Spring)
  private apiUrl = `${environment.apiUrl}/auth`; 

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        // Guardamos el token y el usuario en el navegador
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.usuario));
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/auth/login']); // Ajusta la ruta a tu login
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}