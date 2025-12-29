import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';// Asumiendo que tienes configurado tu environment
import { EmpresaRequest, EmpresaResponse, Page } from '../models/models.interface';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  // Url base: ej. 'http://localhost:8080/api/empresas'
  private apiUrl = `${environment.apiUrl}/empresas`; 

  constructor(private http: HttpClient) { }

  /**
   * Crear una nueva empresa
   * POST /api/empresas
   */
  crear(empresa: EmpresaRequest): Observable<EmpresaResponse> {
    return this.http.post<EmpresaResponse>(this.apiUrl, empresa);
  }

  /**
   * Listar todas las empresas con paginación
   * GET /api/empresas?page=0&size=10
   */
  listarTodas(page: number = 0, size: number = 10): Observable<Page<EmpresaResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      // Si necesitas ordenamiento, puedes agregar: .set('sort', 'nombre,asc')

    return this.http.get<Page<EmpresaResponse>>(this.apiUrl, { params });
  }

  /**
   * Obtener empresa por ID
   * GET /api/empresas/{id}
   */
  obtenerPorId(id: number): Observable<EmpresaResponse> {
    return this.http.get<EmpresaResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualizar empresa
   * PUT /api/empresas/{id}
   */
  actualizar(id: number, empresa: EmpresaRequest): Observable<EmpresaResponse> {
    return this.http.put<EmpresaResponse>(`${this.apiUrl}/${id}`, empresa);
  }

  /**
   * Eliminar empresa (lógica o física según backend)
   * DELETE /api/empresas/{id}
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Restaurar empresa eliminada
   * PUT /api/empresas/{id}/restaurar
   */
  restaurar(id: number): Observable<void> {
    // Se envía un cuerpo vacío ({}) porque el método es PUT y requiere body, 
    // aunque el backend no lo lea, es buena práctica en Angular.
    return this.http.put<void>(`${this.apiUrl}/${id}/restaurar`, {});
  }
}