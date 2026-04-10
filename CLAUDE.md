@AGENTS.md

# Carrusel IA — Guía para Claude

App web para automatizar la creación de carruseles de Instagram con IA. El equipo produce ~20 carruseles semanales para 6 marcas; las IAs genéricas no respetan guías de marca automáticamente, de ahí este proyecto.

## Stack

- **Next.js 16.2.2** (App Router) + **React 19** — ver aviso en AGENTS.md sobre breaking changes
- **TypeScript** strict
- **Tailwind CSS 4**
- **Supabase** — auth, base de datos (Postgres + RLS), storage
- **Anthropic SDK 0.82** — Claude Sonnet 4.6 genera la composición visual de cada slide
- **fal.ai (@fal-ai/client)** — generación de imágenes con Flux (opcional, solo si `FAL_KEY` está en `.env.local`)
- **html-to-image** — captura los slides renderizados como JPG
- **JSZip** — exporta los JPGs como archivo ZIP
- **react-hook-form + zod 4** — formularios y validación

## Estructura de rutas

```
app/
  (auth)/login/            → login con Supabase Auth
  (dashboard)/
    layout.tsx             → sidebar + protección de auth
    marcas/                → CRUD de marcas
    marcas/[id]/           → detalle + gestión de assets
    carruseles/            → lista de carruseles
    carruseles/nuevo/      → crear carrusel + slides
    carruseles/[id]/       → detalle, generar con IA, exportar
  api/
    carruseles/generar/    → POST: llama a Claude para componer todos los slides
    carruseles/[id]/download/ → GET: genera ZIP con los JPGs
```

## Módulos clave en `lib/`

| Archivo | Qué hace |
|---|---|
| `lib/ai/slide-composer.ts` | Llama a Claude Sonnet 4.6 para obtener la `ComposicionSlide` de cada slide |
| `lib/ai/prompt-builder.ts` | Construye el prompt de dirección de arte con paleta, tipografías, assets y copy |
| `lib/fal/client.ts` | Llama a fal.ai Flux si `generarImagen: true` en la composición |
| `lib/export/zip-builder.ts` | Empaqueta los JPGs en ZIP con JSZip |
| `lib/supabase/client.ts` | Cliente Supabase para componentes cliente |
| `lib/supabase/server.ts` | Cliente Supabase para Server Components y Server Actions |
| `lib/validations/carrusel.ts` | Schema Zod para formulario de carrusel |
| `lib/validations/marca.ts` | Schema Zod para formulario de marca |

## Tipos centrales (`types/index.ts`)

- **`Marca`** — nombre, colores (`ColorPaleta`), tipografías, tono_visual
- **`AssetMarca`** — tipo: `logo | fondo | icono | elemento | foto | efecto`, url, tags
- **`Carrusel`** — enfoque, estado, versión, slides, marca
- **`Slide`** — copy, sugerencia_visual, url_jpg, feedback_slide, composicion (`ComposicionSlide`)
- **`ComposicionSlide`** — lo que Claude devuelve: layout, colores, tipografía, textos, urls de assets, flag `generarImagen`
- **`RolUsuario`** — `editor` | `revisor`

## Flujo IA principal

1. Usuario crea un carrusel con N slides (copy + sugerencia visual opcional)
2. `POST /api/carruseles/generar` itera cada slide secuencialmente
3. `componerSlide()` llama a Claude con el prompt de dirección de arte
4. Claude devuelve un JSON `ComposicionSlide` (layout, colores, textos, assets)
5. Si `generarImagen: true` y `FAL_KEY` existe → llama a fal.ai para generar imagen
6. La composición se guarda en `slides.composicion` (jsonb)
7. `SlideRenderer` renderiza el slide en el DOM usando la composición
8. `SlideCapture` captura cada slide como JPG con html-to-image
9. `zip-builder` empaqueta todos los JPGs y sirve la descarga

## Roles y permisos (RLS en Supabase)

- **editor**: puede crear/editar marcas, assets, carruseles y slides
- **revisor**: solo puede actualizar `estado` y `feedback` en carruseles/slides
- Ambos roles leen todo lo que está autenticado
- El rol se asigna en la tabla `profiles`; por defecto es `editor` al registrarse

## Estados del carrusel

`borrador` → `en_revision` → `aprobado` | `con_cambios`

Cuando pasa a `con_cambios`, se guarda un snapshot en `versiones_carrusel` y se incrementa `version`.

## Posiciones de slide

- `hook` → slide 0 (impacto máximo, texto grande)
- `medio` → slides intermedios (desarrollo de contenido)
- `cta` → último slide (llamada a la acción)

## Base de datos

Tablas: `profiles`, `marcas`, `assets_marca`, `carruseles`, `slides`, `versiones_carrusel`

Storage buckets: `assets-marca` (logos, fondos, etc.), `slides-generados` (JPGs exportados)

Migration completa en `supabase/migrations.sql` — ejecutar en Supabase Dashboard > SQL Editor antes de usar la app.

## Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=          # obligatorio para el motor IA
FAL_KEY=                    # opcional — generación de imágenes con Flux
```

## Comandos

```bash
npm run dev      # desarrollo en localhost:3000
npm run build    # verificar build limpio antes de desplegar
npm run lint     # ESLint
```

## Convenciones del proyecto

- Los Server Actions están en archivos `actions.ts` junto a las páginas que los usan
- Los componentes se organizan por dominio: `components/carruseles/`, `components/marcas/`, `components/slides/`, `components/ui/`
- Nunca hacer llamadas a la API de Anthropic desde el cliente; siempre pasar por `/api/`
- Los colores de marca deben respetarse estrictamente — el prompt fuerza esto en Claude
- TypeScript strict: no usar `any`, tipar todo con los interfaces de `types/index.ts`
