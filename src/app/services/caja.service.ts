import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/enviroment';
import { CajaRequest, CajaResponse } from '../models/caja.interface';
import { Page } from '../models/seguridad.interface';

@Injectable({
  providedIn: 'root'
})
export class CajaService {

  private apiUrl = `${environment.apiUrl}/cajas`;

  constructor(private http: HttpClient) { }

  abrirCaja(dto: CajaRequest): Observable<CajaResponse> {
    return this.http.post<CajaResponse>(`${this.apiUrl}/abrir`, dto);
  }

  cerrarCaja(id: number): Observable<CajaResponse> {
    return this.http.put<CajaResponse>(`${this.apiUrl}/${id}/cerrar`, {});
  }

  obtenerCajaAbierta(): Observable<CajaResponse> {
    return this.http.get<CajaResponse>(`${this.apiUrl}/abierta`);
  }

  listarTodas(page: number = 0, size: number = 10, sort: string = ''): Observable<Page<CajaResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<Page<CajaResponse>>(this.apiUrl, { params });
  }
}