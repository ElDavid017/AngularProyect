import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormularioService {
  private mostrarFormularioSubject = new Subject<void>();
  mostrarFormulario$ = this.mostrarFormularioSubject.asObservable();

  activarFormulario() {
    this.mostrarFormularioSubject.next();
  }
}
