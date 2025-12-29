import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { EmpresaResponse, EmpresaRequest } from '../../../models/models.interface';
import { MessageService } from 'primeng/api';
import { EmpresaService } from '../../../services/empresa.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TableLazyLoadEvent } from 'primeng/table';

@Component({
  selector: 'app-listaempresas',
  imports: [SharedModule],
  templateUrl: './listaempresas.component.html',
  styleUrl: './listaempresas.component.scss',
  providers: [
    HttpClient, EmpresaService, MessageService
  ]
})
export class Listaempresas implements OnInit {

  empresaDialog: boolean = false;

  deleteEmpresaDialog: boolean = false;

  empresa!:EmpresaResponse;

  empresas: EmpresaResponse[] = [];

  totalRecords: number = 0;
  loading: boolean = true;
  rows: number = 10;
  rowsPerPageOptions = [5, 10, 20];

  submitted: boolean = false;

  constructor(private empresaService: EmpresaService, private messageService: MessageService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadEmpresas({ first: 0, rows: 10 });
  }

  loadEmpresas(event: any) {
    this.loading = true;

    const first = event?.first ?? 0;
    const rows = event?.rows ?? 10;
    
    const page = first / rows;
    const size = rows;

    this.empresaService.listarTodas(page, size).subscribe({
      next: (data) => {
        this.empresas = data.content;
        this.totalRecords = data.totalElements;
        this.loading = false;
        
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
      }
    });
  }

  refreshTable() {
    this.loadEmpresas({ first: 0, rows: this.rows });
  }

  openNew(){
    this.empresa = {} as EmpresaResponse;
    this.submitted = false;
    this.empresaDialog = true;
  }

  editEmpresa(empresa:EmpresaResponse){
    this.empresa = {...empresa};
    this.empresaDialog = true;
  }

  deleteEmpresa(empresa:EmpresaResponse){
    this.deleteEmpresaDialog = true;
    this.empresa = {...empresa};
  }

  confirmDelete(){
    this.deleteEmpresaDialog = false;
    this.empresaService.eliminar(this.empresa.id).subscribe((data)=>{
      this.messageService.add({severity:'success',
        summary:'Empresa desactivada',
        detail:'Empresa '+this.empresa.razonSocial+' desactivada correctamente'});
        this.refreshTable();
    });
  }

  hideDialog(){
    this.empresaDialog = false;
    this.submitted = false;
  }

  saveEmpresa(){
    this.submitted = true;
    const empresaRequest: EmpresaRequest = {
      ruc: this.empresa.ruc,
      razonSocial: this.empresa.razonSocial,
      nombreDuenio: this.empresa.nombreDuenio,
      telefono: this.empresa.telefono
    };

    if(this.empresa.id){
      this.empresaService.actualizar(this.empresa.id, empresaRequest).subscribe((data)=>{
        this.empresa = data;
        this.messageService.add({severity:'success',
          summary:'Empresa actualizada',
          detail:'Empresa '+this.empresa.razonSocial+' actualizada correctamente'});
        this.refreshTable();
      });
    } else {
      this.empresaService.crear(empresaRequest).subscribe((data)=>{
        this.empresa = data;
        this.messageService.add({severity:'success',
          summary:'Empresa registrada',
          detail:'Empresa '+this.empresa.razonSocial+' registrada correctamente'});
        this.refreshTable();
      });
    }

    this.empresaDialog = false;
  }

  restaurarEmpresa(empresa: EmpresaResponse) {    
    this.empresaService.restaurar(empresa.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Empresa Activada',
          detail: `La empresa ${empresa.razonSocial} ha sido activada correctamente.`
        });
        this.refreshTable(); 
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo activar la empresa.'
        });
        console.error(err);
      }
    });
  }

}
