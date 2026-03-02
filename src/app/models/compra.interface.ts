export interface ProveedorRequest {
  razonSocial: string;
  ruc: string;
  telefono: string;
}

export interface ProveedorResponse {
  id: number;
  razonSocial: string;
  ruc: string;
  telefono: string;
}

export interface DetCompraRequest {
  cantidad: number;
  precioUnitario: number;
  idPresentacion: number;
  idProducto: number;
}

export interface DetCompraResponse {
  id: number;
  idProducto: number;
  nombreProducto: string;
  idPresentacion: number;
  nombrePresentacion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface CompraRequest {
  descripcion: string;
  numeroComprobante: string;
  estado: string;
  idProveedor: number;
  detalles: DetCompraRequest[];
}

export interface CompraResponse {
  id: number;
  createdAt: string;
  descripcion: string;
  numeroComprobante: string;
  total: number;
  estado: string;
  proveedor: string;
  detalles: DetCompraResponse[];
}