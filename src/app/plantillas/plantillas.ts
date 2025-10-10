import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-plantillas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="plantillas-container">
      <h1>PLANTILLAS</h1>
      <p>Gestión de plantillas de documentos</p>
    </div>
  `,
  styles: [`
    .plantillas-container {
      padding: 20px;
    }
  `]
})
export class Plantillas {}