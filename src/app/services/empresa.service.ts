import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { EmpresaRequest, EmpresaResponse, Page } from '../models/models.interface';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  private apiUrl = `${environment.apiUrl}/empresas`; 

  constructor(private http: HttpClient) { }

  crear(empresa: EmpresaRequest): Observable<EmpresaResponse> {
    return this.http.post<EmpresaResponse>(this.apiUrl, empresa);
  }

  listarTodas(page: number = 0, size: number = 10): Observable<Page<EmpresaResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<EmpresaResponse>>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<EmpresaResponse> {
    return this.http.get<EmpresaResponse>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, empresa: EmpresaRequest): Observable<EmpresaResponse> {
    return this.http.put<EmpresaResponse>(`${this.apiUrl}/${id}`, empresa);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  restaurar(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/restaurar`, {});
  }
}