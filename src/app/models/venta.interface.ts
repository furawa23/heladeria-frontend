export interface MesaRequest {
  numero: number;
  idSucursal: number;
}

export interface MesaResponse {
  id: number;
  numero: number;
  libre: boolean;
  nombreSucursal: string;
}

export interface DetVentaRequest {
  cantidad: number,
  precioUnitario: number,
  idPresentacion: number,
  idProducto: number
}

export interface DetVentaResponse {
  id: number,
  idProducto: number,
  nombreProducto: string,
  idPresentacion: number,
  nombrePresentacion: string,
  cantidad: number,
  precioUnitario: number,
  subtotal: number
}

export interface VentaRequest {
  numeroComprobante: string,
  total: number,
  estado: string,
  idMesa?: number,
  detalles: DetVentaRequest[]
}

export interface VentaResponse {
  id: number,
  createdAt: Date,
  numeroComprobante: string,
  total: number,
  estado: string,
  numeroMesa: number,
  detalles: DetVentaResponse[]
}

export interface PagoVentaRequest {
  metodoPago: string;
  monto: number
}

export interface CobrarVentaRequest {
  pagos: PagoVentaRequest[]
}