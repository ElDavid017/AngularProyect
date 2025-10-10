import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-firmador',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="firmador-container">
      <h1>FIRMADOR</h1>
      <p>Sistema de firma digital</p>
    </div>
  `,
  styles: [`
    .firmador-container {
      padding: 20px;
    }
  `]
})
export class Firmador {}