import { Component, inject } from '@angular/core'; // Agrega inject
import { Router } from '@angular/router';
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
export class Login {
    // Inyecciones
    private authService = inject(AuthService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    // Variables
    username: string = ''; // Cambié email por username
    password: string = '';
    checked: boolean = false;
    isLoading: boolean = false; // Para efecto visual en el botón

    onLogin() {
        if (!this.username || !this.password) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Ingresa usuario y contraseña' });
            return;
        }

        this.isLoading = true;

        this.authService.login(this.username, this.password).subscribe({
            next: (resp) => {
                this.isLoading = false;
                // Si el login es exitoso, redirigimos al dashboard (ruta raíz)
                this.router.navigate(['/']); 
            },
            error: (err) => {
                this.isLoading = false;
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: 'Credenciales incorrectas o servidor no disponible' 
                });
                console.error('Login error:', err);
            }
        });
    }
}