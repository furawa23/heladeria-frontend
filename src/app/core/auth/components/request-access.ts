import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
    selector: 'app-request-access',
    standalone: true,
    imports: [ButtonModule, RouterModule, RippleModule],
    styles: [`
        .request-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: #f8f9fa;
            padding: 2rem;
            font-family: var(--font-family, sans-serif);
        }
        .request-card {
            background: #ffffff;
            border-radius: 2rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
            padding: 2.5rem 2rem;
            max-width: 480px;
            width: 100%;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.25rem;
        }
        .icon-wrapper {
            background: #e0f2fe; /* Azul claro */
            color: #0284c7;      /* Azul informativo */
            width: 4.5rem;
            height: 4.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.25rem;
            margin-bottom: 0.5rem;
            border: 4px solid #bae6fd;
        }
        .title {
            margin: 0;
            font-size: 2rem;
            color: #1e293b;
            font-weight: 700;
        }
        .subtitle {
            color: #64748b;
            margin: 0;
            line-height: 1.6;
            font-size: 1.05rem;
        }
        .illustration {
            width: 100%;
            max-width: 260px;
            margin: 1rem 0;
        }
    `],
    template: `
        <div class="request-container">
            <div class="request-card">
                
                <div class="icon-wrapper">
                    <i class="pi pi-user-plus"></i>
                </div>
                
                <h1 class="title">Cuenta Registrada</h1>
                <p class="subtitle">
                    Tu usuario de Google se ha registrado correctamente en el sistema.<br>
                    <strong>Tu acceso está pendiente de activación.</strong><br>
                    Por favor, solicita a un administrador que te asigne tus permisos correspondientes.
                </p>

                <img 
                    src="https://primefaces.org/cdn/templates/sakai/pages/asset-features.svg" 
                    alt="Ilustración de cuenta en espera" 
                    class="illustration" 
                />

                <p-button 
                    label="Regresar al Login" 
                    icon="pi pi-arrow-left" 
                    routerLink="/auth/login" 
                    severity="info" 
                    size="large"
                    [rounded]="true">
                </p-button>

            </div>
        </div>
    `
})
export class RequestAccessComponent {}