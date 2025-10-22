# Reportes

Proyecto Angular llamado `reportes` con un login falso (sin backend) y una ruta protegida.

## Requisitos

- Node.js (>=16 recomendado)
- npm

## Instalar y ejecutar

1. Instalar dependencias:

```powershell
cd C:\Users\Usuario\Desktop\Pasantias\reportes
npm install
```

2. Levantar servidor de desarrollo:

```powershell
npx @angular/cli serve --open
```

3. Abrir en el navegador: http://localhost:4200/

## Rutas disponibles

- `/login` - formulario de inicio de sesión.
- `/dashboard` - página protegida, accesible solo si se ha iniciado sesión (autenticación falsa basada en localStorage).

## Autenticación (fake)

El `AuthService` guarda un token ficticio en `localStorage`. Cualquier usuario/contraseña no vacíos son aceptados. Para cerrar sesión, borrar `localStorage` o ejecutar `localStorage.removeItem('token')` desde la consola.

## Próximos pasos sugeridos

- Conectar con un backend real para autenticación (JWT).
- Añadir manejo de errores, validación y estilos.
- Usar Angular Material o Bootstrap para mejorar la UI.

