import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-imprenta',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="imprenta-container">
      <h1>IMPRENTA ELECTRÓNICA</h1>
      <p>Sistema de impresión digital</p>
    </div>
  `,
  styles: [`
    .imprenta-container {
      padding: 20px;
    }
  `]
})
export class Imprenta {}