import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-amelia',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="amelia-container">
      <h1>AMELIA</h1>
      <p>Plataforma de asistencia virtual</p>
    </div>
  `,
  styles: [`
    .amelia-container {
      padding: 20px;
    }
  `]
})
export class Amelia {}