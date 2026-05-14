# Prueba Técnica - Next.js + Supabase

Proyecto Next.js con Supabase como base de datos.

## Requisitos

- Node.js 18+ 
- npm o yarn
- Cuenta en [Supabase](https://supabase.com)

## Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio-url>
cd prueba-tecnica
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env.local` en la raíz del proyecto:
```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

Obtén estas claves desde tu dashboard de Supabase:
- Ve a Settings > API
- Copia la URL del proyecto
- Copia la clave anon pública

4. **Ejecutar el servidor de desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

```
├── app/                    # Rutas de Next.js
├── components/            # Componentes React
├── lib/
│   └── supabase.ts       # Cliente de Supabase
├── public/               # Archivos estáticos
├── .env.local            # Variables de entorno (NO commitear)
└── package.json
```

## Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run start` - Inicia servidor de producción
- `npm run lint` - Ejecuta ESLint

## GitHub

Este proyecto está configurado para ser subido a GitHub con:
- `.gitignore` configurado para no compartir variables sensibles
- Variables de entorno en `.env.local` (local only)
- Código limpio y listo para colaboración

## Próximos Pasos

1. Configurar tu base de datos en Supabase
2. Crear tablas y políticas de seguridad
3. Conectar componentes React a Supabase
4. Subir a GitHub
5. Hacer deploy en Vercel

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
