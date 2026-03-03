import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { MovimientoCajaRequest, MovimientoCajaResponse } from '../models/caja.interface';
import { Page } from '../models/seguridad.interface';

@Injectable({
  providedIn: 'root'
})
export class MovimientoCajaService {

  private apiUrl = `${environment.apiUrl}/movimientos-caja`;

  constructor(private http: HttpClient) { }

  registrarMovimiento(dto: MovimientoCajaRequest): Observable<MovimientoCajaResponse> {
    return this.http.post<MovimientoCajaResponse>(this.apiUrl, dto);
  }

  listarPorCaja(idCaja: number, page: number = 0, size: number = 10, sort: string = ''): Observable<Page<MovimientoCajaResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<Page<MovimientoCajaResponse>>(`${this.apiUrl}/caja/${idCaja}`, { params });
  }
}