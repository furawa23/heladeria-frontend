import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/enviroment'; // Asegúrate que la ruta sea correcta según tu estructura
import { ProveedorRequest, ProveedorResponse } from '../models/compra.interface';
import { Page } from '../models/seguridad.interface';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {

  // La ruta base coincide con @RequestMapping("/api/proveedores") de tu Controller
  private apiUrl = `${environment.apiUrl}/proveedores`; 

  constructor(private http: HttpClient) { }

  crear(dto: ProveedorRequest): Observable<ProveedorResponse> {
    return this.http.post<ProveedorResponse>(this.apiUrl, dto);
  }

  listarTodas(page: number = 0, size: number = 10, sort: string = ''): Observable<Page<ProveedorResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<Page<ProveedorResponse>>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<ProveedorResponse> {
    return this.http.get<ProveedorResponse>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, dto: ProveedorRequest): Observable<ProveedorResponse> {
    return this.http.put<ProveedorResponse>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}