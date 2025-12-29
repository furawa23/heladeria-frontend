import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { TableModule } from "primeng/table";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { FileUploadModule } from 'primeng/fileupload';
import { RatingModule } from 'primeng/rating';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    InputTextModule,
    RadioButtonModule,
    RippleModule,
    TableModule,
    FileUploadModule,
    ToastModule,
    ToolbarModule,
    RatingModule,
    TextareaModule,
    DialogModule,
    TagModule,
    ReactiveFormsModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    InputTextModule,
    RadioButtonModule,
    RippleModule,
    TableModule,
    FileUploadModule,
    ToastModule,
    ToolbarModule,
    RatingModule,
    TextareaModule,
    DialogModule,
    TagModule,
    ReactiveFormsModule
  ]
})
export class SharedModule {}