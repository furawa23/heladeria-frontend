import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { CompraRequest, CompraResponse, Page } from '../models/models.interface';

@Injectable({
  providedIn: 'root'
})
export class CompraService {

  private apiUrl = `${environment.apiUrl}/compras`; 

  constructor(private http: HttpClient) { }

  crear(dto: CompraRequest): Observable<CompraResponse> {
    return this.http.post<CompraResponse>(this.apiUrl, dto);
  }

  listarTodas(page: number = 0, size: number = 10, sort: string = ''): Observable<Page<CompraResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<Page<CompraResponse>>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<CompraResponse> {
    return this.http.get<CompraResponse>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, dto: CompraRequest): Observable<CompraResponse> {
    return this.http.put<CompraResponse>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}