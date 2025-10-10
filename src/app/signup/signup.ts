import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sigup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class Sigup {
  formSigup: FormGroup;
  showDialog = false;
  dialogMessage = '';
  submitting = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.formSigup = this.fb.group({
      usuid: ['', [Validators.required]],
      usuclave: ['', [Validators.required, Validators.minLength(4)]],
      usuruci: ['', []],
      usuapellido: ['', [Validators.required]],
      usunombre: ['', [Validators.required]],
      comcodigo: [''],
      usuperfil: [''],
      usuFechainicio: [''],
      usuFechafinal: [''],
      nivel: [''],
      direccion: [''],
      perfil_codigo: [''],
      ven_codigo: [''],
      telefono: ['', [Validators.pattern('^[0-9]{10}$')]],
      correo: ['', [Validators.required, Validators.email]],
      horaIngreso: [''],
      id_f: [''],
      bod_codigo: [''],
      lazzate: [0],
      empresa: [''],
      pto_emision: [''],
      nuevo_usr: [1],
      regalo: [0],
      firma_un_anio: [1],
      puntos_reclamados: [0]
    });
  }

  // getter para acceder rápido a los controles desde la plantilla
  get f() {
    return this.formSigup.controls;
  }

  onSubmit() {
    if (this.formSigup.invalid) {
      this.formSigup.markAllAsTouched();
      return;
    }

    const payload = this.formSigup.value;
    console.log('Registrando usuario...', payload);

    this.submitting = true;
    this.http.post('/api/signup', payload).subscribe({
      next: (res: any) => {
        console.log('Registro exitoso', res);
        this.dialogMessage = res && res.message ? res.message : 'Registro exitoso';
        this.showDialog = true;
        this.submitting = false;
      },
      error: (err) => {
        console.error('Error en registro', err);
        const message = err && err.error && err.error.message ? err.error.message : 'Error del servidor';
        this.dialogMessage = message;
        this.showDialog = true;
        this.submitting = false;
      }
    });
  }

  closeDialog() {
    this.showDialog = false;
  }
}

