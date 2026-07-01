import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { DashboardService, DashboardData } from '../../../services/dashboard.service';
import { AuthService } from '../../../services/auth.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SharedModule],
  providers: [DashboardService, MessageService],
  template: `
    <div class="grid">
        <div class="col-12">
            <p-toast></p-toast>
            
            <!-- Alerta de Seleccione Sucursal -->
            <div class="card flex flex-column align-items-center justify-content-center py-8 shadow-2" *ngIf="faltaSucursal">
                <i class="pi pi-store text-primary mb-4" style="font-size: 5rem;"></i>
                <h4 class="text-center font-bold text-2xl mb-2">Seleccione una Sucursal</h4>
                <p class="text-center text-600 mb-0 max-w-28rem">
                    Para visualizar el reporte y métricas del dashboard, por favor seleccione una sucursal en la barra superior (menú desplegable).
                </p>
            </div>

            <ng-container *ngIf="!faltaSucursal">
                <!-- Título del Dashboard -->
                <div class="card p-4 mb-4 flex justify-content-between align-items-center border-round surface-card shadow-1">
                    <div>
                        <h3 class="m-0 font-bold text-2xl text-900">Dashboard Comercial</h3>
                        <p class="m-0 text-500 mt-1">Resumen de ventas y rendimiento en los últimos 30 días</p>
                    </div>
                    <div class="flex gap-2">
                        <button pButton pRipple label="Exportar PDF" icon="pi pi-file-pdf" class="p-button-danger" (click)="openPdfDialog()"></button>
                        <button pButton pRipple icon="pi pi-refresh" class="p-button-outlined p-button-secondary" (click)="cargarDatos()" [loading]="cargando" pTooltip="Actualizar datos" tooltipPosition="left"></button>
                    </div>
                </div>

                <!-- Fila de KPI Cards -->
                <div class="grid mb-4">
                    <!-- Ventas Totales -->
                    <div class="col-12 md:col-4">
                        <div class="card flex justify-content-between p-4 border-round surface-card shadow-1 hover:shadow-2 transition-all transition-duration-200">
                            <div>
                                <span class="block text-500 font-medium mb-3">Ingresos Totales</span>
                                <div class="text-900 font-bold text-2xl">{{ (dashboardData?.totalVentas || 0) | currency:'PEN':'S/ ' }}</div>
                            </div>
                            <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width: 3rem; height: 3rem">
                                <i class="pi pi-dollar text-blue-600 text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Cantidad de Ventas -->
                    <div class="col-12 md:col-4">
                        <div class="card flex justify-content-between p-4 border-round surface-card shadow-1 hover:shadow-2 transition-all transition-duration-200">
                            <div>
                                <span class="block text-500 font-medium mb-3">Ventas Realizadas</span>
                                <div class="text-900 font-bold text-2xl">{{ dashboardData?.cantidadVentas || 0 }} transacciones</div>
                            </div>
                            <div class="flex align-items-center justify-content-center bg-green-100 border-round" style="width: 3rem; height: 3rem">
                                <i class="pi pi-shopping-cart text-green-600 text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Ticket Promedio -->
                    <div class="col-12 md:col-4">
                        <div class="card flex justify-content-between p-4 border-round surface-card shadow-1 hover:shadow-2 transition-all transition-duration-200">
                            <div>
                                <span class="block text-500 font-medium mb-3">Ticket Promedio</span>
                                <div class="text-900 font-bold text-2xl">{{ (dashboardData?.ticketPromedio || 0) | currency:'PEN':'S/ ' }}</div>
                            </div>
                            <div class="flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 3rem; height: 3rem">
                                <i class="pi pi-bolt text-purple-600 text-2xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Gráfico de Ventas Diarias -->
                <div class="card p-5 mb-4 border-round surface-card shadow-1">
                    <h5 class="font-bold text-lg text-900 mb-4">Evolución de Ventas (Últimos 30 días)</h5>
                    
                    <div class="flex align-items-end justify-content-between h-16rem pt-4 border-bottom-1 border-300 relative" style="overflow: visible;">
                        <!-- Columnas del Gráfico de Barras -->
                        <div *ngFor="let dia of getDiasConVentas()" class="flex flex-column align-items-center flex-1 mx-1 cursor-pointer relative bar-container" style="height: 100%; justify-content: flex-end;">
                            <!-- Tooltip customizado -->
                            <div class="tooltip bg-900 text-0 text-xs px-2 py-1 border-round absolute z-5 shadow-2 text-center" style="bottom: 105%; white-space: nowrap; display: none; transform: translateY(-5px);">
                                {{ dia.total | currency:'PEN':'S/ ' }}
                            </div>
                            <!-- Barra de porcentaje de altura -->
                            <div class="w-full bg-blue-500 hover:bg-blue-600 border-round-top transition-all transition-duration-200" 
                                 [style.height.%]="getBarHeight(dia.total)"
                                 (mouseenter)="showTooltip($event)"
                                 (mouseleave)="hideTooltip($event)">
                            </div>
                            <span class="text-xs text-500 mt-2 block" style="font-size: 0.65rem; transform: rotate(-45deg) translate(-5px, 2px); white-space: nowrap; width: 0;">
                                {{ formatLabelDate(dia.fecha) }}
                            </span>
                        </div>
                    </div>
                    <!-- Separador espacial inferior por el giro de los labels -->
                    <div class="py-3"></div>
                </div>

                <!-- Grilla inferior (Top Productos y Ventas por Mesa) -->
                <div class="grid">
                    <!-- Top 5 Productos -->
                    <div class="col-12 md:col-6">
                        <div class="card p-5 border-round surface-card shadow-1 h-full">
                            <h5 class="font-bold text-lg text-900 mb-4"><i class="pi pi-star text-yellow-500 mr-2 text-xl"></i>Top 5 Productos Estrella</h5>
                            
                            <div *ngIf="!dashboardData?.productosMasVendidos?.length" class="text-500 text-center py-5">
                                No hay datos de ventas registrados
                            </div>
                            
                            <div *ngFor="let prod of dashboardData?.productosMasVendidos; let idx = index" class="mb-4">
                                <div class="flex justify-content-between align-items-center mb-2">
                                    <span class="font-medium text-800">{{ idx + 1 }}. {{ prod.producto }}</span>
                                    <span class="font-bold text-900">{{ prod.cantidad }} und.</span>
                                </div>
                                <div class="w-full bg-100 border-round" style="height: 8px">
                                    <div class="bg-blue-500 border-round" style="height: 8px" [style.width.%]="getProductPercent(prod.cantidad)"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Ventas por Mesa -->
                    <div class="col-12 md:col-6">
                        <div class="card p-5 border-round surface-card shadow-1 h-full">
                            <h5 class="font-bold text-lg text-900 mb-4"><i class="pi pi-table text-primary mr-2 text-xl"></i>Ventas por Mesa / Canal</h5>
                            
                            <div *ngIf="!dashboardData?.ventasPorMesa?.length" class="text-500 text-center py-5">
                                No hay datos de ventas registrados
                            </div>
                            
                            <div *ngFor="let mesa of dashboardData?.ventasPorMesa" class="mb-4">
                                <div class="flex justify-content-between align-items-center mb-2">
                                    <span class="font-medium text-800">{{ mesa.mesa }}</span>
                                    <span class="font-bold text-900">{{ mesa.total | currency:'PEN':'S/ ' }}</span>
                                </div>
                                <div class="w-full bg-100 border-round" style="height: 8px">
                                    <div class="bg-green-500 border-round" style="height: 8px" [style.width.%]="getMesaPercent(mesa.total)"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dialog para Exportación de PDF con Firma -->
                <p-dialog [(visible)]="pdfDialog" [modal]="true" [style]="{width: '450px'}" header="Exportar Reporte PDF" styleClass="p-fluid">
                    <ng-template pTemplate="content">
                        <!-- Switch Firmar -->
                        <div class="field-checkbox mb-4 flex align-items-center">
                            <p-checkbox [(ngModel)]="firmarPdf" [binary]="true" inputId="firmarPdf"></p-checkbox>
                            <label for="firmarPdf" class="font-bold ml-2 cursor-pointer select-none">¿Firmar digitalmente el PDF?</label>
                        </div>

                        <div *ngIf="firmarPdf">
                            <!-- Switch Tipo Firma -->
                            <div class="field mb-3">
                                <label class="font-bold mb-2 block text-sm">Tipo de Certificado</label>
                                <div class="flex flex-column gap-2">
                                    <div class="field-radiobutton flex align-items-center">
                                        <p-radioButton name="certType" value="self" [(ngModel)]="tipoCertificado" inputId="certSelf"></p-radioButton>
                                        <label for="certSelf" class="ml-2 cursor-pointer select-none">Auto-generado (Sistema)</label>
                                    </div>
                                    <div class="field-radiobutton flex align-items-center">
                                        <p-radioButton name="certType" value="custom" [(ngModel)]="tipoCertificado" inputId="certCustom"></p-radioButton>
                                        <label for="certCustom" class="ml-2 cursor-pointer select-none">Certificado Oficial (.p12 / .pfx)</label>
                                    </div>
                                </div>
                            </div>

                            <!-- Datos del Firmante -->
                            <div class="field mb-3">
                                <label for="signerName" class="font-bold mb-1 block text-sm">Nombre del Firmante</label>
                                <input pInputText id="signerName" [(ngModel)]="signerName" placeholder="Ej: Juan Pérez" class="w-full" />
                            </div>
                            <div class="field mb-3">
                                <label for="reason" class="font-bold mb-1 block text-sm">Motivo de la Firma</label>
                                <input pInputText id="reason" [(ngModel)]="reason" placeholder="Ej: Aprobación del reporte diario" class="w-full" />
                            </div>
                            <div class="field mb-3">
                                <label for="location" class="font-bold mb-1 block text-sm">Ubicación</label>
                                <input pInputText id="location" [(ngModel)]="location" placeholder="Ej: Lima, Perú" class="w-full" />
                            </div>

                            <!-- Cargar archivo si es custom -->
                            <div class="field mb-3" *ngIf="tipoCertificado === 'custom'">
                                <label for="p12File" class="font-bold mb-1 block text-sm">Archivo del Certificado (.p12 / .pfx)</label>
                                <input type="file" id="p12File" (change)="onFileChange($event)" accept=".p12,.pfx" class="p-inputtext p-component w-full" />
                            </div>
                            <div class="field mb-3" *ngIf="tipoCertificado === 'custom'">
                                <label for="p12Password" class="font-bold mb-1 block text-sm">Contraseña del Certificado</label>
                                <input pInputText type="password" id="p12Password" [(ngModel)]="p12Password" placeholder="Contraseña de la llave privada" class="w-full" />
                            </div>
                        </div>
                    </ng-template>

                    <ng-template pTemplate="footer">
                        <button pButton pRipple label="Cancelar" icon="pi pi-times" class="p-button-text p-button-secondary" (click)="closePdfDialog()"></button>
                        <button pButton pRipple label="Generar PDF" icon="pi pi-check" class="p-button-danger" [loading]="exportando" (click)="generarPdf()"></button>
                    </ng-template>
                </p-dialog>
            </ng-container>
        </div>
    </div>
  `,
  styles: [`
    .bar-container:hover .tooltip {
        display: block !important;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  faltaSucursal: boolean = false;
  cargando: boolean = false;
  dashboardData: DashboardData | null = null;

  // PDF Export and Signature Properties
  pdfDialog: boolean = false;
  exportando: boolean = false;
  firmarPdf: boolean = false;
  tipoCertificado: 'self' | 'custom' = 'self';
  signerName: string = '';
  reason: string = '';
  location: string = '';
  p12File: File | null = null;
  p12Password: string = '';

  ngOnInit(): void {
    this.verificarSucursal();
    if (!this.faltaSucursal) {
        this.cargarDatos();
    }
  }

  verificarSucursal() {
    const user = this.authService.getUser();
    const sucursalTemporal = localStorage.getItem('sucursalActiva');
    this.faltaSucursal = !user?.idSucursal && !sucursalTemporal;
  }

  cargarDatos() {
    this.verificarSucursal();
    if (this.faltaSucursal) return;

    this.cargando = true;
    this.dashboardService.getResumen().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los datos del dashboard'
        });
        console.error(err);
      }
    });
  }

  getDiasConVentas() {
    return this.dashboardData?.ventasPorDia || [];
  }

  getBarHeight(total: number): number {
    if (!this.dashboardData?.ventasPorDia?.length) return 0;
    const maxVal = Math.max(...this.dashboardData.ventasPorDia.map(d => d.total), 1);
    const percent = (total / maxVal) * 100;
    return percent > 0 ? Math.max(percent, 4) : 0;
  }

  formatLabelDate(fechaStr: string): string {
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return fechaStr;
  }

  getProductPercent(cantidad: number): number {
    if (!this.dashboardData?.productosMasVendidos?.length) return 0;
    const maxVal = Math.max(...this.dashboardData.productosMasVendidos.map(p => p.cantidad), 1);
    return (cantidad / maxVal) * 100;
  }

  getMesaPercent(total: number): number {
    if (!this.dashboardData?.ventasPorMesa?.length) return 0;
    const maxVal = Math.max(...this.dashboardData.ventasPorMesa.map(m => m.total), 1);
    return (total / maxVal) * 100;
  }

  showTooltip(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const tooltip = target.parentElement?.querySelector('.tooltip') as HTMLElement;
    if (tooltip) {
      tooltip.style.display = 'block';
    }
  }

  hideTooltip(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const tooltip = target.parentElement?.querySelector('.tooltip') as HTMLElement;
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  openPdfDialog() {
    this.pdfDialog = true;
    this.firmarPdf = false;
    this.tipoCertificado = 'self';
    const user = this.authService.getUser();
    this.signerName = user ? user.username : '';
    this.reason = 'Aprobación del reporte de ventas';
    this.location = 'Lima, Perú';
    this.p12File = null;
    this.p12Password = '';
  }

  closePdfDialog() {
    this.pdfDialog = false;
  }

  onFileChange(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.p12File = files[0];
    } else {
      this.p12File = null;
    }
  }

  generarPdf() {
    this.exportando = true;
    const formData = new FormData();
    formData.append('sign', this.firmarPdf ? 'true' : 'false');
    formData.append('selfSigned', this.tipoCertificado === 'self' ? 'true' : 'false');
    formData.append('signerName', this.signerName);
    formData.append('reason', this.reason);
    formData.append('location', this.location);

    if (this.firmarPdf && this.tipoCertificado === 'custom') {
      if (!this.p12File) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Atención',
          detail: 'Por favor, cargue un archivo de certificado (.p12 / .pfx)'
        });
        this.exportando = false;
        return;
      }
      formData.append('file', this.p12File);
      formData.append('password', this.p12Password);
    }

    this.dashboardService.exportarPdf(formData).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-ventas-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.exportando = false;
        this.pdfDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'PDF generado y descargado correctamente'
        });
      },
      error: (err) => {
        this.exportando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error al generar el PDF'
        });
        console.error(err);
      }
    });
  }
}
