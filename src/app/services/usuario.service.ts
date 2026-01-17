import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
// Asegúrate de importar tus interfaces correctas aquí
import { UsuarioRequest, RegisterRequest, UsuarioResponse, Page } from '../models/models.interface';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = `${environment.apiUrl}/usuarios`; 

  constructor(private http: HttpClient) { }

  // 1. Crear usuario (Superadmin: requiere ID sucursal)
  crearDesdeSuperadmin(usuario: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.apiUrl}/superadmin`, usuario);
  }

  // 2. Crear usuario (Empresa: usa sucursal del token)
  crearDesdeEmpresa(usuario: RegisterRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.apiUrl}/empresa`, usuario);
  }

  // 3. Listar todos (Paginado)
  listarTodos(page: number = 0, size: number = 10): Observable<Page<UsuarioResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<UsuarioResponse>>(this.apiUrl, { params });
  }

  // 4. Listar por Sucursal
  listarPorSucursal(idSucursal: number, page: number = 0, size: number = 10): Observable<Page<UsuarioResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<UsuarioResponse>>(`${this.apiUrl}/sucursal/${idSucursal}`, { params });
  }

  // 5. Listar por Empresa
  listarPorEmpresa(idEmpresa: number, page: number = 0, size: number = 10): Observable<Page<UsuarioResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<UsuarioResponse>>(`${this.apiUrl}/empresa/${idEmpresa}`, { params });
  }

  // 6. Obtener por ID
  obtenerPorId(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/${id}`);
  }

  // 7. Actualizar (Usa RegisterRequest ya que no se suele cambiar la sucursal al editar)
  actualizar(id: number, usuario: RegisterRequest): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.apiUrl}/${id}`, usuario);
  }

  // 8. Eliminar (Soft Delete)
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 9. Restaurar
  restaurar(id: number): Observable<void> {
    // Se envía un objeto vacío {} como body porque es un PUT
    return this.http.put<void>(`${this.apiUrl}/${id}/restaurar`, {});
  }
}