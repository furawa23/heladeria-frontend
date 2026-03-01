import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { VentaRequest, VentaResponse, Page } from '../models/models.interface';

@Injectable({
  providedIn: 'root'
})
export class VentaService {

  private apiUrl = `${environment.apiUrl}/ventas`; 

  constructor(private http: HttpClient) { }

  crear(dto: VentaRequest): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(this.apiUrl, dto);
  }

  listarTodas(page: number = 0, size: number = 10, sort: string = ''): Observable<Page<VentaResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<Page<VentaResponse>>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<VentaResponse> {
    return this.http.get<VentaResponse>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, dto: VentaRequest): Observable<VentaResponse> {
    return this.http.put<VentaResponse>(`${this.apiUrl}/${id}`, dto);
  }

  cancelar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  cobrar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/cobrar`, {});
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}