import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { EmpresaResponse, EmpresaRequest } from '../../../models/models.interface';
import { MessageService } from 'primeng/api';
import { EmpresaService } from '../../../services/empresa.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listaempresas',
  imports: [SharedModule],
  templateUrl: './listaempresas.component.html',
  styleUrl: './listaempresas.component.scss',
  providers: [
    EmpresaService, MessageService
  ]
})
export class Listaempresas implements OnInit {

  empresaDialog: boolean = false;
  deleteEmpresaDialog: boolean = false;

  empresa!: EmpresaResponse; 
  empresas: EmpresaResponse[] = [];

  form!: FormGroup;

  totalRecords: number = 0;
  loading: boolean = true;
  rows: number = 10;
  rowsPerPageOptions = [5, 10, 20];
  expandedRowKeys: { [key: string]: boolean } = {};
  
  submitted: boolean = false;

  saveConfirmDialog: boolean = false;
  restoreConfirmDialog: boolean = false;

  constructor(
    private empresaService: EmpresaService, 
    private messageService: MessageService, 
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      ruc: ['', [
        Validators.required, 
        Validators.pattern(/^[0-9]{11}$/)
      ]],
      razonSocial: ['', Validators.required],
      nombreDuenio: ['', Validators.required],
      telefono: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]/)]]
    });
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
    this.form.reset();
  }

  editEmpresa(empresa: EmpresaResponse){
    this.empresa = {...empresa};
    this.empresaDialog = true;
    
    this.form.patchValue({
      ruc: empresa.ruc,
      razonSocial: empresa.razonSocial,
      nombreDuenio: empresa.nombreDuenio,
      telefono: empresa.telefono
    });
  }

  deleteEmpresa(empresa: EmpresaResponse){
    this.deleteEmpresaDialog = true;
    this.empresa = {...empresa};
  }

  confirmDelete(){
    this.deleteEmpresaDialog = false;
    this.empresaService.eliminar(this.empresa.id).subscribe((data)=>{
      this.messageService.add({severity:'success', summary:'Empresa desactivada', detail:'Empresa desactivada correctamente'});
      this.refreshTable();
    });
  }

  hideDialog(){
    this.empresaDialog = false;
    this.submitted = false;
  }

  saveEmpresa(){
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }
    
    this.saveConfirmDialog = true;
  }

  confirmSave() {
    this.saveConfirmDialog = false;
    
    const formValues = this.form.value;
    const empresaRequest: EmpresaRequest = {
      ruc: formValues.ruc,
      razonSocial: formValues.razonSocial,
      nombreDuenio: formValues.nombreDuenio,
      telefono: formValues.telefono
    };

    if(this.empresa.id){
      this.empresaService.actualizar(this.empresa.id, empresaRequest).subscribe((data)=>{
        this.messageService.add({severity:'success', summary:'Empresa actualizada', detail:'Empresa actualizada correctamente'});
        this.refreshTable();
        this.empresaDialog = false;
      });
    } else {
      this.empresaService.crear(empresaRequest).subscribe((data)=>{
        this.messageService.add({severity:'success', summary:'Empresa registrada', detail:'Empresa registrada correctamente'});
        this.refreshTable();
        this.empresaDialog = false;
      });
    }
  }

  restaurarEmpresa(empresa: EmpresaResponse) {    
    this.empresa = {...empresa};
    this.restoreConfirmDialog = true;
  }

  confirmRestaurar() {
    this.restoreConfirmDialog = false;

    this.empresaService.restaurar(this.empresa.id).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Empresa Activada', detail: `La empresa ${this.empresa.razonSocial} ha sido activada correctamente.`});
        this.refreshTable(); 
      },
      error: (err) => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo activar la empresa.'});
        console.error(err);
      }
    });
  }

  irASucursales(idEmpresa: number) {
    this.router.navigate(['/sucursales'], { queryParams: { empresaId: idEmpresa } });
  }
}