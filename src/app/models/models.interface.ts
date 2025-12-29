export interface EmpresaResponse {
    id: number;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    ruc: string;
    razonSocial: string;
    nombreDuenio: string;
    telefono: string;
}

export interface EmpresaRequest {
    ruc: string;
    razonSocial: string;
    nombreDuenio: string;
    telefono: string;
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