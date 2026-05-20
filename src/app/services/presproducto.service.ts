import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/enviroment';
import { PresentacionProdRequest, PresentacionProdResponse } from '../models/almacen.interface';
import { Page } from '../models/seguridad.interface';

@Injectable({
  providedIn: 'root'
})
export class PresentacionProductoService {

  private apiUrl = `${environment.apiUrl}/presentaciones-productos`; 

  constructor(private http: HttpClient) { }

  crear(dto: PresentacionProdRequest): Observable<PresentacionProdResponse> {
    return this.http.post<PresentacionProdResponse>(this.apiUrl, dto);
  }

  listarPorProducto(idProducto: number, page: number = 0, size: number = 10, sort: string = ''): Observable<Page<PresentacionProdResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<Page<PresentacionProdResponse>>(`${this.apiUrl}/producto/${idProducto}`, { params });
  }

  obtenerPorId(id: number): Observable<PresentacionProdResponse> {
    return this.http.get<PresentacionProdResponse>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, dto: PresentacionProdRequest): Observable<PresentacionProdResponse> {
    return this.http.put<PresentacionProdResponse>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}