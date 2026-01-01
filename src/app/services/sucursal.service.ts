import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { SucursalRequest, SucursalResponse, Page } from '../models/models.interface';

@Injectable({
  providedIn: 'root'
})
export class SucursalService {

  private apiUrl = `${environment.apiUrl}/sucursales`; 

  constructor(private http: HttpClient) { }

  crear(sucursal: SucursalRequest): Observable<SucursalResponse> {
    return this.http.post<SucursalResponse>(this.apiUrl, sucursal);
  }

  listarTodas(page: number = 0, size: number = 10): Observable<Page<SucursalResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<SucursalResponse>>(this.apiUrl, { params });
  }
  
  listarPorEmpresa(page: number, size: number, idEmpresa: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/empresa/${idEmpresa}?page=${page}&size=${size}`);
  }
  
  obtenerPorId(id: number): Observable<SucursalResponse> {
    return this.http.get<SucursalResponse>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, sucursal: SucursalRequest): Observable<SucursalResponse> {
    return this.http.put<SucursalResponse>(`${this.apiUrl}/${id}`, sucursal);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  restaurar(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/restaurar`, {});
  }
}