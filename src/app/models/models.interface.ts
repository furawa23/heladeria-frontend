export interface EmpresaResponse {
    id: number;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    ruc: string;
    razonSocial: string;
    nombreDuenio: string;
    telefono: string;
    sucursales?: SucursalResponse[];
}

export interface EmpresaRequest {
    ruc: string;
    razonSocial: string;
    nombreDuenio: string;
    telefono: string;
}

export interface SucursalRequest {
  nombre: string;
  direccion: string;
  idEmpresa: number;
}

export interface SucursalResponse {
  id: number;
  nombre: string;
  direccion: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  nombreEmpresa: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  usuario: UsuarioResponse;
}

export interface RegisterRequest {
  username: string;
  password?: string;
  rol: string;
}

export interface UsuarioRequest {
  username: string;
  password?: string;
  rol: string;
  idSucursal?: number | null;
  idEmpresa?: number | null;
}

export interface UsuarioResponse {
  createdAt: Date;
  updatedAt: Date;
  id: number;
  username: string;
  rol: string;
  nombreEmpresa: string;
  nombreSucursal: string;
  idSucursal?: number;
  idEmpresa?: number;
}

export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    last: boolean;
    size: number;
    number: number;
    sort?: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    first: boolean;
    empty: boolean;
  }