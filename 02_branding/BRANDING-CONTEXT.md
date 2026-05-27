# SELVA DIGITAL — Contexto de Branding & Identidad de Marca
> Versión 1.0 · Mayo 2026 · Documento maestro para agentes de marketing

---

## 01 — IDENTIDAD CORE

### Nombre & Fundador
- **Marca:** Selva Digital
- **Fundador & Developer:** Christian A. Speziali
- **Rol:** Freelance full-stack developer
- **Ubicación:** Córdoba, Argentina (UTC−3)
- **Dominio oficial:** selvadigital.com
- **Año de inicio:** ~2020 (6 años de experiencia)

### Propuesta de valor principal
> *"Tu web vendiendo 24/7. Sin cuotas, sin agencia."*

Selva Digital es una marca de desarrollo web freelance orientada a **PyMEs argentinas** que quieren digitalizar su negocio con **pago único**, sin tarifas mensuales escondidas y sin intermediarios. El diferencial es el trato directo: el cliente habla con Christian de principio a fin, sin agencias que roten equipos ni mensajes que reboten.

### Diferenciadores clave
1. **Pago único** — dominio + hosting el primer año incluido
2. **Sin intermediarios** — Christian diseña, programa, hace el deploy y da soporte
3. **Máx. 3 proyectos simultáneos** — exclusividad y atención real
4. **Código propio, sin templates** — 100% personalizado
5. **Transparencia total** — presupuesto, tiempos y alcance por escrito antes de empezar
6. **Resultados medibles** — el portfolio muestra métricas reales

---

## 02 — AUDIENCIA OBJETIVO

- **Perfil principal:** Dueños de PyMEs argentinas (rubros: retail, gastronomía, turismo, servicios)
- **Perfil psicográfico:** Emprendedores que ya "saben que necesitan una web" pero desconfían de las agencias caras o de los freelancers que desaparecen
- **Dolor principal:** Pagar cuotas mensuales sin entender qué están comprando, o tratar con intermediarios que no conocen el negocio
- **Geo:** Argentina — foco en Córdoba, pero con proyectos en todo el país (Iguazú, Buenos Aires, etc.)
- **Alcance geográfico:** Solo Argentina (explícitamente declarado en el sitio)

---

## 03 — TON OF VOICE

### Personalidad de marca
- **Directa y sin rodeos** — dice lo que hace, cómo lo hace y cuánto cuesta
- **Técnica pero accesible** — usa terminología tech sin alienar al dueño de PyME
- **Coloquial argentina** — "laburar", "te marea", "te la mandás directo", "arrancar"
- **Confiable por resultados** — no vende humo, muestra métricas reales de clientes reales
- **Humana y cercana** — "soy yo, no un equipo", el tono personal es un diferencial

### Fórmulas de lenguaje recurrentes
- Frases cortas + punto. Énfasis con **negrita**.
- Nunca promesas vacías. Siempre con número o hecho concreto.
- Llamados a la acción directos: "Pedir presupuesto →", "Ver portfolio →", "Conversemos →"
- Etiquetas tipo terminal: `PRÓXIMA VENTANA: JUNIO 2026`, `2/3 CUPOS TOMADOS`
- Métricas como prueba social: "+34% leads", "×2.3 ticket promedio", "67% reservas sin OTAs"

### Qué NO hacer con el tono
- No ser genérico ni corporativo ("soluciones integrales para el crecimiento empresarial")
- No exagerar ni prometer sin respaldo
- No usar anglicismos innecesarios si existe la palabra en español
- No tutearte de manera impostada — el trato cercano es natural, no forzado

---

## 04 — PALETA DE COLORES

### Colores primarios
| Token | Nombre | Hex | Uso |
|---|---|---|---|
| `--color-accent` | Verde Selva | `#2BB673` | Acento principal: botones CTA, links, highlights, badges |
| `--color-bg-dark` | Negro Profundo | `#0A0B0D` | Background dark mode, headings dark |
| `--color-bg-light` | Blanco Crudo | `#FAFAFA` | Background light mode, texto sobre fondos oscuros |

### Escala de grises (neutrales)
| Token | Nombre | Hex | Uso |
|---|---|---|---|
| `--surface-1` | Surface | `#121316` | Cards sobre fondo dark |
| `--surface-2` | Surface 2 | `#1A1C20` | Capas secundarias dark |
| `--text-primary` | Text Primary | `#1C1C1F` | Texto base light mode |
| `--text-soft` | Text Soft | `rgba(28,28,31,0.70)` | Subtextos, descripciones |
| `--text-dim` | Text Dim | `rgba(28,28,31,0.50)` | Metadata, notas, labels pequeños |

### Estados y semántica
| Token | Nombre | Hex | Uso |
|---|---|---|---|
| `--color-accent-hover` | Verde claro | `#5EE6B7` | Hover states sobre el verde |
| `--color-error` | Rojo | `#FF6B6B` | Errores, alertas críticas |
| `--color-warning` | Ámbar | `#FFB547` | Advertencias, estados de precaución |

### Reglas de color
- El verde `#2BB673` es SOLO para acciones y highlights — nunca para texto de cuerpo
- Fondos oscuros: `#0A0B0D`; Fondos claros: `#FAFAFA`
- No crear colores nuevos. La paleta está cerrada.
- Botones primarios: verde + texto `#06140C`. Botones secundarios: ghost con borde.

---

## 05 — TIPOGRAFÍA

### Familias tipográficas
| Familia | Tipo | Google Fonts | Uso |
|---|---|---|---|
| **Geist** | Sans-serif | `family=Geist:wght@300;400;500;600;700` | Headings, display, logos, textos grandes |
| **Inter** | Sans-serif | `family=Inter:wght@300;400;500;600;700` | Body text, UI, descripciones, labels |
| **JetBrains Mono** | Monospace | `family=JetBrains+Mono:wght@400;500` | Tags, etiquetas técnicas, precios, timestamps, código |

### Escala tipográfica
| Nivel | Tamaño | Familia | Peso | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| H1 | 56px | Geist | 700 | 1.10 | -0.035em |
| H2 | 42px | Geist | 700 | 1.15 | -0.030em |
| H3 | 24px | Geist | 600 | 1.30 | -0.010em |
| Body | 16px | Inter | 400 | 1.65 | normal |
| Small | 13px | Inter | 400 | 1.5 | normal |
| Mono/Tag | 10-13px | JetBrains Mono | 400-500 | 1.5 | +0.5px |

### Reglas tipográficas
- **700 (Bold):** Headings, CTA, énfasis visual
- **600 (Semibold):** Subheadings, labels importantes
- **500 (Medium):** Botones, acciones
- **400 (Regular):** Cuerpo, descripciones
- **300 (Light):** Subtítulos, notas (uso limitado)
- Mínimo 16px en mobile; 18px+ en desktop para body
- Nunca texto menor a 12px (excepto metadata mono)

---

## 06 — COMPONENTES UI

### Botones
- **Primary:** `background: #2BB673 · color: #06140C · border-radius: 10px · font-weight: 600`
- **Ghost:** `background: #FAFAFA · color: #0A0B0D · border: 1px solid rgba(28,28,31,0.12) · border-radius: 10px`
- Nunca botones grises o plateados. Si no es primary, es ghost.

### Cards
- `padding: 28px · background: #FAFAFA · border: 1px solid rgba(28,28,31,0.08) · border-radius: 12px`
- Sombra sutil: máximo `blur 20px, spread -10px, opacity 0.1`
- No usar sombras fuertes

### Border Radius
| Contexto | Valor |
|---|---|
| Tight (chips, tags) | `6px` |
| Standard (botones, inputs) | `10px` |
| Large (cards, modales) | `12px` |
| Hero/Secciones | `18-20px` |

### Spacing (múltiplos de 8px)
| Tamaño | Uso típico |
|---|---|
| 4–8px | Padding interno chips, botones pequeños |
| 12–16px | Padding de cards, gap entre items |
| 24–32px | Padding vertical secciones, gap entre cards |
| 48–64px | Padding entre secciones grandes |
| 80–120px | Padding secciones hero |

---

## 07 — LOGO

- **Logo principal:** `https://res.cloudinary.com/djtvjkcu6/image/upload/v1778510560/SelvaDigital/logoChico2_kg35ot.png`
- **Descripción:** Hoja estilizada + "Selva" en tipografía moderna
- **Variación oscura:** Mismo logo con `filter: invert(1)` sobre fondos dark
- **Clear space:** Mínimo 1× la altura del isotipo alrededor del logo en todos lados
- **Proporciones:** Siempre mantener 1:1. Nunca estirar.
- **Uso principal:** Navbar, footer, documentos oficiales

---

## 08 — SERVICIOS Y PRECIOS (ARS)

| Servicio | Precio base | Notas |
|---|---|---|
| Landing Page | $250.000 | 1 página, dominio + hosting 1er año |
| Sitio Web | $400.000 | 3-5 secciones, el más elegido |
| E-commerce | $700.000 | MercadoPago, stock, panel admin |
| Sitio a Medida | $550.000 | +5 secciones, premium |
| Sistema a medida | $900.000+ | Dashboard, CRM, API, backend propio |
| Chatbot con IA | $700.000+ | Agéntico, multi-bot, VPS propio |
| App a medida | $1.000.000+ | Web o mobile, backend dedicado |

> Todos los precios en ARS. Primer año: dominio + hosting incluido. Sin cuotas mensuales.

### Condiciones de pago
- **40%** al arrancar (seña)
- **30%** al aprobar el diseño
- **30%** al ver el sitio funcionando (si no convence, no se cobra y no se publica)

---

## 09 — PORTFOLIO & CASOS DE ÉXITO

| Proyecto | Rubro | Métrica | Stack |
|---|---|---|---|
| MegaMuebles | E-commerce | +34% leads orgánicos | React, Cloudinary, GA4 |
| Iguazú Falls Lodge | Turismo | 67% reservas sin OTAs | Next.js, Cloudinary, Ads |
| El Fogón Delivery | Gastronomía | ×2.3 ticket promedio | Next.js, Tailwind, S3 |
| Vip Traslados Iguazú | Landing | CTR Ads ×2.1 (-40% CPC) | React, Vite, Schema |
| Megabot Admin | Sistema/IA | 3 bots, +1.200 msgs/día | React, IA, VPS |
| Impasto Pizzería | E-commerce | En lanzamiento | React, Netlify, SEO |
| Carro Fogón | Sistema | Pedidos automatizados | React, Node.js, Firebase |
| Recetario Napolitano | Sistema | Costos optimizados | React, Netlify, Node.js |
| MegaStock | Sistema | Stock en tiempo real | React, Node.js, PostgreSQL |

---

## 10 — STACK TECNOLÓGICO

**Frontend:** React · Next.js · Astro · TypeScript · Tailwind CSS · Vite  
**Backend:** Node.js · PostgreSQL · MongoDB · Firebase  
**Deploy:** Vercel · Netlify · VPS propio  
**Pagos:** MercadoPago  
**IA:** OpenAI · Anthropic  
**Media:** Cloudinary · S3  
**Analytics:** Google Analytics 4 · Google Ads · Schema.org  

---

## 11 — PROCESO DE TRABAJO

```
01. Hablamos de tu idea
    → Me contás qué necesitás, qué vendés y a quién le querés llegar.

02. Te paso un plan claro
    → Presupuesto, tiempos y alcance por escrito. Sin sorpresas.

03. Construyo con avances semanales
    → Ves la web crecer en tiempo real y ajustamos sobre la marcha.

04. Lanzamos y capacito
    → Te entrego las claves, te explico cómo funciona y quedás operativo.
```

**Tiempos estimados:**
- Landing page: 5–7 días hábiles
- Sitio completo: 2–3 semanas
- E-commerce / sistema: 4–8 semanas

---

## 12 — CONTACTO & DATOS OPERATIVOS

| Canal | Dato |
|---|---|
| Email | info.selvadigital@gmail.com |
| WhatsApp | +54 9 3548 550334 |
| Teléfono | +54 9 3548 550334 |
| Ubicación | Córdoba, Argentina |
| Horario | Lunes–Viernes, 9–19 hs |
| Respuesta | < 24 hs (WhatsApp: ~1 hora) |
| Capacidad | Máx. 3 proyectos simultáneos |

---

## 13 — MENSAJES CLAVE PARA MARKETING

### Headlines probados del sitio
- "Tu web vendiendo 24/7. Sin cuotas, sin agencia."
- "Todo lo que necesita tu negocio digital."
- "Proyectos en producción. Sin mockups, sin filtros."
- "Chatbots con IA que trabajan por vos."
- "Pago único, sin sorpresas. El primer año va incluido."
- "Sin letra chica. Así de simple."

### Proof points (datos duros)
- 15+ proyectos en producción
- 6 años desarrollando
- < 24 hs de respuesta inicial
- $0 cuotas mensuales
- 100% código propio, sin templates
- 100% proyectos entregados

### Objeciones frecuentes (y respuestas)
| Objeción | Respuesta de marca |
|---|---|
| "¿Cuánto tarda?" | Depende del tipo. Landing: 5-7 días. Sitio: 2-3 semanas. Todo va por escrito. |
| "¿Hay mensualidades?" | No. Pago único. Dominio+hosting el primer año incluido. |
| "¿El código me pertenece?" | Sí. Al entregar el proyecto, pasás a ser dueño del código, claves y documentación. |
| "¿Trabajás solo?" | Sí. Eso es la ventaja: hablás conmigo de principio a fin, no con un PM. |
| "¿Trabajás fuera de Argentina?" | No. Foco exclusivo en PyMEs argentinas. |

---

---

## 14 — FILOSOFÍA DE MARKETING (INSTRUCCIONES PARA AGENTES)

> Esta sección es de uso exclusivo para los agentes de marketing. Define cómo deben pensar, crear y comunicar.

### Principio rector: vender transformación, no productos

**Lo que NO se hace:** describir características del servicio ("tiene panel de administración", "código propio", "deploy en la nube").

**Lo que SÍ se hace:** mostrar cómo cambia la vida del cliente después de tener el producto.

El cliente no compra "un e-commerce con MercadoPago". Compra no tener que responder 40 mensajes de WhatsApp por día preguntando el precio. Compra poder irse de vacaciones sabiendo que su negocio sigue vendiendo.

---

### El eje central de toda comunicación: AHORRO DE TIEMPO Y DINERO

Cada pieza de marketing debe responder, explícita o implícitamente, estas dos preguntas:

1. **¿Cuánto tiempo le devuelve esto al cliente?**
   - Horas semanales que deja de responder consultas a mano
   - Tareas manuales que se automatizan (pedidos, stock, atención)
   - Tiempo hasta el primer resultado (días, no meses)

2. **¿Cuánto dinero le genera o le ahorra?**
   - Ventas que antes se perdían por no tener presencia digital
   - Comisiones que dejaba en manos de intermediarios (Booking, MercadoLibre, OTAs)
   - Costo de oportunidad: lo que pierde cada semana sin tener una web
   - Comparación implícita con el costo de una agencia vs. pago único

---

### Marco de comunicación: antes / después / puente

Para cada servicio o pieza de contenido, pensar en tres momentos:

| Momento | Pregunta | Ejemplo |
|---|---|---|
| **Antes** | ¿Cómo es la vida del cliente SIN el producto? | "Respondés el mismo mensaje 20 veces por día" |
| **Después** | ¿Cómo es su vida CON el producto? | "Tu bot cierra la venta mientras dormís" |
| **Puente** | ¿Qué hace posible ese cambio? | "Un chatbot que aprende tu negocio en 48 hs" |

---

### Creatividad: generar ideas nuevas, no repetir el sitio web

Los agentes de marketing **NO deben copiar ni parafrasear** los headlines o copy del sitio web (selvadigital.com). Ese material ya fue publicado. El objetivo es crear ángulos nuevos, distintos, que lleguen a audiencias que quizás no conocen la marca.

**Ángulos creativos a explorar:**
- El costo de NO tener una web (cuánto pierde el negocio por semana)
- Testimonios reales reimaginados como mini-historias
- Comparaciones concretas: "lo que gastás en 2 meses de agencia = lo que pagás una sola vez acá"
- Escenarios cotidianos de PyMEs: el dueño que atiende el local, la cocina y el teléfono a la vez
- El contraste entre "antes del sitio" y "después del sitio" con métricas reales del portfolio
- Contenido educativo: "por qué tu web en Instagram no reemplaza tener un dominio propio"
- El factor confianza: qué significa que el código sea tuyo y no del proveedor

**Formatos que se pueden explorar (más allá del sitio web):**
- Carruseles de Instagram con problema → solución → resultado
- Reels con situaciones cotidianas de PyMEs
- Emails cortos con un solo insight de valor
- Posts estilo "hilo" con un caso del portfolio como protagonista
- Contenido para LinkedIn orientado a emprendedores y dueños de negocio

---

### Cómo hablar de cada servicio (orientación a beneficios)

| Servicio | NO decir | SÍ decir |
|---|---|---|
| Sitio web | "Diseño 100% personalizado + SEO técnico" | "Que te encuentren en Google cuando tu cliente ya está buscando lo que vendés" |
| E-commerce | "Carrito + checkout + panel de productos" | "Vendé mientras dormís. Sin responder el mismo precio 30 veces por WhatsApp" |
| Chatbot con IA | "Multi-bot, base de conocimiento propia" | "Un empleado que trabaja 24/7, no se enferma y no cobra sueldo" |
| Sistema a medida | "Dashboard con login y roles de usuario" | "Dejá de gestionar tu negocio en planillas de Excel y papel" |
| SEO local | "Schema.org y datos estructurados" | "Aparecé primero cuando alguien en tu ciudad busca lo que vendés" |
| Landing page | "Página única con scroll y formulario" | "Un vendedor online que recibe consultas incluso cuando cerraste el local" |

---

### Tono de marketing (complementa el tono general de marca)

- Empático primero, técnico después (si es necesario)
- Usar situaciones reales y reconocibles para el dueño de PyME
- Las métricas del portfolio son el activo más poderoso — usarlas como punto de partida
- El precio no es el argumento de venta: el argumento es el retorno sobre la inversión
- Nunca sonar como agencia. Siempre sonar como el colega que sabe de esto y te habla de frente.

---

*Documento generado automáticamente a partir del sitio web y Brand Guidelines v1.0 · Mayo 2026*  
*Fuentes: https://selva-digital.vercel.app/ + Brand-Guidelines.html*
