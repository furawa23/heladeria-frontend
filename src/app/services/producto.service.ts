import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { ProductoRequest, ProductoResponse } from '../models/almacen.interface';
import { Page } from '../models/seguridad.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private apiUrl = `${environment.apiUrl}/productos`; 

  constructor(private http: HttpClient) { }

  crear(dto: ProductoRequest): Observable<ProductoResponse> {
    return this.http.post<ProductoResponse>(this.apiUrl, dto);
  }

  listarTodas(page: number = 0, size: number = 10, sort: string = ''): Observable<Page<ProductoResponse>> {
    let params = this.getParams(page, size, sort);
    return this.http.get<Page<ProductoResponse>>(`${this.apiUrl}/todos`, { params });
  }

  listarInsumos(page: number = 0, size: number = 10, sort: string = ''): Observable<Page<ProductoResponse>> {
    let params = this.getParams(page, size, sort);
    return this.http.get<Page<ProductoResponse>>(`${this.apiUrl}/insumos`, { params });
  }

  listarProductosVenta(page: number = 0, size: number = 10, sort: string = ''): Observable<Page<ProductoResponse>> {
    let params = this.getParams(page, size, sort);
    return this.http.get<Page<ProductoResponse>>(`${this.apiUrl}/venta`, { params });
  }

  listarDisponiblesParaVenta(): Observable<ProductoResponse[]> {
    return this.http.get<ProductoResponse[]>(`${this.apiUrl}/disponible-venta`);
  }

  listarPorCategoria(idCat: number, page: number = 0, size: number = 10, sort: string = ''): Observable<Page<ProductoResponse>> {
    let params = this.getParams(page, size, sort);
    return this.http.get<Page<ProductoResponse>>(`${this.apiUrl}/categoria/${idCat}`, { params });
  }

  obtenerPorId(id: number): Observable<ProductoResponse> {
    return this.http.get<ProductoResponse>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, dto: ProductoRequest): Observable<ProductoResponse> {
    return this.http.put<ProductoResponse>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private getParams(page: number, size: number, sort: string): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }
    return params;
  }
}