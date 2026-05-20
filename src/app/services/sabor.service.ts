import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/enviroment'; // Mantenemos la ruta de tu archivo de entorno
import { SaborRequest, SaborResponse } from '../models/sabor.interface';
import { Page } from '../models/seguridad.interface';

@Injectable({
  providedIn: 'root'
})
export class SaboresService {

  private apiUrl = `${environment.apiUrl}/sabores`; 

  constructor(private http: HttpClient) { }

  crear(dto: SaborRequest): Observable<SaborResponse> {
    return this.http.post<SaborResponse>(this.apiUrl, dto);
  }

  listarTodas(page: number = 0, size: number = 10, sort: string = ''): Observable<Page<SaborResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<Page<SaborResponse>>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<SaborResponse> {
    return this.http.get<SaborResponse>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, dto: SaborRequest): Observable<SaborResponse> {
    return this.http.put<SaborResponse>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  obtenerProductosPorSabor(idSabor: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/${idSabor}/productos`);
  }

  asignarProductosASabor(idSabor: number, idsProductos: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${idSabor}/productos`, idsProductos);
  }
  
}