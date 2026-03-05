export interface CajaRequest {
    montoInicial: number
}

export interface CajaResponse {
    id: number;
    fechaApertura: string;
    fechaCierre: string;
    montoInicial: number;
    montoFinal: number;
    estado: string
}

export interface MovimientoCajaRequest {
    tipo: string;
    monto: number;
    idVenta: number;
    idCompra: number;
    metodoPago: string
}

export interface MovimientoCajaResponse {
    id: number;
    tipo: string;
    monto: number;
    idVenta: number;
    idCompra: number;
    fechaCreacion: string;
    metodoPago: string
}