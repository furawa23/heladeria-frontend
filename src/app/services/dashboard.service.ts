import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/enviroment';

export interface DashboardData {
  totalVentas: number;
  cantidadVentas: number;
  ticketPromedio: number;
  ventasPorDia: { fecha: string; total: number }[];
  productosMasVendidos: { producto: string; cantidad: number }[];
  ventasPorMesa: { mesa: string; total: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  getResumen(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.apiUrl);
  }

  exportarPdf(formData: FormData): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export-pdf`, formData, {
      responseType: 'blob'
    });
  }
}
