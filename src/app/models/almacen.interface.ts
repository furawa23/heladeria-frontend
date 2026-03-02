export interface CategoriaProdRequest {
  nombre: string;
}

export interface CategoriaProdResponse {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  nombre: string;
}

export interface RecetaItemRequest {
  insumoId: number;
  cantidadUsada: number;
}

export interface RecetaItemResponse {
  id: number;
  idInsumo: number;
  insumoNombre: string;
  unidadBase: string;
  cantidadUsada: number;
}

export interface ProductoRequest {
  nombre: string;
  seVende: boolean;
  precioUnitarioVenta: number;
  unidadBase: string;
  idCategoria: number;
  receta: RecetaItemRequest[];
  stock: number
}

export interface ProductoResponse {
  id: number;
  updatedAt: Date;
  nombre: string;
  seVende: boolean;
  precioUnitarioVenta: number;
  unidadBase: string;
  categoria: string;
  receta: RecetaItemResponse[];
  stock: number
}

export interface PresentacionProdRequest {
  nombre: string;
  factor: number;
  precioVenta: number;
  idProducto: number;
}

export interface PresentacionProdResponse {
  id: number;
  createdAt: Date;
  nombre: string;
  factor: number;
  precioVenta: number;
  nombreProd: string;
}

export interface StockProdRequest {
  idProducto: number;
  idSucursal: number;
  cantidad: number;
}

export interface StockProdResponse {
  id: number;
  updatedAt: Date;
  nombreProducto: string;
  unidadMedida: string;
  nombreSucursal: string;
  cantidadActual: number;
}