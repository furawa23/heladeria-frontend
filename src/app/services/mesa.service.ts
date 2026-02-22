import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment'; // Mantenemos la ruta de tu archivo de entorno
import { MesaRequest, MesaResponse, Page } from '../models/models.interface';

@Injectable({
  providedIn: 'root'
})
export class MesaService {

  private apiUrl = `${environment.apiUrl}/mesas`; 

  constructor(private http: HttpClient) { }

  crear(dto: MesaRequest): Observable<MesaResponse> {
    return this.http.post<MesaResponse>(this.apiUrl, dto);
  }

  listarTodas(page: number = 0, size: number = 10, sort: string = ''): Observable<Page<MesaResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<Page<MesaResponse>>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<MesaResponse> {
    return this.http.get<MesaResponse>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, dto: MesaRequest): Observable<MesaResponse> {
    return this.http.put<MesaResponse>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}