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
      // Construir mensaje de validación detallado y mostrar modal
      this.dialogMessage = this.buildValidationMessage();
      this.showDialog = true;
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
    this.dialogMessage = '';
  }

  private buildValidationMessage(): string {
    const errors: string[] = [];
    const controls = this.formSigup.controls;
    if (controls['usuid'].invalid) errors.push('- Identificación (requerida)');
    if (controls['usuclave'].invalid) errors.push('- Contraseña (mínimo 4 caracteres)');
    if (controls['usuapellido'].invalid) errors.push('- Apellido (requerido)');
    if (controls['usunombre'].invalid) errors.push('- Nombre (requerido)');
    if (controls['correo'].invalid) errors.push('- Correo inválido o vacío');
    if (controls['telefono'].invalid) errors.push('- Teléfono inválido (10 dígitos)');
    return errors.length ? ('Por favor corrija los siguientes campos:\n' + errors.join('\n')) : 'Complete los campos requeridos';
  }
}

