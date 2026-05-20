import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
    selector: 'app-access',
    standalone: true,
    imports: [ButtonModule, RouterModule, RippleModule],
    styles: [`
        .access-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: #f8f9fa; /* Fondo claro */
            padding: 2rem;
            font-family: var(--font-family, sans-serif);
        }
        .access-card {
            background: #ffffff;
            border-radius: 2rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
            padding: 2rem 2rem;
            max-width: 480px;
            width: 100%;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.25rem;
        }
        .icon-wrapper {
            background: #fff3e0;
            color: #f97316;
            width: 4.5rem;
            height: 4.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.25rem;
            margin-bottom: 0.5rem;
            border: 4px solid #ffedd5;
        }
        .title {
            margin: 0;
            font-size: 2.25rem;
            color: #1e293b;
            font-weight: 700;
        }
        .subtitle {
            color: #64748b;
            margin: 0;
            line-height: 1.5;
            font-size: 1.1rem;
        }
        .illustration {
            width: 100%;
            max-width: 280px;
            margin: 1.5rem 0;
        }
    `],
    template: `
        <div class="access-container">
            <div class="access-card">
                
                <div class="icon-wrapper">
                    <i class="pi pi-lock"></i>
                </div>
                
                <h1 class="title">Acceso Denegado</h1>
                <p class="subtitle">
                    No tienes los permisos necesarios para ver esta página.<br>
                    Por favor, contacta a un administrador.
                </p>

                <img 
                    src="https://primefaces.org/cdn/templates/sakai/auth/asset-access.svg" 
                    alt="Ilustración de acceso denegado" 
                    class="illustration" 
                />

                <p-button 
                    label="Volver" 
                    icon="pi pi-home" 
                    routerLink="/" 
                    severity="warn" 
                    size="large"
                    [rounded]="true">
                </p-button>

            </div>
        </div>
    `
})
export class Access {}