import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
    selector: 'app-request-access',
    standalone: true,
    imports: [ButtonModule, RouterModule, RippleModule],
    styles: [`
        .dashboard-container{min-height:100vh;background:#f8fafc;color:#0f172a;padding:2rem;display:flex;flex-direction:column;gap:1.5rem}
        .dashboard-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:1rem;border-bottom:1px solid #e2e8f0}
        .header-left h1{margin:0;font-size:1.75rem;font-weight:700;color:#1e293b;background:linear-gradient(135deg,#0f172a,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .header-left p{margin:.25rem 0 0;font-size:.875rem;color:#64748b}
        .admin-notice-banner{background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fde68a;border-left:5px solid #d97706;border-radius:12px;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1rem;box-shadow:0 4px 6px -1px rgba(0,0,0,.05)}
        .notice-content{display:flex;align-items:center;gap:1rem;color:#b45309}
        .notice-content i{font-size:1.75rem}
        .notice-text{font-size:.95rem;line-height:1.5}
        .metrics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem}
        .metric-card{background:#fff;border-radius:16px;padding:1.5rem;box-shadow:0 4px 20px rgba(0,0,0,.02);border:1px solid #f1f5f9;display:flex;flex-direction:column;justify-content:space-between;gap:1rem;transition:all .3s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden}
        .metric-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:transparent;transition:background-color .3s}
        .metric-card:hover{transform:translateY(-4px);box-shadow:0 10px 25px -5px rgba(0,0,0,.05)}
        .metric-card:hover::before{background:var(--hover-color,transparent)}
        .metric-header{display:flex;justify-content:space-between;align-items:center}
        .metric-title{font-size:.875rem;font-weight:600;color:#64748b;text-transform:uppercase}
        .metric-icon-wrapper{width:2.5rem;height:2.5rem;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.25rem}
        .metric-body{display:flex;flex-direction:column;gap:.25rem}
        .metric-value{font-size:1.75rem;font-weight:700;color:#0f172a}
        .metric-sub{font-size:.85rem;display:flex;align-items:center;gap:.25rem}
        .trend-up{color:#10b981}
        .trend-down{color:#f43f5e}
        .trend-neutral{color:#64748b}
        .content-grid{display:grid;grid-template-columns:2fr 1fr;gap:1.5rem}
        @media(max-width:991px){.content-grid{grid-template-columns:1fr}}
        .card-panel{background:#fff;border-radius:16px;padding:1.5rem;box-shadow:0 4px 20px rgba(0,0,0,.02);border:1px solid #f1f5f9}
        .panel-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem}
        .panel-title{font-size:1.1rem;font-weight:700;color:#1e293b;margin:0}
        .chart-container{display:flex;flex-direction:column;height:220px;justify-content:flex-end}
        .chart-bars{display:flex;justify-content:space-between;align-items:flex-end;height:100%;gap:.75rem}
        .chart-col{display:flex;flex-direction:column;align-items:center;flex:1;gap:.5rem}
        .chart-bar-wrapper{width:100%;height:100%;display:flex;align-items:flex-end;background:#f1f5f9;border-radius:6px;overflow:hidden}
        .chart-bar-value{width:100%;border-radius:6px;background:linear-gradient(180deg,#3b82f6,#1d4ed8);transition:height 1s ease-out;position:relative;cursor:pointer}
        .chart-bar-value:hover{filter:brightness(1.1)}
        .chart-bar-value::after{content:attr(data-val);position:absolute;top:-25px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;font-size:.75rem;padding:2px 6px;border-radius:4px;opacity:0;transition:opacity .2s;pointer-events:none;white-space:nowrap}
        .chart-bar-value:hover::after{opacity:1}
        .chart-label{font-size:.75rem;color:#64748b;font-weight:500}
        .activity-list{display:flex;flex-direction:column;gap:1.25rem}
        .activity-item{display:flex;gap:1rem;align-items:flex-start}
        .activity-dot{width:8px;height:8px;border-radius:50%;margin-top:6px;flex-shrink:0}
        .activity-info{display:flex;flex-direction:column;gap:.15rem}
        .activity-text{font-size:.875rem;color:#334155;font-weight:500}
        .activity-time{font-size:.75rem;color:#94a3b8}
    `],
    template: `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <div class="header-left">
                    <h1>Heladería Central</h1>
                    <p>Panel de Administración &bull; Vista de Demostración</p>
                </div>
                <div class="header-right">
                    <p-button 
                        label="Cerrar Sesión" 
                        icon="pi pi-sign-out" 
                        routerLink="/auth/login" 
                        severity="secondary" 
                        [text]="true"
                        size="small">
                    </p-button>
                </div>
            </div>

            <!-- Banner de Acceso Limitado -->
            <div class="admin-notice-banner">
                <div class="notice-content">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span class="notice-text">
                        <strong>Modo de Vista Previa:</strong> Estás visualizando datos estáticos de prueba. 
                        Para obtener acceso completo a la edición y funciones del sistema, por favor <strong>contacta con un administrador</strong> para activar tus permisos.
                    </span>
                </div>
            </div>

            <!-- Grid de Tarjetas de Métricas -->
            <div class="metrics-grid">
                <div class="metric-card" style="--hover-color: #0891b2">
                    <div class="metric-header">
                        <span class="metric-title">Ventas de Hoy</span>
                        <div class="metric-icon-wrapper" style="background: #ecfeff; color: #0891b2">
                            <i class="pi pi-shopping-cart"></i>
                        </div>
                    </div>
                    <div class="metric-body">
                        <span class="metric-value">$8,240.00</span>
                        <span class="metric-sub trend-up">
                            <i class="pi pi-arrow-up"></i> +12.5% vs ayer
                        </span>
                    </div>
                </div>

                <div class="metric-card" style="--hover-color: #4f46e5">
                    <div class="metric-header">
                        <span class="metric-title">Pedidos Activos</span>
                        <div class="metric-icon-wrapper" style="background: #e0e7ff; color: #4f46e5">
                            <i class="pi pi-chart-bar"></i>
                        </div>
                    </div>
                    <div class="metric-body">
                        <span class="metric-value">24</span>
                        <span class="metric-sub trend-up">
                            <i class="pi pi-arrow-up"></i> +4 nuevos
                        </span>
                    </div>
                </div>

                <div class="metric-card" style="--hover-color: #db2777">
                    <div class="metric-header">
                        <span class="metric-title">Sabores en Stock</span>
                        <div class="metric-icon-wrapper" style="background: #fdf2f8; color: #db2777">
                            <i class="pi pi-box"></i>
                        </div>
                    </div>
                    <div class="metric-body">
                        <span class="metric-value">32 / 35</span>
                        <span class="metric-sub trend-down">
                            <i class="pi pi-arrow-down"></i> 3 por agotarse
                        </span>
                    </div>
                </div>

                <div class="metric-card" style="--hover-color: #059669">
                    <div class="metric-header">
                        <span class="metric-title">Clientes Nuevos</span>
                        <div class="metric-icon-wrapper" style="background: #d1fae5; color: #059669">
                            <i class="pi pi-users"></i>
                        </div>
                    </div>
                    <div class="metric-body">
                        <span class="metric-value">142</span>
                        <span class="metric-sub trend-neutral">
                            <i class="pi pi-minus"></i> Sin cambios hoy
                        </span>
                    </div>
                </div>
            </div>

            <!-- Grid de Contenido Principal -->
            <div class="content-grid">
                <!-- Panel del Gráfico -->
                <div class="card-panel">
                    <div class="panel-header">
                        <h2 class="panel-title">Ventas Semanales (Estimación)</h2>
                    </div>
                    <div class="chart-container">
                        <div class="chart-bars">
                            <div class="chart-col">
                                <div class="chart-bar-wrapper">
                                    <div class="chart-bar-value" style="height: 45%" data-val="$4,500"></div>
                                </div>
                                <span class="chart-label">Lun</span>
                            </div>
                            <div class="chart-col">
                                <div class="chart-bar-wrapper">
                                    <div class="chart-bar-value" style="height: 60%" data-val="$6,000"></div>
                                </div>
                                <span class="chart-label">Mar</span>
                            </div>
                            <div class="chart-col">
                                <div class="chart-bar-wrapper">
                                    <div class="chart-bar-value" style="height: 75%" data-val="$7,500"></div>
                                </div>
                                <span class="chart-label">Mié</span>
                            </div>
                            <div class="chart-col">
                                <div class="chart-bar-wrapper">
                                    <div class="chart-bar-value" style="height: 50%" data-val="$5,000"></div>
                                </div>
                                <span class="chart-label">Jue</span>
                            </div>
                            <div class="chart-col">
                                <div class="chart-bar-wrapper">
                                    <div class="chart-bar-value" style="height: 85%" data-val="$8,500"></div>
                                </div>
                                <span class="chart-label">Vie</span>
                            </div>
                            <div class="chart-col">
                                <div class="chart-bar-wrapper">
                                    <div class="chart-bar-value" style="height: 95%" data-val="$9,500"></div>
                                </div>
                                <span class="chart-label">Sáb</span>
                            </div>
                            <div class="chart-col">
                                <div class="chart-bar-wrapper">
                                    <div class="chart-bar-value" style="height: 80%" data-val="$8,000"></div>
                                </div>
                                <span class="chart-label">Dom</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Panel de Actividad -->
                <div class="card-panel">
                    <div class="panel-header">
                        <h2 class="panel-title">Actividad Reciente</h2>
                    </div>
                    <div class="activity-list">
                        <div class="activity-item">
                            <div class="activity-dot" style="background: #10b981"></div>
                            <div class="activity-info">
                                <span class="activity-text">Pedido #2408 completado</span>
                                <span class="activity-time">Hace 10 mins</span>
                            </div>
                        </div>
                        <div class="activity-item">
                            <div class="activity-dot" style="background: #3b82f6"></div>
                            <div class="activity-info">
                                <span class="activity-text">Sabor "Maracuyá" agregado al menú</span>
                                <span class="activity-time">Hace 1 hora</span>
                            </div>
                        </div>
                        <div class="activity-item">
                            <div class="activity-dot" style="background: #f59e0b"></div>
                            <div class="activity-info">
                                <span class="activity-text">Stock bajo en sabor "Fresa"</span>
                                <span class="activity-time">Hace 3 horas</span>
                            </div>
                        </div>
                        <div class="activity-item">
                            <div class="activity-dot" style="background: #ef4444"></div>
                            <div class="activity-info">
                                <span class="activity-text">Intento de acceso denegado (API)</span>
                                <span class="activity-time">Hace 5 horas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class RequestAccessComponent {}