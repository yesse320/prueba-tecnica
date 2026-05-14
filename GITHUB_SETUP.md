# Guía: Subir a GitHub

## Pasos para subir tu proyecto a GitHub

### 1. Crear un repositorio en GitHub

1. Ve a [github.com](https://github.com)
2. Click en el `+` arriba a la derecha
3. Selecciona "New repository"
4. Nombre: `prueba-tecnica`
5. Descripción: "Prueba técnica con Next.js y Supabase"
6. Selecciona "Public" o "Private"
7. NO selecciones "Initialize this repository with a README"
8. Click "Create repository"

### 2. Configurar Git localmente

Abre la terminal en tu proyecto y ejecuta:

```bash
# Inicializar git (ya debe estar hecho)
git init

# Agregar tu usuario de GitHub
git config user.name "Tu Nombre"
git config user.email "tu.email@example.com"

# Agregar todos los archivos
git add .

# Crear primer commit
git commit -m "Initial commit: Next.js + Supabase setup"

# Cambiar rama principal a main (si es necesario)
git branch -M main

# Agregar el remoto (reemplaza USERNAME/REPO)
git remote add origin https://github.com/USERNAME/prueba-tecnica.git

# Subir el código
git push -u origin main
```

### 3. Verificar que está en GitHub

- Ve a `https://github.com/USERNAME/prueba-tecnica`
- Deberías ver tus archivos (sin `.env.local`)

### 4. Proteger tu información sensible

✅ Ya está configurado:
- `.gitignore` excluye `.env*` archivos
- `.env.local` NO se subirá a GitHub
- Tu clave de Supabase es segura

⚠️ Importante:
- NUNCA compartas tus claves de Supabase
- Si las expones accidentalmente, regenera en Supabase

### 5. Clonar en otro lugar

Para clonar tu proyecto en otro dispositivo:

```bash
git clone https://github.com/USERNAME/prueba-tecnica.git
cd prueba-tecnica
npm install

# Crea tu .env.local con tus claves
echo 'NEXT_PUBLIC_SUPABASE_URL=...' > .env.local
echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY=...' >> .env.local

npm run dev
```

### 6. Cambios futuros

Después de hacer cambios:

```bash
# Ver cambios
git status

# Agregar cambios
git add .

# Crear commit
git commit -m "Descripción del cambio"

# Subir
git push
```

## Tips Útiles

- Usa commits descriptivos: `git commit -m "Add user authentication with Supabase"`
- Haz commits frecuentes y pequeños
- Revisa [Git Guide](https://guides.github.com) para más info
- Considera usar [GitHub Desktop](https://desktop.github.com) si prefieres GUI

## Troubleshooting

**Error: "remote origin already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/prueba-tecnica.git
```

**Error: "fatal: not a git repository"**
```bash
git init
git config user.name "Tu Nombre"
git config user.email "tu@email.com"
git add .
git commit -m "Initial commit"
```

**¿Olvidaste agregar .env.local a .gitignore?**
```bash
# Remover del historio
git rm --cached .env.local

# Agregar a .gitignore
echo ".env.local" >> .gitignore

# Commit
git add .gitignore
git commit -m "Remove .env.local from tracking"
git push
```
