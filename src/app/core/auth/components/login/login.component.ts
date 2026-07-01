import { Component, inject, OnInit } from '@angular/core'; // Agrega inject
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { MessageService } from 'primeng/api';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
    selector: 'app-login',
    standalone: true,
    // Agregamos ToastModule para mensajes de error
    imports: [SharedModule], 
    providers: [MessageService], // Proveedor local para alertas
    templateUrl: './login.component.html',
    styleUrl:'./login.component.scss'
})
export class Login implements OnInit {
    // Inyecciones
    private authService = inject(AuthService);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private route = inject(ActivatedRoute);

    // Variables
    username: string = ''; // Cambié email por username
    password: string = '';
    checked: boolean = false;
    isLoading: boolean = false; // Para efecto visual en el botón

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            const error = params['error'];
            if (error) {
                let detail = 'Error al iniciar sesión';
                if (error === 'active_session') {
                    detail = 'Ya existe una sesión activa para este usuario en otro dispositivo/ventana.';
                } else if (error === 'fetch_user_failed') {
                    detail = 'No se pudieron obtener los datos de la cuenta.';
                } else if (error === 'google_auth_failed') {
                    detail = 'Error de autenticación con Google.';
                }
                setTimeout(() => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: detail
                    });
                }, 100);
            }
        });
    }

    onGoogleLogin() {
        this.isLoading = true;
        this.authService.loginWithGoogle();
    }
    
    onLogin() {
        if (!this.username || !this.password) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Ingresa usuario y contraseña' });
            return;
        }

        this.isLoading = true;

        this.authService.login(this.username, this.password).subscribe({
            next: (resp) => {
                this.isLoading = false;
                
                // REDIRECCIÓN DINÁMICA SEGÚN EL ROL
                const userRole = resp.usuario?.rol; // Asegúrate de que coincida con cómo viene en tu interfaz

                if (userRole === 'SUPERADMIN') {
                    this.router.navigate(['/empresas']);
                } else {
                    this.router.navigate(['/']); // Empleados y dueños van a la raíz (productos)
                }
            },
            error: (err) => {
                this.isLoading = false;
                let errorMessage = 'Credenciales incorrectas o servidor no disponible';
                if (err.status === 409) {
                    errorMessage = err.error?.message || 'Ya existe una sesión activa para este usuario en otro dispositivo.';
                } else if (err.error?.message) {
                    errorMessage = err.error.message;
                }
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: errorMessage 
                });
                console.error(err);
            }
        });
    }
}