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