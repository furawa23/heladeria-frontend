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
}

export interface SucursalResponse {
  id: number;
  nombre: string;
  direccion: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
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