import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, UsuarioResponse } from '../models/seguridad.interface';
import { environment } from '../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // URL de tu Backend (Asegúrate de que coincida con tu puerto de Spring)
  private apiUrl = `${environment.apiUrl}/auth`; 

  private fetchCurrentUser(): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/me`); 
  }

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

  getUser(): UsuarioResponse | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Verificar si el usuario tiene un rol específico (Ej: 'ADMIN')
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.rol === role;
  }

  // Verificar si el usuario tiene AL MENOS UNO de los roles de una lista
  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.rol) : false;
  }

  loginWithGoogle() {
    // Asegúrate de que esta URL apunte a la raíz de tu backend, no a /api
    // Si environment.apiUrl es 'http://localhost:8080/api', ajusta la cadena:
    const backendUrl = environment.apiUrl.replace('/api', ''); 
    window.location.href = `${backendUrl}/oauth2/authorization/google`;
  }

  saveOAuth2Token(token: string): Observable<UsuarioResponse> {
    localStorage.setItem('token', token);
    
    // Retornamos el Observable para que el componente espere a que termine
    return this.fetchCurrentUser().pipe(
      tap(user => {
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

}