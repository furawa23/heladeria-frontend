export interface SaborRequest {
    nombre: string,
    precioAdicional: number
}

export interface SaborResponse {
    updatedAt: string,
    id: number,
    nombre: string,
    precioAdicional: number
}