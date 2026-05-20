import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/enviroment'; // Mantenemos la ruta de tu archivo de entorno
import { CategoriaProdRequest, CategoriaProdResponse } from '../models/almacen.interface';
import { Page } from '../models/seguridad.interface';

@Injectable({
  providedIn: 'root'
})
export class CategoriaProductoService {

  private apiUrl = `${environment.apiUrl}/categorias-productos`; 

  constructor(private http: HttpClient) { }

  crear(dto: CategoriaProdRequest): Observable<CategoriaProdResponse> {
    return this.http.post<CategoriaProdResponse>(this.apiUrl, dto);
  }

  listarTodas(page: number = 0, size: number = 10, sort: string = ''): Observable<Page<CategoriaProdResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<Page<CategoriaProdResponse>>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<CategoriaProdResponse> {
    return this.http.get<CategoriaProdResponse>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, dto: CategoriaProdRequest): Observable<CategoriaProdResponse> {
    return this.http.put<CategoriaProdResponse>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}