import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { StockProdRequest, StockProdResponse, Page } from '../models/models.interface';

@Injectable({
  providedIn: 'root'
})
export class StockProductoService {

  private apiUrl = `${environment.apiUrl}/stock-productos`; 

  constructor(private http: HttpClient) { }

  // @PostMapping - registrarIngreso
  registrarIngreso(dto: StockProdRequest): Observable<StockProdResponse> {
    return this.http.post<StockProdResponse>(this.apiUrl, dto);
  }

  // @GetMapping("/producto/{idProducto}")
  listarPorProducto(idProducto: number, page: number = 0, size: number = 10, sort: string = ''): Observable<Page<StockProdResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<Page<StockProdResponse>>(`${this.apiUrl}/producto/${idProducto}`, { params });
  }

  // @GetMapping("/producto/{idProducto}/sucursal")
  obtenerStockPorSucursal(idProducto: number): Observable<StockProdResponse> {
    return this.http.get<StockProdResponse>(`${this.apiUrl}/producto/${idProducto}/sucursal`);
  }

  obtenerPorId(id: number): Observable<StockProdResponse> {
    return this.http.get<StockProdResponse>(`${this.apiUrl}/${id}`);
  }

  // @PatchMapping("/{id}/ajuste")
  ajustarCantidad(id: number, nuevaCantidad: number): Observable<StockProdResponse> {
    // El controlador espera 'nuevaCantidad' como RequestParam
    const params = new HttpParams().set('nuevaCantidad', nuevaCantidad.toString());
    
    // Patch suele requerir un cuerpo, si no hay cuerpo enviamos null o un objeto vacío
    return this.http.patch<StockProdResponse>(`${this.apiUrl}/${id}/ajuste`, {}, { params });
  }
}