import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  formLogin: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  showModal = false;
  modalMessage = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.formLogin = this.fb.group({
      user: ['', Validators.required],
      pass: ['', Validators.required]
    });
  }

  onSubmit() {
    // Validación local: mostrar modal si faltan campos
    if (this.formLogin.invalid) {
      this.openModal('Por favor, llene todos los campos');
      return;
    }
    this.errorMessage = null;
    this.loading = true;
    const { user, pass } = this.formLogin.value;
    
    this.auth.login(user, pass).subscribe({
      next: (res) => {
        this.loading = false;
        try {
          this.router.navigate(['/dashboard']);
        } catch (e) {
          console.warn('No se pudo navegar, revisar Router', e);
        }
      },
      error: (err) => {
        this.loading = false;
        // Manejo básico de errores según backend y mostrar modal
        if (err?.status === 401) {
          this.openModal('Contraseña incorrecta');
        } else if (err?.status === 404) {
          this.openModal('Usuario no encontrado');
        } else {
          this.openModal('Error al iniciar sesión. Intente de nuevo');
        }
      }
    });
  }

  openModal(message: string) {
    this.modalMessage = message;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
}

