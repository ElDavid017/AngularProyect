import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="orel-container">
      <h1>OREL</h1>
      <p>Sistema de gestión de documentos OREL</p>
    </div>
  `,
  styles: [`
    .orel-container {
      padding: 20px;
    }
  `]
})
export class Orel {}