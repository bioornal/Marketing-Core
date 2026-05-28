import React, { useState, useEffect } from 'react';
import WizardShell from './components/WizardShell';
import SettingsModal from './components/SettingsModal';
import BrandWizard from './components/BrandWizard';
import CanvasStudio from './components/CanvasStudio';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateTextWithGemini, generateImageWithGemini, analyzeImageWithGemini } from './services/gemini';
import { generateTextWithOpenAI, generateImageWithOpenAI, analyzeImageWithOpenAI } from './services/openai';
import { renderTextBackgroundAsync } from './services/composer';
import { generateImageWithFalAI } from './services/falai';
import SeriesPlanner from './components/SeriesPlanner';
import FlyerAdsPanel from './components/FlyerAdsPanel';
import ReelsPanel from './components/ReelsPanel';
import WelcomePortal from './components/WelcomePortal';
import { useActiveSeries } from './hooks/useSeries';
import './styles/series.css';
import LoginPortal from './components/LoginPortal';


const BRANDS_DB = {
  "selva-digital": {
    "id": "selva-digital",
    "name": "Selva Digital",
    "slogan": "\"Tu web vendiendo 24/7. Pago único. Sin agencia.\"",
    "website": "selva-digital.vercel.app",
    "theme": {
      "accent": "#2BB673",
      "accentRgb": "43, 182, 115",
      "accentText": "#06140C",
      "accentSecondary": "#00E5FF",
      "accentSecondaryRgb": "0, 229, 255",
      "darkBg": "#0A0B0D",
      "surfaceBg": "#121316",
      "cardBg": "rgba(18, 19, 22, 0.65)",
      "textSoft": "rgba(250, 250, 250, 0.72)",
      "textDim": "rgba(250, 250, 250, 0.58)",
      "fonts": "Geist & Inter",
      "ctaShape": "rectangular",
      "radius": "0px CTAs / 999px decorativos",
      "logo": "https://res.cloudinary.com/djtvjkcu6/image/upload/v1778510560/SelvaDigital/logoChico2_kg35ot.png",
      "profilePhoto": "https://res.cloudinary.com/djtvjkcu6/image/upload/v1778507882/SelvaDigital/yo_perfil_ekrrxc.jpg"
    },
    "contact": {
      "email": "info.selvadigital@gmail.com",
      "whatsapp": "+54 9 3548 550334"
    },
    "limits": ["FREELANCER · NO AGENCIA", "PAGO 50/50", "SOLO ARGENTINA"],
    "positioning": {
      "type": "freelancer",
      "voice": "primera persona singular",
      "differentiator": "Chatbots IA + outcome-led: menos tiempo perdido, más ventas. Sin jerga técnica.",
      "payment": "50% al inicio + 50% contra entrega",
      "hosting": "Hosting/dominio NO incluidos — el cliente los contrata a su nombre (~AR$9.300/mes Hostinger). Argumento: 'no quedás atado, el sitio es 100% tuyo desde el día uno'.",
      "pricing": {
        "landing": 250000,
        "sitioCorp": 350000,
        "sitioExtendido": 450000,
        "ecommerce": 1300000,
        "sistemaAMedida": 1200000,
        "chatbotIA": 1500000,
        "appAMedida": null
      }
    },
    "defaults": {
      "targetPersona": "Dueño/a de PyME argentina, 35-55 años, 1-15 empleados, factura $5M-$80M ARS/mes. Rubros típicos: gastronomía, hotelería regional, muebles, turismo, comercio, salud privada, inmobiliaria, educación. Vende casi todo por WhatsApp e Instagram pero las ventas están estancadas. Dolores concretos según servicio: (1) sin web → lo googlean y aparece la competencia, los anuncios de Meta caen a su perfil de IG, la web vieja del sobrino en Wix no carga en celular; (2) ecommerce → vende por DM, calcula envíos a mano, Tiendanube le come 12-15% + cuota fija, pierde ventas fuera de horario sin carrito autoservicio; (3) app → recibe pedidos en planilla, repartidores sin tracking, turnos en papel; (4) chatbot → atiende 40-80 WhatsApp/día contestando lo mismo (precio, horario, stock, envío), responde a las 23hs desde la cama, perdió leads de pauta paga porque nadie contestó. Habla como dueño en su negocio: dice 'página web', 'tener WhatsApp', 'aparecer en Google', NUNCA 'landing', 'SEO', 'funnel', 'transformación digital'. Objeciones reales: '¿y si después no me respondés?', 'mi sobrino me lo hace gratis', 'Wix me sale 8 lucas por mes', '¿lo puedo modificar yo?'. Trigger de compra típico: perdió una venta grande porque no encontraron info en Google / le subieron la cuota de Tiendanube / va a hacer pauta y necesita landing decente / un competidor sacó chatbot. NO es founder con seed money, NO busca 'presencia digital', busca vender más y trabajar menos. Decide en 1-3 semanas comparando contra agencia con abono, Wix/Tiendanube DIY, 'el sobrino' o freelancer de Workana.",
      "feedText": "Respondés 40 WhatsApp\npor día.\nTu web puede hacerlo sola.",
      "storyText": "¿Respondés el mismo WhatsApp 40 veces al día? 🙄\n\nTu tiempo vale oro. Recuperalo con una web que venda sola.",
      "caption": "<strong>selva.digital</strong> ¿Cuántas horas perdés por semana respondiendo lo mismo en WhatsApp? 🙄\n\nEso es tiempo que le sacás a mejorar tu negocio, atender clientes reales o descansar. Tu web debería estar trabajando por vos.\n\n<strong>Una web hecha a medida vende 24/7. Pago único, sin cuotas. 50% al arranque, 50% contra entrega.</strong> El sitio queda 100% a tu nombre desde el día uno.\n\nPedime presupuesto → Link en bio. 🚀\n\n#desarrolloweb #pyme #argentina #freelance #chatbotia"
    },
    "buyerPersona": {
      "demografia": "Dueño/a de PyME argentina, 35-55, 1-15 empleados, factura $5M-$80M ARS/mes. Rubros calientes: gastronomía (pizzerías, parrillas, delivery), hotelería regional (cabañas, hosterías, lodges), muebles y carpinterías con venta directa, turismo (traslados, excursiones, alquileres), comercio mayorista, salud privada (consultorios, estética), inmobiliarias chicas, educación privada (academias, oficios).",
      "dolores_por_servicio": {
        "landing_o_sitio_web": [
          "Tiene Instagram con seguidores reales pero cuando lo googlean aparece la competencia o no aparece nada.",
          "La web actual la armó un sobrino en Wix hace 4 años y no se puede tocar sin romperla.",
          "El sitio no carga bien en el celular y por ahí entra el 85% del tráfico.",
          "No tiene formulario que avise por WhatsApp o mail cuando alguien consulta — se le pierden los leads.",
          "Los clientes le piden 'pasame el link de tu página' y termina mandando capturas de pantalla del catálogo.",
          "Pagó pauta en Meta Ads y el anuncio caía a su perfil de Instagram en vez de a una landing — la conversión fue un desastre."
        ],
        "ecommerce": [
          "Vende todo por DM y calcula el envío a mano en cada pedido, uno por uno.",
          "Tiene Tiendanube o Mercado Shops y le sangra 12-15% por venta + cuota mensual fija que no para de subir.",
          "Su tienda online parece igual a otras 50.000 — no tiene identidad propia ni se diferencia.",
          "Quiere integrar Mercado Pago con Andreani o Correo Argentino y le dijeron que era 'imposible sin programador'.",
          "Pierde ventas fuera del horario de atención porque no tiene carrito autoservicio.",
          "Necesita catálogo con stock real sincronizado, no un PDF que actualiza una vez por mes."
        ],
        "app_web_o_nativa": [
          "Sus clientes le piden 'una app' y no sabe si conviene gastar plata en eso o no.",
          "Tiene repartidores sin tracking y anota los pedidos en una planilla impresa que se le pierde.",
          "Recibe turnos o reservas en papel o en Google Calendar y se le superponen seguido.",
          "Quiere fidelizar con programa de puntos pero las plataformas que probó son caras y rígidas.",
          "Su sistema interno en Excel ya no escala — pasó de 1 a 3 sucursales y todo es un caos."
        ],
        "chatbot_ia": [
          "Atiende entre 40 y 80 WhatsApp por día contestando exactamente lo mismo: precio, horario, stock, envío, dirección.",
          "Responde mensajes desde la cama a las 23hs y vuelve a las 7am — no descansa nunca.",
          "Tiene un empleado o empleada dedicada solo a contestar WhatsApp y le sale $400-600k por mes en sueldo.",
          "Probó ManyChat o chatbots de árbol con botones y los clientes se frustraban — terminó apagándolos.",
          "Quiere que el bot entienda lenguaje natural pero le da pánico que 'el robot diga cualquier cosa o regale precios'.",
          "Pierde leads de pauta paga fuera de horario porque nadie contesta a tiempo y el cliente se va a la competencia."
        ]
      },
      "objeciones_reales": [
        "¿Y si después de cobrarme no me respondés más? (miedo n°1)",
        "Mi sobrino me lo hace gratis con WordPress — no entiende el costo real del tiempo perdido y el sin-soporte.",
        "En Wix me sale 8 lucas por mes nomás — no ve que esa cuota es eterna y no le pertenece nada.",
        "¿Lo puedo modificar yo después o tengo que llamarte cada vez? (quiere autonomía).",
        "¿Y si el año que viene quiero cambiar de proveedor, me quedo atrapado?",
        "Mi negocio no es para web, yo vendo todo por WhatsApp — no ve el costo de oportunidad.",
        "No tengo tiempo para reunirme 10 veces — valora proceso corto y entregable claro.",
        "¿Cuánto demora exactamente? — quiere fecha real, no 'depende'."
      ],
      "lenguaje": {
        "dice": ["página web", "tener WhatsApp", "que aparezca en Google", "tienda online", "que me lleguen los pedidos al mail", "pauta", "el chico/la chica que me lleva las redes"],
        "no_dice": ["sitio", "landing", "SEO", "funnel", "leads", "CTR", "stack", "frontend", "transformación digital", "presencia digital", "engagement"]
      },
      "trigger_de_compra": [
        "Perdió una venta grande porque el cliente no encontró info en Google a las 22hs.",
        "El community manager renunció y se quedó sin nadie que conteste DMs.",
        "Un competidor directo sacó tienda online o chatbot y empezó a comerle ventas.",
        "Le subieron la cuota mensual de Tiendanube o Wix y se hartó del abono eterno.",
        "Va a hacer pauta en Meta o Google y necesita landing decente urgente para no quemar plata.",
        "Va a abrir sucursal nueva o sumar línea de producto y la web actual ya no representa al negocio."
      ],
      "compite_contra": [
        "Agencia local que cobra abono mensual de $80k-$150k para siempre",
        "Wix / Tiendanube / Mercado Shops DIY (cuotas eternas + comisión por venta)",
        "El sobrino o conocido que 'sabe de computación'",
        "Freelancer barato de Workana o Fiverr que después desaparece"
      ]
    },
    "seriesDefaults": {
      "handle": "selva-digital.vercel.app",
      "footer": "selva-digital.vercel.app",
      "reelCta": "Pedime presupuesto → Link en bio.",
      "industryFocus": "el mundo de las páginas web, los chatbots inteligentes, las apps a medida y los e-commerce, aplicado a la vida de quien trabaja con tecnología",
      "visualMood": "Estética DARK cinematográfica, no documental. Tipo cortometraje noir/Mr. Robot/Severance: penumbra profunda con UNA fuente de luz dominante (el monitor encendido, una lámpara de escritorio cálida, el brillo azul de una pantalla en la oscuridad). Paleta: negros densos, gris carbón, alguna nota cálida puntual de lámpara incandescente. Sensación: las 2 AM, foco silencioso, intensidad contenida, soledad productiva. Granulado fino editorial, profundidad de campo corta, lente 50mm. NO es realismo costumbrista, NO es luz de mediodía, NO son escenas alegres ni de barrio típico. Es la atmósfera de alguien resolviendo algo importante de noche.",
      "allowedObjects": [
        "una notebook abierta con código en el editor (VS Code, terminal con líneas verdes/blancas sobre negro)",
        "un monitor curvo o monitor externo grande mostrando un panel de administración, un dashboard o una landing page",
        "un setup de doble o triple monitor en penumbra, sólo iluminado por la luz de las pantallas",
        "un celular apoyado mostrando una conversación de WhatsApp Business con varios mensajes sin leer",
        "una pantalla de celular o tablet con una tienda online (carrito de e-commerce, productos en grilla)",
        "una pantalla con un chatbot de IA respondiendo (interfaz tipo chat con burbujas)",
        "una pantalla con un dashboard de métricas, gráficos de ventas, números grandes y curvas analíticas",
        "una pantalla con una vista de Google Analytics o un panel de estadísticas en tiempo real",
        "una pantalla mostrando el resultado de Google para una búsqueda local (SERP)",
        "una pantalla con un editor de diseño tipo Figma con artboards de una landing",
        "una pantalla con git / commits / pull requests en una interfaz tipo GitHub",
        "una pantalla con un calendario o tablero de tareas (Notion, Trello, Linear) en modo oscuro",
        "una pantalla con un formulario de checkout de Mercado Pago listo para pagar",
        "una pantalla con WhatsApp Web abierto y una bandeja de mensajes en el lateral",
        "una pantalla con un error 404 o una pantalla de loading minimalista en modo oscuro",
        "un teclado mecánico iluminado por debajo en un escritorio oscuro, con teclas resaltadas por el backlight",
        "un mouse premium minimalista (negro mate) sobre un mousepad extendido, iluminado lateralmente",
        "un set de auriculares con cable o inalámbricos sobre el escritorio, junto al teclado",
        "una webcam con anillo LED encendido sobre el borde superior de un monitor",
        "un micrófono de condensador tipo podcast sobre brazo articulado, en penumbra",
        "un dock USB-C con varios cables conectados, LEDs azules tenues",
        "un SSD externo o pendrive con LED parpadeando sobre el escritorio",
        "una llave de seguridad de hardware (YubiKey) insertada en el USB de una notebook",
        "una placa Raspberry Pi sobre la mesa con cables saliendo, LED rojo encendido",
        "un router WiFi con varias luces LED parpadeando en una habitación a oscuras",
        "un cable ethernet conectándose al router, plug RJ45 en primer plano",
        "un modem/ONT de fibra con luces parpadeando, montado en la pared en penumbra",
        "una taza oscura de café o un vaso de agua al lado de una sesión de código nocturna",
        "un termo Stanley junto a un mate cebado en primer plano, al lado de un monitor encendido con código",
        "una libreta moleskine abierta con un esquema de arquitectura dibujado a mano, al lado del teclado",
        "post-its pegados al marco del monitor con anotaciones a mano",
        "un libro técnico (Clean Code, Pragmatic Programmer) abierto bocabajo al lado del teclado",
        "una pantalla con líneas de código reflejándose en una superficie oscura (madera, vidrio, ventana)",
        "el reflejo de código en los lentes de anteojos de alguien (sin mostrar la cara, sólo los lentes en primer plano)",
        "una notebook cerrada sobre el escritorio con la luz del logo apagado y sólo el reflejo de una lámpara",
        "un cable USB-C o HDMI iluminado por la luz de un monitor encendido",
        "una silla ergonómica vacía detrás de un escritorio con la pantalla encendida (sugerencia de presencia constante)",
        "la esquina de un home office minimalista de noche, ventana al fondo con luces urbanas borrosas",
        "un coworking vacío de noche con un solo escritorio iluminado al fondo",
        "una mesa de bar / cafetería de noche con una notebook abierta como única fuente de luz",
        "un cursor parpadeante grande en primer plano sobre una pantalla en negro (close-up)",
        "una terminal con ASCII art o un prompt $ esperando comando, en pantalla completa",
        "una pizarra acrílica o muro con un flowchart / diagrama UML dibujado, iluminado por una lámpara lateral",
        "líneas de luz que sugieren fibra óptica corriendo por una habitación oscura (efecto cinematográfico sutil)",
        "una planta de interior en penumbra junto al setup, parcialmente iluminada por el monitor"
      ],
      "forbiddenObjects": [
        "smartwatches o relojes inteligentes",
        "cámaras fotográficas, lentes, equipos de fotografía",
        "auriculares de DJ, parlantes, mezcladoras, equipos de audio o música como protagonista",
        "proyectores antiguos, vinilos, tocadiscos",
        "instrumentos musicales (guitarras, sintetizadores, pianos)",
        "drones, gadgets de consumer electronics tipo GoPro",
        "consolas de videojuegos, joysticks, gaming gear llamativo, RGB de colores saturados, mousepads con anime o ilustraciones",
        "tablets dibujando, lápices stylus de diseño gráfico como sujeto principal",
        "objetos retro tipo máquina de escribir, telefono fijo viejo, radio vintage",
        "estética 'tech bro' luminosa (oficinas modernas con luz natural brillante, glass walls, vista panorámica de día)",
        "merchandising tech ostentoso (camisetas con logos de marcas, tazas con memes, stickers saturados pegados al monitor)",
        "comida, bebidas alcohólicas, productos de retail físico ajenos al rubro",
        "carteles motivacionales, frases inspiracionales colgadas en la pared",
        "decoración tipo girl-boss / aesthetic kawaii (velas rosas, lucecitas warm string, plushies, polaroids colgadas)"
      ]
    }
  },
  "mega-muebles": {
    "id": "mega-muebles",
    "name": "Mega Muebles",
    "slogan": "\"Muebles de madera real para toda la vida. Directo de fábrica.\"",
    "website": "megamuebles.com.ar",
    "theme": {
      "accent": "#FFB547",
      "accentRgb": "255, 181, 71",
      "accentText": "#1C1C1F",
      "darkBg": "#12110F",
      "cardBg": "rgba(34, 30, 26, 0.65)",
      "fonts": "Outfit & Inter",
      "radius": "8px / 12px / 16px",
      "logo": "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=100&auto=format&fit=crop"
    },
    "contact": {
      "email": "ventas@megamuebles.com.ar",
      "whatsapp": "+54 9 351 9876543"
    },
    "limits": ["MADERA MACIZA", "12 CUOTAS FIJAS"],
    "defaults": {
      "targetPersona": "Familias y dueños de casa en Argentina que buscan amoblar su hogar con piezas de madera maciza premium y diseño atemporal, valorando la durabilidad real frente a muebles descartables.",
      "feedText": "Muebles reales.\nPara toda la vida.",
      "storyText": "¿Cansado de armar muebles de melamina barata que se tambalean? 🪵🔨\n\nInvertí en madera real directo de fábrica.",
      "caption": "<strong>megamuebles.ok</strong> ¿Cansado de los muebles de melamina descartables que se doblan con solo mirarlos? 🪵🔨\n\nTu hogar merece madera de verdad. Piezas de <strong>madera maciza lustrada</strong>, fabricadas a mano por carpinteros argentinos y diseñadas para durar generaciones.\n\n<strong>Comprá directo de fábrica en 12 cuotas fijas.</strong> Garantía real y envíos listos a todo el país.\n\nCatálogo completo haciendo clic en el link de la bio → @megamuebles.ok 🚀\n\n#mueblesdemadera #carpinteria #decoracion #hogar #argentina"
    },
    "seriesDefaults": {
      "handle": "megamuebles.ok",
      "footer": "megamuebles.com.ar",
      "reelCta": "Conocé el catálogo → Link en bio.",
      "industryFocus": "el oficio de la carpintería de madera maciza y los hogares amoblados con piezas que duran generaciones",
      "visualMood": "Estética CÁLIDA y ARTESANAL cinematográfica. Inspiración: fotografía de Annie Leibovitz aplicada al oficio, anuncios de cerveza artesanal, documentales de Wes Anderson sobre artesanos. Luz dominante: hora dorada filtrada por persianas de madera, lámpara incandescente sobre un banco de trabajo. Paleta: marrones cálidos profundos, ocres, sombras color borgoña, algún destello de luz que pega en el aserrín suspendido. Sensación: tiempo lento, paciencia, manos curtidas, materia transformada. Granulado fino. NO es luz fluorescente, NO es taller industrial, NO es exhibición de catálogo brillante. Es el momento íntimo entre el artesano y la madera.",
      "allowedObjects": [
        "tablones de madera maciza apilados en un taller con luz lateral",
        "una mesa de comedor de madera maciza terminada, en un living con luz cálida de tarde",
        "una mesa de comedor servida con vajilla simple de cerámica y una jarra de agua, lista para una cena familiar",
        "un sillón o sofá tapizado de madera dura, en un ambiente hogareño íntimo",
        "un sillón con una manta de lana arrugada encima, una taza humeante al lado, libro abierto bocabajo",
        "una biblioteca de madera maciza con libros viejos, iluminada por lámpara",
        "un escritorio de madera con vetas marcadas, con una lámpara de bronce encima",
        "un escritorio de madera con una libreta abierta y una lapicera vintage en primer plano",
        "una cama de madera maciza con sábanas blancas arrugadas, luz de mañana entrando por una ventana",
        "un placard o ropero de madera maciza con puertas entreabiertas mostrando interior cálido",
        "una mesita de luz de madera con un libro y un vaso de agua, lámpara encendida tenue",
        "una mesa ratona de madera maciza con tazas de café, revistas y la luz dorada de una tarde",
        "un mueble de cocina de madera maciza con frascos de vidrio con especias y harinas",
        "una banca o silla de madera maciza sola, iluminada lateralmente por una ventana",
        "un mueble a medida en proceso de construcción, sin terminar, en el taller",
        "herramientas de carpintería (formón, garlopa, escuadra, gubias) ordenadas sobre un banco de trabajo",
        "un banco de carpintero desordenado con virutas, herramientas dispersas y luz lateral cálida",
        "manos curtidas de carpintero pasando lija sobre una superficie de madera (sin mostrar la cara)",
        "manos aplicando cera de abeja con un trapo sobre madera lustrada",
        "la espalda de un carpintero con delantal de cuero trabajando frente a un banco (sin cara)",
        "el perfil de un carpintero sacando viruta con una garlopa, silueta a contraluz",
        "una placa de madera siendo lijada o lustrada en primer plano, polvillo dorado en el aire",
        "una caja de espigas de madera, un frasco con clavos de bronce, cola vinílica, lustres aceitosos sobre la mesa",
        "el detalle close-up de un ensamble caja-espiga perfecto, sin clavos visibles",
        "el detalle close-up de la veta y los nudos de una tabla recién cepillada",
        "una sierra de mano colgada de la pared del taller, junto a metros y plomadas",
        "el polvo de aserrín y virutas acumulados al pie de un banco, iluminados por luz lateral",
        "aserrín suspendido en un haz de luz dorada dentro del taller",
        "una ventana del taller con luz dorada de tarde entrando, iluminando un mueble en proceso",
        "una ventana del hogar con cortinas livianas, luz natural cayendo sobre un mueble terminado",
        "el aceite de lino o cera derramándose lentamente sobre la madera, brillo cálido",
        "una taza de café o mate sobre una mesa de madera maciza, vapor visible a contraluz",
        "un plano técnico dibujado a mano sobre papel manteca, al lado de un metro y un lápiz",
        "una vajilla de cerámica artesanal apoyada sobre una mesa de madera",
        "una planta de interior en maceta de barro sobre un mueble de madera, luz lateral cálida",
        "un detalle de las patas o el rodapié de un mueble con tallado a mano visible",
        "el reflejo del lustre en la superficie de una mesa recién terminada, sin objetos arriba",
        "un par de manos pequeñas (de niño/a) dibujando con crayones sobre la superficie de un escritorio de madera"
      ],
      "forbiddenObjects": [
        "muebles de melamina, MDF o material aglomerado",
        "muebles de plástico, metal industrial o vidrio templado",
        "decoración escandinava minimalista IKEA-style, todo blanco perfecto",
        "electrodomésticos, electrónica, dispositivos digitales como protagonistas",
        "objetos modernos urbanos (laptops, celulares, monitores) — la marca habla de oficio, no de oficina",
        "estética showroom comercial con luz fluorescente blanca",
        "muebles flatpack con tornillos hexagonales visibles, llaves Allen, instrucciones de armado",
        "decoración rústica fake estilo bar temático o cabaña turística falsa",
        "carteles motivacionales, frases en madera tallada tipo 'home sweet home'"
      ]
    }
  },
  "impasto-pizzas": {
    "id": "impasto-pizzas",
    "name": "Impasto Pizzas",
    "slogan": "\"Pizza napoletana real. 48hs de fermentación en frío.\"",
    "website": "impastopizza.com.ar",
    "theme": {
      "accent": "#FF6B6B",
      "accentRgb": "255, 107, 107",
      "accentText": "#FFFFFF",
      "darkBg": "#0F0E0E",
      "cardBg": "rgba(26, 20, 20, 0.65)",
      "fonts": "Outfit & Inter",
      "radius": "12px / 16px / 20px",
      "logo": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&auto=format&fit=crop"
    },
    "contact": {
      "email": "hola@impastopizza.com.ar",
      "whatsapp": "+54 9 3548 112233"
    },
    "limits": ["DELIVERY & TAKE AWAY", "MIE A DOM 19 A 23hs"],
    "defaults": {
      "targetPersona": "Amantes de la gastronomía artesanal en la zona, que buscan una pizza napolitana auténtica con masa madre ligera y bordes alveolados inflados, cansados del delivery de pizza pesada tradicional.",
      "feedText": "Harina, agua, tiempo.\nEso es pizza real.",
      "storyText": "El delivery tradicional te marea con masa pesada y aceitosa. 🍕😴\n\nProbá Impasto: 48hs de fermentación fría para una digestión ultraliviana.",
      "caption": "<strong>impasto.pizza</strong> Harina, agua, levadura y mucho tiempo. Eso es pizza real. 🍕🔥\n\nEn <strong>Impasto</strong> no apuramos los procesos. Cada bollo fermenta 48 horas en frío antes de entrar a nuestro horno a leña a 450°C. ¿El resultado? Bordes alveolados perfectos y una masa ultraliviana que no cae pesada.\n\n<strong>Pedí tu napolitana artesanal esta noche.</strong> Delivery calentito y take away directo de miércoles a domingos.\n\nPedir por WhatsApp → Link en bio. 🚀\n\n#pizzanapoletana #masamadre #delivery #gastronomia #argentina"
    },
    "seriesDefaults": {
      "handle": "impasto.pizza",
      "footer": "impastopizza.com.ar",
      "reelCta": "Pedí por WhatsApp → Link en bio.",
      "industryFocus": "el oficio de la pizza napoletana artesanal, la masa madre, la fermentación lenta, los hornos a leña",
      "visualMood": "Estética SENSORIAL e ÍNTIMA cinematográfica. Inspiración: fotografía de Anthony Bourdain en Parts Unknown, cine de Italia neorrealista nocturno, ads de Diageo. Luz dominante: el fuego del horno a leña casi naranja golpeando una pared oscura, lámpara colgante sobre una mesa de amasar enharinada, brasas tenues. Paleta: negros profundos con destellos naranja-rojo del fuego, marrón quemado, blanco hueso de la harina suspendida. Sensación: calor, ritual ancestral, transformación, sudor, paciencia. Granulado fino, ligero halo de humo. NO es cocina industrial brillante, NO es luz de mediodía, NO es plato emplatado tipo Instagram food. Es el momento crudo del oficio.",
      "allowedObjects": [
        "un horno a leña encendido con llamas anaranjadas visibles adentro, en una pared oscura",
        "el interior del horno a leña en close-up, brasas naranjas vibrando contra ladrillo refractario quemado",
        "una pizza siendo introducida al horno con la pala, lengua de fuego curvándose hacia ella",
        "una pizza recién salida del horno con bordes alveolados quemados y leopardeados, vapor visible",
        "una pizza napoletana cortada al medio mostrando el alveolado interior y los hilos de mozzarella",
        "leños de madera apilados al lado del horno encendido, brasas tenues iluminando la corteza",
        "una chimenea o tiro del horno con humo saliendo lentamente, luz tenue al fondo",
        "un bollo de masa fermentando sobre una mesa de madera enharinada, ligero brillo de humedad",
        "varios bollos de masa en bandejas alineadas dentro de una cámara de fermentación",
        "una masa siendo abierta a mano con la técnica napoletana del schiaffo, sin rodillo, harina volando",
        "manos enharinadas amasando un bollo grande sobre mesada de mármol (sin mostrar la cara)",
        "manos cubiertas de harina espolvoreando sémola sobre la mesa antes de estirar",
        "la espalda de un pizzaiolo frente al horno, silueta a contraluz contra el fuego naranja",
        "el brazo del pizzaiolo extendiendo la pala hacia el horno, llama anaranjada al fondo",
        "el perfil parcial de un pizzaiolo con bandana, vapor del horno suavizando la imagen",
        "una pala de pizza de madera apoyada junto al horno, harina espolvoreada encima",
        "una pala de pizza metálica con brasas pegadas en la punta, junto a una rasqueta del horno",
        "una raspilla / raschietto de masa apoyada sobre una mesada con restos de masa adheridos",
        "una balanza digital marcando 280g en un bollo de masa cruda",
        "una bolsa de harina Caputo abierta, harina derramándose ligeramente sobre la mesa",
        "un frasco de vidrio con masa madre activa burbujeando, etiqueta a mano",
        "un termómetro digital marcando 450°C clavado en la cámara del horno",
        "un reloj o cronómetro de cocina marcando las 48 horas de fermentación, en penumbra",
        "un cuaderno manchado de harina con anotaciones a mano: hidratación, % sal, horas de leudado",
        "una tabla de madera con tomates San Marzano enteros y triturados, manchas rojas en la madera",
        "una bola de mozzarella fior di latte húmeda sobre tabla, gotas de suero alrededor",
        "hojas de albahaca fresca recién cortadas sobre un repasador blanco",
        "un chorro de aceite de oliva extra virgen cayendo sobre una pizza recién salida, brillo dorado",
        "una rodaja de tomate con sal gruesa visible, close-up sobre tabla oscura",
        "harina suspendida en el aire iluminada por una lámpara colgante, partículas brillando",
        "vapor saliendo de una pizza recién cortada, contraluz desde un ventanal nocturno",
        "humo tenue del horno serpenteando sobre el tiro, sombras danzando en la pared",
        "una caja de delivery de cartón kraft sin logos genéricos, recién cerrada sobre la mesada",
        "una bolsa térmica de delivery con vapor escapando ligeramente al abrirla, en una vereda nocturna",
        "una moto de delivery aparcada en una calle de adoquines bajo un farol, motoboy de espaldas con casco",
        "una ventana del local desde la calle, luz cálida naranja saliendo por dentro, lluvia en el vidrio",
        "una mesa servida con una pizza al centro, copas de vino, manos a punto de cortar (sin caras)",
        "un mostrador con una pizza recién apoyada para entrega, ticket impreso al lado",
        "una pizarra de menú escrita a tiza con las variedades del día y los horarios"
      ],
      "forbiddenObjects": [
        "pizzas estilo americano (deep dish, pepperoni industrial, queso fundido excesivo, masa gruesa esponjosa)",
        "pizza con piña, con papas fritas encima, pizza dulce o rellenos exóticos",
        "delivery boxes de cartón con logos de cadenas o branding genérico imitando fast food",
        "fast food (hamburguesas, papas fritas, hot dogs, nuggets)",
        "bebidas gaseosas con logos visibles, cerveza industrial en lata, latas o botellas con etiquetas claras",
        "electrónica moderna (laptops, celulares, tablets) como protagonista de la imagen",
        "decoración rústica fake estilo trattoria turística (canastas de mimbre, manteles a cuadros rojos saturados, banderas italianas en miniatura)",
        "platos emplatados tipo Instagram food de día con luz natural perfecta y fondo blanco",
        "marketing de food court / shopping (carteles luminosos, menús de PVC plastificados)",
        "caras como sujeto principal o sonriendo a cámara"
      ]
    }
  }
};


export default function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const sessionAuth = sessionStorage.getItem("social_core_authenticated");
    const localAuth = localStorage.getItem("social_core_authenticated");
    return sessionAuth === "true" || localAuth === "true";
  });

  const handleLogin = (passcode, rememberMe) => {
    const configPassword = import.meta.env.VITE_APP_PASSWORD || "selvacore2026";
    if (passcode === configPassword) {
      if (rememberMe) {
        localStorage.setItem("social_core_authenticated", "true");
      } else {
        sessionStorage.setItem("social_core_authenticated", "true");
      }
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem("social_core_authenticated");
    sessionStorage.removeItem("social_core_authenticated");
    setIsAuthenticated(false);
  };

  // Config & API Keys State
  const [geminiKey, setGeminiKey] = useLocalStorage("gemini_api_key", import.meta.env.VITE_GEMINI_API_KEY || "");
  const [openaiKey, setOpenaiKey] = useLocalStorage("openai_api_key", import.meta.env.VITE_OPENAI_API_KEY || "");
  const [falaiKey, setFalaiKey] = useLocalStorage("falai_api_key", import.meta.env.VITE_FALAI_API_KEY || "");
  const [preferredProvider, setPreferredProvider] = useLocalStorage("preferred_ai_provider", "openai");

  // Tab & Series states
  const [activeTab, setActiveTab] = useLocalStorage("active_tab", "portal");
  const [canvasApplyCallback, setCanvasApplyCallback] = useState(null);
  const [activeSeriesId, selectActiveSeries] = useActiveSeries();
  // Nota: useSeries vive dentro de SeriesPlanner. Acá solo necesitamos saber
  // que existe la serie activa; el updateSlot real lo pasa SeriesPlanner
  // vía el callback onOpenCanvasStudio(slot, applyUpdate).


  // Visual generation mode: 'text_bg' (local canvas, free), 'text_with_image' (small AI asset + canvas), 'full_image' (premium full AI)
  const [visualMode, setVisualMode] = useLocalStorage("visual_mode", "text_bg");
  const [bgOptions, setBgOptions] = useState({
    bgType: "solid",
    align: "center",
    angle: 135,
    primary: "",   // empty → derived from brand
    secondary: "",  // empty → derived from brand
    layout: "headline_puro",
    accentStyle: "none",
    decorativeElement: "none",
    showBrandMark: false
  });

  // Brand database state
  const [customBrands, setCustomBrands] = useLocalStorage("custom_brands", {});
  const [activeBrandId, setActiveBrandId] = useState("selva-digital");

  // Input fields state
  const [platform, setPlatform] = useState("feed");
  const [angle, setAngle] = useState("aida");
  const [postPrompt, setPostPrompt] = useState("");
  const [visualPrompt, setVisualPrompt] = useState("");

  // Outputs / Live mockup contents state
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageText, setImageText] = useState("");
  const [caption, setCaption] = useState("");
  const [storyText, setStoryText] = useState("");
  const [storySticker, setStorySticker] = useState("Ver Portfolio →");

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Status & Loader States
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [apiFeedback, setApiFeedback] = useState(null);
  const [lastTextModelUsed, setLastTextModelUsed] = useState("");
  const [lastImageModelUsed, setLastImageModelUsed] = useState("");

  // Reference image and context states
  const [referenceImage, setReferenceImage] = useState(null);
  const [referenceDescription, setReferenceDescription] = useState("");
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  // Suggested Ideas generator states
  const [suggestedIdeas, setSuggestedIdeas] = useState([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [usePortfolioCases, setUsePortfolioCases] = useLocalStorage("use_portfolio_cases", false);

  // Merge default and custom brands
  const allBrands = { ...BRANDS_DB, ...customBrands };
  const activeBrand = allBrands[activeBrandId] || allBrands["selva-digital"];

  // Apply theme dynamically when brand changes
  useEffect(() => {
    if (activeBrand && activeBrand.theme) {
      document.documentElement.style.setProperty('--accent', activeBrand.theme.accent);
      document.documentElement.style.setProperty('--accent-rgb', activeBrand.theme.accentRgb || "43, 182, 115");
      document.documentElement.style.setProperty('--accent-text', activeBrand.theme.accentText || "#000");
      document.documentElement.style.setProperty('--bg-dark', '#0d0e12');
      document.documentElement.style.setProperty('--brand-bg-dark', activeBrand.theme.darkBg || "#0A0B0D");
      if (activeBrand.theme.accentSecondary) {
        document.documentElement.style.setProperty('--accent-secondary', activeBrand.theme.accentSecondary);
        document.documentElement.style.setProperty('--accent-secondary-rgb', activeBrand.theme.accentSecondaryRgb || "0, 229, 255");
      } else {
        document.documentElement.style.removeProperty('--accent-secondary');
        document.documentElement.style.removeProperty('--accent-secondary-rgb');
      }

      // Dynamically update browser tab title to reflect the active brand
      document.title = `Social Core — ${activeBrand.name}`;

      // Dynamically map active brand font-family to global CSS variable
      const brandFont = activeBrand.theme.fonts?.split('&')[0]?.trim() || 'Outfit';
      document.documentElement.style.setProperty('--font-brand', `"${brandFont}", "Outfit", "Inter", sans-serif`);

      // Inject Google Fonts link if the brand declares one (keyed so we never duplicate)
      const fontsUrl = activeBrand.theme.fontsUrl;
      if (fontsUrl && /^https:\/\/fonts\.googleapis\.com\//.test(fontsUrl)) {
        const linkId = `brand-fonts-${activeBrand.id}`;
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = fontsUrl;
          link.dataset.brandFonts = '1';
          document.head.appendChild(link);
        }
      }
    }
  }, [activeBrandId, activeBrand]);

  // Load defaults when brand changes
  useEffect(() => {
    if (activeBrand && activeBrand.defaults) {
      setGeneratedImage(null); // Clear active image to use fallback dynamic gradient
      setImageText(activeBrand.defaults.feedText ? activeBrand.defaults.feedText.replace(/\\n/g, '\n') : '');
      setCaption(activeBrand.defaults.caption ? activeBrand.defaults.caption.replace(/\\n/g, '\n') : '');
      setStoryText(activeBrand.defaults.storyText ? activeBrand.defaults.storyText.replace(/\\n/g, '\n') : '');
      setStorySticker(activeBrandId === "selva-digital" ? "Ver Portfolio →" : "Consultar ahora →");
      setVisualPrompt(""); // Trigger FunnelWorkspace useEffect to recalculate visual prompt
      setReferenceImage(null); // Reset product reference image for new brand
      setReferenceDescription(""); // Reset product reference description
      setSuggestedIdeas([]); // Reset AI suggested ideas for new brand
    }
  }, [activeBrandId]);

  // Prompt compiler for AI Copywriting
  const buildOptimizedPrompt = () => {
    const brand = activeBrand;
    const cleanPrompt = postPrompt.trim() || "Crear una publicación comercial destacando los beneficios clave de nuestro servicio.";
    const targetPersona = brand.defaults?.targetPersona || "Audiencia general interesada en soluciones profesionales.";

    const positioning = brand.positioning;
    const positioningBlock = positioning ? `
POSITIONING (no negociable):
- Tipo: ${positioning.type === 'freelancer' ? 'FREELANCER (NO agencia). Hablar en primera persona singular ("yo hago", "te entrego"), nunca "nuestro equipo".' : positioning.type}
- Diferenciador clave: ${positioning.differentiator}
- Modelo de pago: ${positioning.payment}
- Hosting/dominio: ${positioning.hosting}
- PROHIBIDO usar jerga técnica de proveedor (Core Web Vitals, agéntico, multi-bot multiusuario, stack, framework). Hablar de RESULTADOS para el cliente: tiempo recuperado, ventas que se concretan, clientes que dejan de esperar.` : '';

    return `Estás redactando contenido de marketing para la marca "${brand.name}".
DATOS DE LA MARCA:
- Slogan: ${brand.slogan}
- Web: ${brand.website}
- Audiencia Objetivo (Buyer Persona): ${targetPersona}
- Contacto: Email: ${brand.contact?.email} · WhatsApp: ${brand.contact?.whatsapp}
- Pautas Visuales: Acento principal ${brand.theme?.accent}${brand.theme?.accentSecondary ? `, acento secundario ${brand.theme.accentSecondary}` : ''}, fuentes ${brand.theme?.fonts}
- Tono de Voz: Directo, coloquial argentino (rioplatense), frases cortas, palabras clave en negrita, llamados a la acción directos con flecha (→). Evitar corporativismos absurdos.
${positioningBlock}

FORMATO REQUERIDO:
${(platform === 'feed' || platform === 'feed_square') ? `Canal: Instagram Feed (${platform === 'feed' ? 'Vertical 4:5' : 'Cuadrado 1:1'}).
Por favor entregá dos secciones separadas obligatoriamente:

1. [TEXTO IMAGEN]: El **headline de la gráfica** — el texto que va GRANDE sobre el fondo. Debe ser un gancho potente que **detenga el scroll** y comunique el ángulo del post de un vistazo. Reglas estrictas:
   - Entre 6 y 14 palabras totales, repartidas en **2 a 4 líneas cortas** (usá saltos de línea reales, NO el caracter "/").
   - Las líneas deben tener jerarquía: una línea es el "dolor" o "gancho", otra es la "promesa" o "solución".
   - Hablar DIRECTO al lector ("vos", "tu negocio"), en español rioplatense argentino.
   - Puede incluir 1 número concreto si suma impacto (ej: "24/7", "+34%", "$0 cuotas").
   - PROHIBIDO: markdown (no usar ** ni _), emojis, comillas, hashtags, signos de exclamación múltiples.
   - PROHIBIDO frases vagas tipo "Dejá de perder ventas ya" o "Hacé crecer tu negocio". Tiene que estar atado al tema específico del post.
   - Pensá: si alguien ve SOLO esta gráfica sin caption, ¿entiende de qué se trata el post? Si la respuesta es no, reescribilo.

2. [CAPTION]: El copy persuasivo para la publicación de Instagram. Reglas:
   - Tono editorial, conversacional rioplatense. Sin sonar a "anuncio".
   - Permitidos emojis sobrios y puntuales (✓, ✗, ·, →, ←) cuando sumen jerarquía. Evitar emojis marketeros saturados (🚀, 💯, 🔥, 💪).
   - PROHIBIDO usar hashtags. NI UNO. Hashtags ya no aportan alcance orgánico en Instagram 2026 y ensucian el caption editorial. Si querés categorizar, dejá el caption limpio: los hashtags van — opcionalmente — en el primer comentario, no acá.
   - PROHIBIDO menciones forzadas a la propia marca con @ en el cuerpo. Si tiene sentido firmar al final, se hace de forma orgánica, no como CTA automatizado.
   - Cerrá con una pregunta, una reflexión o un CTA contextual (no genérico).` : `Canal: Instagram Story (9:16).
Por favor entregá:
1. [TEXTO HISTORIA]: Texto corto y potente en tarjetas de lectura rápida para superponer en la historia (máx 3-4 líneas).
2. [TEXTO STICKER]: El texto que irá en el sticker interactivo con llamado a la acción.`}

ÁNGULO ESTRATÉGICO / FÓRMULA PERSUASIVA APLICADA:
${angle === 'aida' ? 'Estructura AIDA. A (Atención): Llamado de atención disruptivo sobre el dolor o la oportunidad del cliente; I (Interés): Despertar interés con datos reales o verdades incómodas; D (Deseo): Generar deseo a través del escenario ideal de libertad, comodidad o ganancias; A (Acción): Llamado a la acción directo sin fricción.' : ''}
${angle === 'pas' ? 'Estructura PAS. P (Problema): Identificar y enunciar el problema o frustración principal que sufre nuestro Buyer Persona; A (Agitación): Agitar el dolor de forma visceral, detallando las consecuencias negativas de no resolverlo; S (Solución): Presentar de forma rotunda nuestra solución como la única opción lógica.' : ''}
${angle === 'bab' ? 'Estructura BAB (Before, After, Bridge). Before (Antes): Describir la situación dolorosa actual del cliente; After (Después): Describir el estado ideal resuelto y optimizado; Bridge (Puente): Mostrar cómo nuestra marca y producto son el puente perfecto e indispensable.' : ''}
${angle === 'storytelling' ? 'Storytelling & Conexión Emocional. Iniciar con una anécdota personal o caso hiper-empático donde alguien sufría un dolor común, contar el punto de quiebre o epifanía y cómo esta marca solucionó el problema brindando paz mental, estatus o rentabilidad. El tono debe ser íntimo, de confesión sincera y real.' : ''}
${angle === 'objection_killer' ? 'Derribador de Objeciones (FAQ Persuasivo). Tomar las 3 preguntas, miedos o dudas silenciosas más comunes que tiene el Buyer Persona y derribarlas de frente con honestidad brutal, datos duros y tranquilidad extrema. (Ej. "¿Es caro?", "¿Me va a durar?", "¿Realmente funciona?").' : ''}
${angle === 'education_challenge' ? 'Desafío Educativo / Lanzamiento de Valor de 5 días. Presentar la oferta no como una compra impulsiva, sino como un desafío estructurado o workshop de transformación donde el cliente aprenderá o resolverá paso a paso su frustración principal con la ayuda e identidad de la marca.' : ''}
${angle === 'transformation' ? 'Enfoque absoluto en el AHORRO DE TIEMPO y DINERO. Mostrar cuánto tiempo recupera el cliente o cuánto dinero le genera.' : ''}
${angle === 'success_story' ? 'Destacar testimonios o pruebas del portfolio reales: MegaMuebles (+34% leads), Iguazú Falls Lodge (67% reservas sin comisiones), El Fogón Delivery (x2.3 ticket promedio).' : ''}
${angle === 'direct_offer' ? 'Oferta comercial directa, detallando precios de forma transparente, escasez de cupos reales y un CTA claro con urgencia.' : ''}

DESCRIPCIÓN DE LA TAREA / TEMA ESPECÍFICO:
"${cleanPrompt}"

${referenceDescription.trim() ? `CONTEXTO MULTIMODAL (IMAGEN DE REFERENCIA):
La imagen de referencia cargada muestra la siguiente descripción de producto/entorno/personaje: "${referenceDescription.trim()}". Si es relevante para el tema del post, incorpora de forma inteligente y natural detalles de este producto, materiales, colores o atributos en la redacción persuasiva. No inventes características físicas que contradigan esta descripción.` : ''}

RESPONDE ÚNICAMENTE CON EL FORMATO ESTRUCTURADO SIGUIENTE (SIN EXPLICACIONES EXTRAS):
${(platform === 'feed' || platform === 'feed_square') ? `[TEXTO IMAGEN]
(frase de impacto)

[CAPTION]
(copy persuasivo)` : `[TEXTO HISTORIA]
(texto para la historia)

[TEXTO STICKER]
(sticker de enlace)`}`;
  };

  // Compile image prompt
  const buildImagePromptCompiled = (text) => {
    const brand = activeBrand;
    // Safeguard in case 'text' is an Event object or undefined
    const safeText = (typeof text === 'string' ? text : "").replace(/[\r\n]+/g, " ").replace(/"/g, "'").trim();

    if (visualPrompt.trim()) {
      return visualPrompt;
    }

    // ============================================================
    // PALETA: color primario + secundario sutil (tercer color) tomados
    // siempre del brand kit. El secundario debe usarse como detalle
    // mínimo (un highlight, una línea fina, un reflejo) — nunca compite
    // con el primario. Si la marca no tiene secundario, omitimos.
    // ============================================================
    const primary = brand.theme?.accent || "#2BB673";
    const secondary = brand.theme?.accentSecondary || null;
    const secondaryClause = secondary
      ? ` Use ${secondary} ONLY as a subtle finishing accent — a single thin highlight, a faint glow on one edge, a tiny reflection or one micro-detail at most. It must NEVER dominate or compete with the primary color ${primary}.`
      : "";

    // Core brand style descriptors
    const brandStyle = brand.id === "selva-digital"
      ? `Minimalist cyber-organic technology aesthetic. Primary color: vibrant emerald green ${primary} as the dominant accent (highlights, glows, key surfaces).${secondaryClause} Soft futuristic volumetric lighting, sleek dark metallic and glass textures, premium abstract digital composition, 8k resolution, photorealistic concept art.`
      : (brand.id === "mega-muebles" || brand.name.toLowerCase().includes("mueble")
        ? `Beautiful luxury interior design showroom, cozy minimalist living room, elegant craftsmanship, soft shadows, primary warm tone ${primary}.${secondaryClause} Photorealistic, architectural digest style, 8k resolution.`
        : (brand.id === "impasto-pizzas" || brand.name.toLowerCase().includes("pizza")
          ? `Gourmet culinary styling, warm rustic atmosphere, soft steam rising, primary warm color ${primary}.${secondaryClause} Photorealistic 8k, extremely appetizing, beautiful food photography.`
          : `Exquisite modern visual design, premium high-end styling. Primary accent: ${primary}.${secondaryClause} Elegant composition, photorealistic 8k, gorgeous lighting.`));

    // Cuando estamos en modo full_image, le pedimos al AI que incluya
    // el headline DENTRO de la imagen de manera legible y profesional
    // (sans-serif limpio, contraste alto). Si no estamos en ese modo,
    // omitimos para que la imagen quede limpia y el mockup superponga.
    const bakedTextClause = (visualMode === 'full_image' && safeText)
      ? ` Render the following headline AS PART OF the composition, in a clean modern sans-serif font, high contrast against the background, perfectly legible, no fake or garbled letters, no watermark — only this exact text: "${safeText}". Place it within the design as if it were the magazine cover headline.`
      : "";

    if (referenceDescription.trim()) {
      return `A professional high-end render and photography of the reference subject described as: "${referenceDescription.trim()}". Representing: "${safeText}". Staged beautifully in: ${brandStyle}${bakedTextClause}`;
    }

    if (brand.id === "selva-digital") {
      return `A stunning, high-end 3D digital rendering and illustration representing the concept: "${safeText}". ${brandStyle}${bakedTextClause}`;
    } else if (brand.id === "mega-muebles" || brand.name.toLowerCase().includes("mueble")) {
      return `Professional high-end showroom product photography showing: "${safeText}". ${brandStyle}${bakedTextClause}`;
    } else if (brand.id === "impasto-pizzas" || brand.name.toLowerCase().includes("pizza")) {
      return `Professional close-up food photography of: "${safeText}". ${brandStyle}${bakedTextClause}`;
    } else {
      return `${brandStyle} Showcasing the concept: "${safeText}".${bakedTextClause}`;
    }
  };

  // Parse response strings into React state
  const parseAndRenderOutput = (text) => {
    const cleanUsername = activeBrand.name.toLowerCase().replace(/\s+/g, '.');
    
    if (platform === "feed" || platform === "feed_square") {
      let imgText = "Tu web vendiendo 24/7.";
      let cap = "";

      if (text.includes("[TEXTO IMAGEN]")) {
        const parts = text.split(/\[TEXTO IMAGEN\]|\[CAPTION\]/i);
        imgText = parts[1]?.trim().replace(/^[\r\n]+|[\r\n]+$/g, "") || imgText;
        cap = parts[2]?.trim().replace(/^[\r\n]+|[\r\n]+$/g, "") || "";
      } else {
        cap = text;
      }

      setImageText(imgText);
      
      // Ensure username formatting in the caption
      let formattedCaption = cap;
      if (!formattedCaption.startsWith(`<strong>${cleanUsername}</strong>`)) {
        formattedCaption = `<strong>${cleanUsername}</strong> ` + formattedCaption;
      }
      setCaption(formattedCaption);
    } else {
      let stText = "Tu web vendiendo 24/7.";
      let sticker = "Ver Portfolio →";

      if (text.includes("[TEXTO HISTORIA]")) {
        const parts = text.split(/\[TEXTO HISTORIA\]|\[TEXTO STICKER\]/i);
        stText = parts[1]?.trim().replace(/^[\r\n]+|[\r\n]+$/g, "") || stText;
        sticker = parts[2]?.trim().replace(/^[\r\n]+|[\r\n]+$/g, "") || sticker;
      } else {
        stText = text;
      }

      setStoryText(stText);
      setStorySticker(sticker);
    }
  };

  // 1. GENERATE COPY PERSUASIVE
  const handleGenerateCopy = async () => {
    setIsGeneratingCopy(true);
    setApiFeedback(null);

    const compiledTextPrompt = buildOptimizedPrompt();
    let textResult = "";
    let successfulModel = "";
    const providers = preferredProvider === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];
    let errors = [];

    for (const provider of providers) {
      try {
        if (provider === "gemini") {
          if (!geminiKey) throw new Error("Clave de Gemini no configurada.");
          textResult = await generateTextWithGemini(compiledTextPrompt, geminiKey);
          successfulModel = "Gemini 3.5 Flash";
        } else {
          if (!openaiKey) throw new Error("Clave de OpenAI no configurada.");
          textResult = await generateTextWithOpenAI(compiledTextPrompt, openaiKey);
          successfulModel = "GPT-4.1-mini";
        }
        break; // Éxito, salir del bucle
      } catch (err) {
        errors.push({ provider, message: err.message });
      }
    }

    if (!textResult) {
      setApiFeedback({
        type: "error",
        message: `<strong>Falla en todas las APIs configuradas para Copy:</strong><br>${errors.map(e => `• ${e.provider === "gemini" ? "Gemini" : "OpenAI"}: ${e.message}`).join("<br>")}`
      });
      setIsGeneratingCopy(false);
      return;
    }

    setLastTextModelUsed(successfulModel);
    const isFallbackUsed = providers[0] !== (successfulModel === "Gemini 3.5 Flash" ? "gemini" : "openai");

    parseAndRenderOutput(textResult);

    // Sincronizar el sandbox visual con el texto generado
    const updatedImageText = (platform === "feed" || platform === "feed_square")
      ? textResult.split(/\[TEXTO IMAGEN\]|\[CAPTION\]/i)[1]?.trim().replace(/^[\r\n]+|[\r\n]+$/g, "") || ""
      : textResult.split(/\[TEXTO HISTORIA\]|\[TEXTO STICKER\]/i)[1]?.trim().replace(/^[\r\n]+|[\r\n]+$/g, "") || "";
    if (updatedImageText) {
      const generatedImagePrompt = buildImagePromptCompiled(updatedImageText);
      setVisualPrompt(generatedImagePrompt);
    }
    
    setApiFeedback({
      type: "success",
      message: `<strong>¡Copy generado con éxito!</strong> Redactado por ${successfulModel}.${isFallbackUsed ? " (Recurrido a Backup por falla en preferido)" : ""}`
    });
    
    setIsGeneratingCopy(false);
    return textResult;
  };

  // 2. GENERATE ILLUSTRATION VISUAL
  const handleGenerateImage = async (referenceText = "") => {
    setIsGeneratingImage(true);
    setApiFeedback(null);

    const safeReferenceText = (typeof referenceText === 'string') ? referenceText : "";
    const lookupText = safeReferenceText || ((platform === "feed" || platform === "feed_square") ? imageText : storyText);

    // MODE: text_bg → local canvas render, zero API cost
    if (visualMode === "text_bg") {
      try {
        const dataUrl = await renderTextBackgroundAsync({
          text: lookupText || activeBrand.defaults?.feedText || "Tu marca, en vivo.",
          brand: activeBrand,
          platform,
          options: {
            bgType: bgOptions.bgType,
            align: bgOptions.align,
            angle: bgOptions.angle,
            primary: bgOptions.primary || undefined,
            secondary: bgOptions.secondary || undefined,
            fontFamily: activeBrand.theme?.fonts?.split('&')[0]?.trim() || 'Outfit',
            layout: bgOptions.layout || 'headline_puro',
            fontScale: bgOptions.fontScale || 1.0,
            accentStyle: bgOptions.accentStyle || 'ticks',
            uploadedImage: bgOptions.uploadedImage || null,
            imageZoom: bgOptions.imageZoom || 1.0,
            imageOffsetX: bgOptions.imageOffsetX || 0,
            imageOffsetY: bgOptions.imageOffsetY || 0,
            imageFit: bgOptions.imageFit || 'cover',
            splitRatio: bgOptions.splitRatio ?? 0.5,
            tertiary: bgOptions.tertiary || '#00E5FF',
            decorativeElement: bgOptions.decorativeElement || 'none',
            showBrandMark: bgOptions.showBrandMark ?? true,
            secondaryText: bgOptions.secondaryText || "",
            decorativeIntensity: bgOptions.decorativeIntensity ?? 1.0,
            textOffsetX: bgOptions.textOffsetX ?? 0,
            textOffsetY: bgOptions.textOffsetY ?? 0,
            imageSide: bgOptions.imageSide || "right",
            textColor: bgOptions.textColor || "#FAFAFA",
            accentColor: bgOptions.accentColor || ""
          }
        });
        setGeneratedImage(dataUrl);
        setLastImageModelUsed("Canvas Local (Gratis)");
        setApiFeedback({
          type: "success",
          message: "<strong>Fondo + texto renderizado localmente.</strong> Sin costo de API."
        });
      } catch (err) {
        setApiFeedback({
          type: "error",
          message: `<strong>Error renderizando localmente:</strong> ${err.message}`
        });
      }
      setIsGeneratingImage(false);
      return;
    }

    // MODE: text_with_image → la imagen IA se genera dentro del Canvas Studio
    if (visualMode === "text_with_image") {
      setIsStudioOpen(true);
      setApiFeedback({
        type: "success",
        message: "<strong>Abriendo Canvas Studio + IA.</strong> Elegí un layout dividido y usá el panel <em>✨ Generar con IA</em> del uploader."
      });
      setIsGeneratingImage(false);
      return;
    }

    // MODE: full_image → existing premium AI flow
    const compiledImagePrompt = buildImagePromptCompiled(lookupText);

    let base64Result = "";
    let successfulModel = "";
    let imageProviders = [];
    
    if (referenceImage) {
      // Prioritize product consistency (Gemini Nano Banana Pro)
      imageProviders = ["gemini", "openai"];
    } else {
      // Prioritize low-cost and speed (Fal.ai FLUX Schnell)
      imageProviders = ["falai", "gemini", "openai"];
    }

    // Respect preferred provider override unless product consistency is strictly required
    if (preferredProvider && !referenceImage) {
      imageProviders = [preferredProvider, ...imageProviders.filter(p => p !== preferredProvider)];
    }

    let errors = [];

    for (const provider of imageProviders) {
      try {
        if (provider === "falai") {
          if (!falaiKey) throw new Error("Clave de Fal.ai no configurada.");
          base64Result = await generateImageWithFalAI(compiledImagePrompt, falaiKey);
          successfulModel = "FLUX Schnell (Fal.ai)";
        } else if (provider === "gemini") {
          if (!geminiKey) throw new Error("Clave de Gemini no configurada.");
          base64Result = await generateImageWithGemini(compiledImagePrompt, geminiKey);
          successfulModel = "Nano Banana 2 (Gemini)";
        } else {
          if (!openaiKey) throw new Error("Clave de OpenAI no configurada.");
          base64Result = await generateImageWithOpenAI(compiledImagePrompt, openaiKey);
          successfulModel = "GPT Image 2 (OpenAI)";
        }
        break; // Éxito, salir del bucle
      } catch (err) {
        errors.push({ provider, message: err.message });
      }
    }

    if (!base64Result) {
      setApiFeedback({
        type: "warning",
        message: `<strong>Falla en la ilustración en todas las APIs configuradas:</strong><br>${errors.map(e => `• ${e.provider === "gemini" ? "Nano Banana 2" : e.provider === "falai" ? "FLUX Schnell" : "GPT Image 2"}: ${e.message}`).join("<br>")}`
      });
      setIsGeneratingImage(false);
      return;
    }

    setLastImageModelUsed(successfulModel);
    const isFallbackUsed = imageProviders[0] !== (successfulModel === "FLUX Schnell (Fal.ai)" ? "falai" : successfulModel === "Nano Banana 2 (Gemini)" ? "gemini" : "openai");

    setGeneratedImage(`data:image/png;base64,${base64Result}`);
    setApiFeedback({
      type: "success",
      message: `<strong>¡Contenido visual generado con éxito!</strong> Ilustrado por ${successfulModel}.${isFallbackUsed ? " (Recurrido a Backup por falla en preferido)" : ""}`
    });

    setIsGeneratingImage(false);
  };

  // 3. GENERATE ALL SECUENTIAL
  const handleGenerateAll = async () => {
    setIsGeneratingCopy(true);
    setIsGeneratingImage(true);
    setApiFeedback(null);

    const compiledTextPrompt = buildOptimizedPrompt();
    let textResult = "";
    let successfulTextModel = "";
    const providers = preferredProvider === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];
    let textErrors = [];

    // A. Generar Texto
    for (const provider of providers) {
      try {
        if (provider === "gemini") {
          if (!geminiKey) throw new Error("Clave de Gemini no configurada.");
          textResult = await generateTextWithGemini(compiledTextPrompt, geminiKey);
          successfulTextModel = "Gemini 3.5 Flash";
        } else {
          if (!openaiKey) throw new Error("Clave de OpenAI no configurada.");
          textResult = await generateTextWithOpenAI(compiledTextPrompt, openaiKey);
          successfulTextModel = "GPT-4.1-mini";
        }
        break;
      } catch (err) {
        textErrors.push({ provider, message: err.message });
      }
    }

    if (!textResult) {
      setApiFeedback({
        type: "error",
        message: `<strong>Falla en todas las APIs (Copy):</strong><br>${textErrors.map(e => `• ${e.provider === "gemini" ? "Gemini" : "OpenAI"}: ${e.message}`).join("<br>")}`
      });
      setIsGeneratingCopy(false);
      setIsGeneratingImage(false);
      return;
    }

    setLastTextModelUsed(successfulTextModel);
    parseAndRenderOutput(textResult);
    setIsGeneratingCopy(false);

    // Extraer fragmento para formular la imagen
    let textForImage = "Tu web vendiendo 24/7.";
    if (platform === "feed" || platform === "feed_square") {
      if (textResult.includes("[TEXTO IMAGEN]")) {
        textForImage = textResult.split(/\[TEXTO IMAGEN\]|\[CAPTION\]/i)[1]?.trim().replace(/^[\r\n]+|[\r\n]+$/g, "") || textForImage;
      }
    } else {
      if (textResult.includes("[TEXTO HISTORIA]")) {
        textForImage = textResult.split(/\[TEXTO HISTORIA\]|\[TEXTO STICKER\]/i)[1]?.trim().replace(/^[\r\n]+|[\r\n]+$/g, "") || textForImage;
      }
    }

    // MODE: text_bg → local canvas, skip image API
    if (visualMode === "text_bg") {
      try {
        const dataUrl = await renderTextBackgroundAsync({
          text: textForImage,
          brand: activeBrand,
          platform,
          options: {
            bgType: bgOptions.bgType,
            align: bgOptions.align,
            angle: bgOptions.angle,
            primary: bgOptions.primary || undefined,
            secondary: bgOptions.secondary || undefined,
            fontFamily: activeBrand.theme?.fonts?.split('&')[0]?.trim() || 'Outfit',
            layout: bgOptions.layout || 'headline_puro',
            fontScale: bgOptions.fontScale || 1.0,
            accentStyle: bgOptions.accentStyle || 'ticks',
            uploadedImage: bgOptions.uploadedImage || null,
            imageZoom: bgOptions.imageZoom || 1.0,
            imageOffsetX: bgOptions.imageOffsetX || 0,
            imageOffsetY: bgOptions.imageOffsetY || 0,
            imageFit: bgOptions.imageFit || 'cover',
            splitRatio: bgOptions.splitRatio ?? 0.5,
            tertiary: bgOptions.tertiary || '#00E5FF',
            decorativeElement: bgOptions.decorativeElement || 'none',
            showBrandMark: bgOptions.showBrandMark ?? true,
            secondaryText: bgOptions.secondaryText || "",
            decorativeIntensity: bgOptions.decorativeIntensity ?? 1.0,
            textOffsetX: bgOptions.textOffsetX ?? 0,
            textOffsetY: bgOptions.textOffsetY ?? 0,
            imageSide: bgOptions.imageSide || "right",
            textColor: bgOptions.textColor || "#FAFAFA",
            accentColor: bgOptions.accentColor || ""
          }
        });
        setGeneratedImage(dataUrl);
        setLastImageModelUsed("Canvas Local (Gratis)");
        const isTextFallback = providers[0] !== (successfulTextModel === "Gemini 3.5 Flash" ? "gemini" : "openai");
        setApiFeedback({
          type: "success",
          message: `<strong>¡Pieza completa!</strong><br />• Redacción: ${successfulTextModel}${isTextFallback ? " (Backup)" : ""}<br />• Visual: Canvas Local (sin costo)`
        });
      } catch (err) {
        setApiFeedback({
          type: "warning",
          message: `<strong>Texto OK por ${successfulTextModel}, pero falló el render local:</strong> ${err.message}`
        });
      }
      setIsGeneratingImage(false);
      return;
    }

    // MODE: text_with_image → la imagen IA se genera dentro del Canvas Studio
    if (visualMode === "text_with_image") {
      setIsStudioOpen(true);
      setApiFeedback({
        type: "success",
        message: `<strong>Texto generado por ${successfulTextModel}.</strong> Abriendo Canvas Studio + IA — generá la imagen del slot desde el panel <em>✨ Generar con IA</em>.`
      });
      setIsGeneratingImage(false);
      return;
    }

    // MODE: full_image → existing premium AI flow
    const compiledImagePrompt = buildImagePromptCompiled(textForImage);
    let base64Result = "";
    let successfulImageModel = "";
    let imageProviders = [];
    
    if (referenceImage) {
      imageProviders = ["gemini", "openai"];
    } else {
      imageProviders = ["falai", "gemini", "openai"];
    }

    if (preferredProvider && !referenceImage) {
      imageProviders = [preferredProvider, ...imageProviders.filter(p => p !== preferredProvider)];
    }

    let imageErrors = [];

    // B. Generar Imagen
    for (const provider of imageProviders) {
      try {
        if (provider === "falai") {
          if (!falaiKey) throw new Error("Clave de Fal.ai no configurada.");
          base64Result = await generateImageWithFalAI(compiledImagePrompt, falaiKey);
          successfulImageModel = "FLUX Schnell (Fal.ai)";
        } else if (provider === "gemini") {
          if (!geminiKey) throw new Error("Clave de Gemini no configurada.");
          base64Result = await generateImageWithGemini(compiledImagePrompt, geminiKey);
          successfulImageModel = "Nano Banana 2 (Gemini)";
        } else {
          if (!openaiKey) throw new Error("Clave de OpenAI no configurada.");
          base64Result = await generateImageWithOpenAI(compiledImagePrompt, openaiKey);
          successfulImageModel = "GPT Image 2 (OpenAI)";
        }
        break;
      } catch (err) {
        imageErrors.push({ provider, message: err.message });
      }
    }

    if (!base64Result) {
      setApiFeedback({
        type: "warning",
        message: `<strong>Texto redactado por ${successfulTextModel}, pero falló la ilustración en todas las APIs:</strong><br>${imageErrors.map(e => `• ${e.provider === "gemini" ? "Nano Banana 2" : e.provider === "falai" ? "FLUX Schnell" : "GPT Image 2"}: ${e.message}`).join("<br>")}`
      });
      setIsGeneratingImage(false);
      return;
    }

    setLastImageModelUsed(successfulImageModel);
    setGeneratedImage(`data:image/png;base64,${base64Result}`);

    const isTextFallback = providers[0] !== (successfulTextModel === "Gemini 3.5 Flash" ? "gemini" : "openai");
    const isImageFallback = imageProviders[0] !== (successfulImageModel === "FLUX Schnell (Fal.ai)" ? "falai" : successfulImageModel === "Nano Banana 2 (Gemini)" ? "gemini" : "openai");

    let successMsg = "<strong>¡Fórmula completa generada con éxito!</strong><br />";
    successMsg += `• Redacción: ${successfulTextModel}${isTextFallback ? " (Backup)" : ""}<br />`;
    successMsg += `• Ilustración: ${successfulImageModel}${isImageFallback ? " (Backup)" : ""}`;
    
    setApiFeedback({
      type: "success",
      message: successMsg
    });

    setIsGeneratingImage(false);
  };

  // Acciones de Carga Manual
  const handleManualImageUpload = (base64Data) => {
    setGeneratedImage(base64Data);
    setLastImageModelUsed("Carga Manual (Usuario)");
    setApiFeedback({
      type: "success",
      message: "<strong>Imagen cargada con éxito</strong>. Se ha aplicado como fondo del simulador visual."
    });
  };

  // Acciones de Referencia Contexto Multimodal
  const handleReferenceImageUpload = (base64Data) => {
    setReferenceImage(base64Data);
    setReferenceDescription(""); // Limpiar descripción previa
    setApiFeedback({
      type: "success",
      message: "<strong>Imagen de referencia cargada</strong>. Hacé clic en <strong>Analizar</strong> para que la IA extraiga su contexto visual."
    });
  };

  const handleClearReference = () => {
    setReferenceImage(null);
    setReferenceDescription("");
    setApiFeedback({
      type: "success",
      message: "<strong>Referencia eliminada</strong>. Se ha limpiado el contexto multimodal."
    });
  };

  const handleAnalyzeReference = async () => {
    if (!referenceImage) return;
    setIsAnalyzingImage(true);
    setApiFeedback(null);

    const promptText = "Analyze this product, environment, or character image in high detail. Extract its unique visual features: materials, textures, colors, shapes, style, and essential attributes so a text-to-image generator can recreate it consistently. Respond with a single concise descriptive paragraph (max 80 words) in English, focusing purely on description, no introductory filler.";

    let resultText = "";
    let successfulModel = "";
    const providers = preferredProvider === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];
    let errors = [];

    for (const provider of providers) {
      try {
        if (provider === "gemini") {
          if (!geminiKey) throw new Error("Clave de Gemini no configurada.");
          resultText = await analyzeImageWithGemini(referenceImage, geminiKey, promptText);
          successfulModel = "Gemini 3.5 Flash (Visión)";
        } else {
          if (!openaiKey) throw new Error("Clave de OpenAI no configurada.");
          resultText = await analyzeImageWithOpenAI(referenceImage, openaiKey, promptText);
          successfulModel = "GPT-4.1-mini (Visión)";
        }
        break;
      } catch (err) {
        errors.push({ provider, message: err.message });
      }
    }

    if (!resultText) {
      setApiFeedback({
        type: "error",
        message: `<strong>Error de análisis multimodal en todas las APIs:</strong><br>${errors.map(e => `• ${e.provider === "gemini" ? "Gemini" : "OpenAI"}: ${e.message}`).join("<br>")}`
      });
      setIsAnalyzingImage(false);
      return;
    }

    setReferenceDescription(resultText.trim());
    setLastTextModelUsed(successfulModel);
    const isFallbackUsed = providers[0] !== (successfulModel === "Gemini 3.5 Flash (Visión)" ? "gemini" : "openai");

    setApiFeedback({
      type: "success",
      message: `<strong>¡Análisis completado!</strong> Procesado por ${successfulModel}.${isFallbackUsed ? " (Recurrido a Backup por falla en preferido)" : ""}`
    });
    
    setIsAnalyzingImage(false);
  };

  // Prompt compiler for AI suggested ideas
  const buildIdeasPrompt = () => {
    const brand = activeBrand;
    const targetPersona = brand.defaults?.targetPersona || "Audiencia general interesada en soluciones profesionales.";
    const persona = brand.buyerPersona || null;
    const activeAngle = angle;

    let angleDetails = "";
    if (activeAngle === 'aida') {
      angleDetails = "AIDA (Atención, Interés, Deseo, Acción): Ganchos y copy enfocados en irrumpir la atención del prospecto y llevarlo a tomar acción rápida.";
    } else if (activeAngle === 'pas') {
      angleDetails = "PAS (Problema, Agitación, Solución): Ganchos enfocados en agitar fuertemente el punto de dolor del Buyer Persona y presentarnos como la solución ideal.";
    } else if (activeAngle === 'bab') {
      angleDetails = "BAB (Before, After, Bridge): Mostrar el estado de frustración actual contra la situación de éxito futura y tender el puente de transformación.";
    } else if (activeAngle === 'storytelling') {
      angleDetails = "Storytelling: Conectar emocionalmente usando una historia real, empática e inspiradora de conversión vinculada a la marca.";
    } else if (activeAngle === 'objection_killer') {
      angleDetails = "Derribador de Objeciones: Identificar miedos y objeciones latentes (como precio, tiempos de entrega, confiabilidad) y neutralizarlos de forma directa.";
    } else if (activeAngle === 'education_challenge') {
      angleDetails = "Desafío Educativo / Aporte de Valor: Aportar un hack o insight de alto valor educativo relacionado a la industria de la marca.";
    } else {
      angleDetails = "Enfoque de conversión directo en los dolores y aspiraciones clave del cliente.";
    }

    // ============================================================
    // MUNICIÓN CONCRETA: rotamos servicio + dolor + objeción + trigger
    // de cada generación para evitar ideas genéricas y rotar entre
    // las verticales reales de Selva Digital (landing/eco/app/bot).
    // ============================================================
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    let serviceFocusBlock = "";
    let randomSeed = "Agitar un error crítico e invisible que el cliente comete diariamente y le cuesta caro.";

    if (persona && persona.dolores_por_servicio) {
      // Elegir 1 servicio al azar y traer 2 dolores específicos de ese servicio
      const serviceKeys = Object.keys(persona.dolores_por_servicio);
      const focusService = pick(serviceKeys);
      const servicePains = persona.dolores_por_servicio[focusService] || [];
      const shuffledPains = [...servicePains].sort(() => Math.random() - 0.5).slice(0, 2);
      const objection = persona.objeciones_reales ? pick(persona.objeciones_reales) : "";
      const trigger = persona.trigger_de_compra ? pick(persona.trigger_de_compra) : "";
      const competitor = persona.compite_contra ? pick(persona.compite_contra) : "";

      const serviceLabel = {
        landing_o_sitio_web: "LANDING PAGE / SITIO WEB",
        ecommerce: "TIENDA ONLINE / E-COMMERCE",
        app_web_o_nativa: "APP WEB O APP NATIVA (Android)",
        chatbot_ia: "CHATBOT CON IA EN WHATSAPP"
      }[focusService] || focusService.toUpperCase();

      serviceFocusBlock = `
SERVICIO PROTAGONISTA DE ESTA GENERACIÓN (elegido al azar — TODAS las 3 ideas deben girar alrededor de este servicio):
>>> ${serviceLabel} <<<

DOLORES ESPECÍFICOS de este servicio que DEBÉS agitar (usá al menos 2 de estos, literal o parafraseado, NO inventes dolores genéricos):
${shuffledPains.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}

OBJECIÓN REAL del prospecto (incluí 1 idea que la neutralice):
  → ${objection}

TRIGGER DE COMPRA (la situación concreta que lo está empujando AHORA a buscarte):
  → ${trigger}

COMPITE CONTRA (si comparás, comparalo contra esto, no contra "agencias genéricas"):
  → ${competitor}`;

      randomSeed = `Hablar HOY del servicio "${serviceLabel}" agitando uno de los dolores listados, no genéricos. Una de las 3 ideas debe responder la objeción "${objection}". Otra debe arrancar desde el trigger "${trigger}".`;
    } else {
      // Fallback para marcas sin buyerPersona estructurado
      const seeds = [
        "Agitar un error crítico e invisible que el cliente comete diariamente y le cuesta caro.",
        "Desenmascarar un mito popular de la competencia o de la industria tradicional.",
        "Plantear la paz mental y la libertad de tiempo que se gana al usar nuestra solución.",
        "Contrastar el costo real de seguir posponiendo la decisión vs. la inversión en nuestra oferta.",
        "Abordar directamente la objeción silenciosa más común del prospecto con empatía.",
        "Exponer una situación cotidiana estresante que vive el Buyer Persona y cómo el producto la resuelve por completo."
      ];
      randomSeed = pick(seeds);
    }

    // Reglas de lenguaje extraídas del persona (qué palabras evitar)
    let languageRules = "";
    if (persona && persona.lenguaje) {
      languageRules = `
REGLAS DE LENGUAJE NO NEGOCIABLES:
- USÁ estas palabras como las usa el dueño en su negocio: ${(persona.lenguaje.dice || []).map(w => `"${w}"`).join(", ")}.
- PROHIBIDO usar jerga técnica o de marketing: ${(persona.lenguaje.no_dice || []).map(w => `"${w}"`).join(", ")}. Si una idea contiene alguna de estas palabras, reescribila.`;
    }

    // Portfolio cases — only injected when the user explicitly opts in for this generation.
    // Otherwise the model gets an explicit "DO NOT name clients" rule.
    let brandCases = "";
    let portfolioRule = "";
    if (usePortfolioCases) {
      if (brand.id === "selva-digital") {
        brandCases = `
CASOS REALES DEL PORTFOLIO (usar como prueba social en las ideas):
- MegaMuebles: +34% leads orgánicos con sitio nuevo.
- Iguazú Falls Lodge: 67% reservas directas, sin comisión de OTAs.
- El Fogón Delivery: ticket promedio ×2.3 con automatización de pedidos.
- Vip Traslados Iguazú: CTR Google Ads ×2.1, -40% CPC.
- Megabot Admin: 3 bots IA procesando +1200 mensajes diarios.`;
      } else if (brand.id === "mega-muebles") {
        brandCases = `
PRODUCTOS REALES (usar como prueba social en las ideas):
- Mesa Maciza Roble Imperial: +480 familias la tienen en su comedor.
- Amoblamientos Nordelta: +120 salas a medida entregadas.
- Carpintería argentina real: 50 años de durabilidad, directo de fábrica.`;
      } else if (brand.id === "impasto-pizzas") {
        brandCases = `
HECHOS DEL PRODUCTO (usar como prueba social):
- Mejor Pizza Napoletana Artesanal de la Región 2025.
- +10.000 pizzas a leña a 450°C servidas.
- Fermentación en frío 48hs, masa madre.`;
      }
      portfolioRule = `5. Podés (no es obligatorio) anclar 1 de las 3 ideas en un caso/dato real del listado anterior. Las otras 2 deben hablar de dolor/transformación SIN nombrar casos.`;
    } else {
      portfolioRule = `5. PROHIBIDO mencionar nombres de clientes, casos de portfolio, marcas de terceros, números específicos de proyectos pasados ("+34%", "x2.3", etc.) o cualquier referencia a trabajos hechos. Hablá del dolor del buyer persona y de la promesa genérica del producto/servicio. Si necesitás dar una cifra, que sea hipotética y plausible ("podés ahorrar hasta 10 horas a la semana"), nunca atribuida a un cliente.`;
    }

    return `Sos un consultor de Copywriting y Funnels de Conversión de élite especializado en PyMEs argentinas. Necesito que generes exactamente 3 ideas creativas, potentes y persuasivas para publicaciones de Instagram de la marca "${brand.name}".

INFORMACIÓN DE LA MARCA:
- Nombre: ${brand.name}
- Slogan: ${brand.slogan}
- Sitio Web: ${brand.website}

BUYER PERSONA (perfil del prospecto):
${targetPersona}
${persona && persona.demografia ? `\nDemografía resumida: ${persona.demografia}` : ""}
${brandCases}
${serviceFocusBlock}

ÁNGULO PERSUASIVO SELECCIONADO:
- ${angleDetails}

ENFOQUE ESTRATÉGICO PARA ESTA ITERACIÓN:
- ${randomSeed}
${languageRules}

INSTRUCCIONES CRÍTICAS:
1. TODAS las 3 ideas deben girar alrededor del SERVICIO PROTAGONISTA listado arriba (si existe). NO mezcles servicios distintos en esta generación.
2. PROHIBIDO ser genérico. Cada idea debe nombrar una situación, número o escena concreta del rubro (ej: "responder 'sí, hacemos envíos' por 40ª vez a las 23hs", "el cliente que te pidió el link y le mandaste una captura", "la cuota de Tiendanube que ya te llegó a $35.000", "la web del sobrino que no abre en Android"). No vale decir "automatizá tu negocio" o "potenciá tu marca".
3. Tono coloquial rioplatense (argentino) directo, sin corporativismos. Hablale al dueño/a como un colega, no como una agencia.
4. Cada idea debe responder implícitamente: ¿cuánto tiempo o plata le devuelve esto al dueño?
5. Rotá intensamente entre clicks: no repitas el mismo gancho de una generación anterior. Si dudás entre dos ideas, elegí la más arriesgada.
6. NUNCA devuelvas explicaciones ni texto introductorio.
${portfolioRule}

FORMATO DE RETORNO OBLIGATORIO:
Debes responder ÚNICAMENTE con un array JSON válido que contenga exactamente 3 objetos. Ningún texto introductorio ni explicaciones. Solo el JSON.
Cada objeto del array JSON debe tener la siguiente estructura exacta:
[
  {
    "id": 1,
    "title": "Gancho Corto y Atractivo (Ej: ¿Seguís regalando tu tiempo?)",
    "description": "Una descripción accionable de 2 o 3 oraciones de lo que tratará el post. Debe plantear exactamente el tema del post, incluyendo ideas sobre el dolor específico a agitar y los beneficios de la marca."
  },
  {
    "id": 2,
    "title": "...",
    "description": "..."
  },
  {
    "id": 3,
    "title": "...",
    "description": "..."
  }
]`;
  };

  // Bulletproof JSON/regex parser for suggestion ideas
  const parseIdeasJson = (rawText) => {
    let cleanText = rawText.trim();
    
    // 1. Remove markdown code blocks if present
    if (cleanText.includes("```")) {
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        cleanText = match[1].trim();
      }
    }
    
    // 2. Try parsing directly
    try {
      const parsed = JSON.parse(cleanText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: item.id || idx + 1,
          title: item.title || `Idea ${idx + 1}`,
          description: item.description || (typeof item === 'string' ? item : "Idea sin descripción.")
        }));
      }
    } catch (e) {
      console.warn("Direct JSON parsing failed. Trying regex split fallbacks...", e);
    }

    // 3. Fallback: Parse using standard array extractor
    try {
      const startIdx = cleanText.indexOf('[');
      const endIdx = cleanText.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const potentialJson = cleanText.slice(startIdx, endIdx + 1);
        const parsed = JSON.parse(potentialJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            id: item.id || idx + 1,
            title: item.title || `Idea ${idx + 1}`,
            description: item.description || "Idea sin descripción."
          }));
        }
      }
    } catch (regexError) {
      console.warn("Regex array parse failed. Trying manual block parsing...", regexError);
    }

    // 4. Heavy-Duty Regex Fallback: Scan and extract curly-braced object blocks manually
    try {
      const ideas = [];
      const objectBlocks = cleanText.match(/\{[\s\S]*?\}/g);
      if (objectBlocks && objectBlocks.length > 0) {
        objectBlocks.forEach((block, idx) => {
          // Precise match for double-quoted string with support for escaped double-quotes
          const titleMatch = block.match(/"?title"?\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i);
          const descMatch = block.match(/"?description"?\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i);
          
          let title = titleMatch ? titleMatch[1].trim() : `Idea ${idx + 1}`;
          let description = descMatch ? descMatch[1].trim() : "";
          
          // Clean double-escaped quotes if present
          title = title.replace(/\\"/g, '"').replace(/\\n/g, '\n');
          description = description.replace(/\\"/g, '"').replace(/\\n/g, '\n');
          
          if (title || description) {
            ideas.push({
              id: idx + 1,
              title: title || `Idea ${idx + 1}`,
              description: description || "Publicación persuasiva y ganchos de conversión de alto impacto."
            });
          }
        });
        
        if (ideas.length > 0) {
          return ideas;
        }
      }
    } catch (regexBlockError) {
      console.warn("Manual block parsing failed. Falling back to high-quality static defaults.", regexBlockError);
    }

    // 5. Ultimate Fallback: Manual Regex split for title/description keys if JSON is fully broken & no blocks found
    try {
      const ideas = [];
      const titleRegex = /"title"\s*:\s*"([^"]+)"/g;
      const descRegex = /"description"\s*:\s*"([^"]+)"/g;
      
      let matchTitle, matchDesc;
      const titles = [];
      const descriptions = [];
      
      while ((matchTitle = titleRegex.exec(cleanText)) !== null) {
        titles.push(matchTitle[1]);
      }
      while ((matchDesc = descRegex.exec(cleanText)) !== null) {
        descriptions.push(matchDesc[1]);
      }

      if (titles.length > 0) {
        for (let i = 0; i < Math.min(3, titles.length); i++) {
          ideas.push({
            id: i + 1,
            title: titles[i],
            description: descriptions[i] || "Publicación persuasiva enfocada en tu buyer persona y el dolor clave de la marca."
          });
        }
        if (ideas.length > 0) return ideas;
      }
    } catch (simpleRegexErr) {
      console.warn("Simple regex extraction failed:", simpleRegexErr);
    }

    // 6. Hardcoded static fallbacks (high quality marketing fallbacks based on brand and angle)
    const brandName = activeBrand.name;
    const id = activeBrand.id;
    
    if (id === "selva-digital") {
      return [
        {
          id: 1,
          title: "¿Seguís respondiendo el mismo WhatsApp 40 veces al día?",
          description: "Planteá cómo el tiempo del dueño de negocio se esfuma respondiendo consultas manuales. Presentá la web automatizada como un empleado que vende 24/7 sin quejarse ni pedir vacaciones."
        },
        {
          id: 2,
          title: "El mito de la agencia mensual (Basta de sangrar dinero)",
          description: "Cuestioná los abonos mensuales de las agencias de marketing tradicionales. Explicá la libertad de tener una web a medida con un único pago y sin intermediarios."
        },
        {
          id: 3,
          title: "3 señales claras de que tu negocio necesita un embudo ya",
          description: "Identificá tres dolores clásicos: clientes que preguntan precio y desaparecen, falta de previsibilidad y horas perdidas en tareas repetitivas."
        }
      ];
    } else if (id === "mega-muebles" || brandName.toLowerCase().includes("mueble")) {
      return [
        {
          id: 1,
          title: "El costo oculto de comprar muebles baratos de melamina",
          description: "Desenmascará el gasto de comprar muebles de aglomerado que se doblan o rompen en mudanzas. Demostrá el valor de invertir en madera maciza real que dura generaciones."
        },
        {
          id: 2,
          title: "Cómo amueblar tu living con diseño atemporal y madera maciza",
          description: "Da tips prácticos de diseño de interiores sobre cómo combinar tonos cálidos de madera con espacios modernos, promoviendo la calidez y el confort."
        },
        {
          id: 3,
          title: "12 cuotas fijas directo de fábrica: Sin intermediarios",
          description: "Explicá el beneficio de comprar sin comisiones de locales o revendedores, directamente a los carpinteros con financiamiento súper amigable."
        }
      ];
    } else if (id === "impasto-pizzas" || brandName.toLowerCase().includes("pizza")) {
      return [
        {
          id: 1,
          title: "¿Por qué la pizza barata te deja sediento e hinchado?",
          description: "Explicá la ciencia detrás de la fermentación rápida de 2 horas. Presentá la fermentación en frío de 48 horas de Impasto como la única clave para una digestión ultraliviana."
        },
        {
          id: 2,
          title: "El arte de la masa madre y los bordes alveolados inflados",
          description: "Mostrá el proceso artesanal y visual de cocción a 450°C. Despertá el deseo describiendo el olor a leña y la textura crujiente de los bordes atigrados."
        },
        {
          id: 3,
          title: "El plan perfecto para esta noche: Pizza artesanal en casa",
          description: "Posicioná a Impasto como el premio ideal para cortar la semana o disfrutar el finde, detallando la conveniencia del delivery rápido y calentito."
        }
      ];
    } else {
      return [
        {
          id: 1,
          title: "El secreto para resolver tu mayor frustración hoy",
          description: `Analizá el dolor común de tu audiencia y presentá el producto de ${brandName} como la solución rápida y definitiva.`
        },
        {
          id: 2,
          title: "Lo que nadie te dice sobre los métodos tradicionales",
          description: `Compará las desventajas de lo convencional contra el enfoque innovador y los beneficios exclusivos que ofrece ${brandName}.`
        },
        {
          id: 3,
          title: "Cupos limitados: Por qué postergar te está costando dinero",
          description: `Generá urgencia y escasez comentando la alta demanda y los resultados comprobados de los clientes que ya tomaron acción.`
        }
      ];
    }
  };

  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(true);
    setApiFeedback(null);

    const compiledIdeasPrompt = buildIdeasPrompt();
    let rawResult = "";
    let successfulModel = "";
    const providers = preferredProvider === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];
    let errors = [];

    for (const provider of providers) {
      try {
        if (provider === "gemini") {
          if (!geminiKey) throw new Error("Clave de Gemini no configurada.");
          // Enforce Structured JSON mode for Gemini 3.5 Flash
          rawResult = await generateTextWithGemini(compiledIdeasPrompt, geminiKey, "application/json");
          successfulModel = "Gemini 3.5 Flash";
        } else {
          if (!openaiKey) throw new Error("Clave de OpenAI no configurada.");
          rawResult = await generateTextWithOpenAI(compiledIdeasPrompt, openaiKey);
          successfulModel = "GPT-4.1-mini";
        }
        break; // Éxito, salir del bucle
      } catch (err) {
        errors.push({ provider, message: err.message });
      }
    }

    if (!rawResult) {
      console.warn("Falla en todas las APIs para Ideas, usando fallbacks locales...", errors);
      const fallbacks = parseIdeasJson("");
      setSuggestedIdeas(fallbacks);
      setLastTextModelUsed("Sugerencias Locales (Estático)");
      setApiFeedback({
        type: "warning",
        message: `<strong>Sugerencias locales cargadas:</strong> Ambas APIs fallaron.<br>${errors.map(e => `• ${e.provider === "gemini" ? "Gemini" : "OpenAI"}: ${e.message}`).join("<br>")}`
      });
      setIsGeneratingIdeas(false);
      return;
    }

    setLastTextModelUsed(successfulModel);
    const isFallbackUsed = providers[0] !== (successfulModel === "Gemini 3.5 Flash" ? "gemini" : "openai");

    const ideas = parseIdeasJson(rawResult);
    setSuggestedIdeas(ideas);

    setApiFeedback({
      type: "success",
      message: `<strong>¡Propuestas de ideas cargadas!</strong> Sugeridas por ${successfulModel}.${isFallbackUsed ? " (Recurrido a Backup por falla en preferido)" : ""}`
    });
    
    setIsGeneratingIdeas(false);
  };

  const handleSelectIdea = (idea) => {
    setPostPrompt(idea.description);
    
    // Sync visual prompt sandbox based on the newly selected idea
    const brandName = activeBrand.name;
    const id = activeBrand.id;
    const cleanText = idea.description.replace(/[\r\n]+/g, " ").replace(/"/g, "'").slice(0, 100);

    // Colores de marca: primario dominante + secundario como detalle mínimo
    const _primary = activeBrand.theme?.accent || "#2BB673";
    const _secondary = activeBrand.theme?.accentSecondary || null;
    const _secondaryHint = _secondary
      ? ` Use ${_secondary} ONLY as a subtle finishing accent (one thin highlight, a faint glow on a single edge, or a tiny reflection). It must never compete with ${_primary}.`
      : "";

    let defaultPrompt = "";
    if (id === "selva-digital") {
      defaultPrompt = `A stunning, high-end 3D digital rendering and illustration representing: "${cleanText}". Minimalist cyber-organic technology aesthetic. Primary color: vibrant emerald green ${_primary} as the dominant accent (highlights, glows, surfaces).${_secondaryHint} Soft futuristic volumetric lighting, sleek dark metallic and glass textures, premium abstract digital composition, 8k resolution, photorealistic concept art.`;
    } else if (id === "mega-muebles" || brandName.toLowerCase().includes("mueble")) {
      defaultPrompt = `Professional high-end showroom product photography showing: "${cleanText}". Beautiful luxury interior design showroom, cozy minimalist living room, elegant solid wood craftsmanship, soft shadows, dominant warm tone ${_primary}.${_secondaryHint} Photorealistic, architectural digest style, 8k resolution.`;
    } else if (id === "impasto-pizzas" || brandName.toLowerCase().includes("pizza")) {
      defaultPrompt = `Professional close-up food photography of: "${cleanText}". Delicious wood-fired Napoletana pizza with fresh bubbling mozzarella, rich red tomato sauce ${_primary}, green basil, charred leopard spotting on the puffed crust, gourmet culinary styling, warm rustic atmosphere, soft steam rising.${_secondaryHint} Photorealistic 8k, extremely appetizing.`;
    } else {
      defaultPrompt = `Professional visual representation showcasing the concept: "${cleanText}" for the brand "${brandName}". Exquisite modern visual design, premium high-end styling. Primary accent: ${_primary}.${_secondaryHint} Elegant composition, photorealistic 8k, gorgeous lighting.`;
    }

    setVisualPrompt(defaultPrompt);

    setApiFeedback({
      type: "success",
      message: `<strong>Tema actualizado:</strong> "${idea.title}" se cargó en el editor. ¡Hacé clic en <strong>Generar Todo</strong> para crear tu publicación persuasiva!`
    });
  };

  // Export handlers
  const handleCopyCopy = () => {
    let copyText = "";
    if (platform === "feed" || platform === "feed_square") {
      copyText = caption.replace(/<br>/g, "\n").replace(/<\/?[^>]+(>|$)/g, ""); // strip HTML tags like strong
    } else {
      copyText = storyText.replace(/<br>/g, "\n") + `\n\nSticker Enlace CTA: ${storySticker}`;
    }
    
    navigator.clipboard.writeText(copyText);
    alert("¡Texto de copy copiado al portapapeles con éxito!");
  };

  const handleDownloadTxt = () => {
    let text = `MARCA: ${activeBrand.name}\nPLATAFORMA: ${platform.toUpperCase()}\nFECHA DE CREACIÓN: ${new Date().toLocaleDateString()}\n\n`;
    
    if (platform === "feed" || platform === "feed_square") {
      text += `--- TEXTO IMAGEN ---\n${imageText}\n\n`;
      text += `--- CAPTION ---\n${caption.replace(/<br>/g, "\n").replace(/<\/?[^>]+(>|$)/g, "")}\n`;
    } else {
      text += `--- TEXTO HISTORIA ---\n${storyText.replace(/<br>/g, "\n")}\n\n`;
      text += `--- TEXTO STICKER / CTA ---\n${storySticker}\n`;
    }

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `social_${activeBrandId}_${platform}_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
  };

  // Settings manager
  const handleSaveSettings = (gKey, oKey, fKey) => {
    setGeminiKey(gKey || "");
    setOpenaiKey(oKey);
    setFalaiKey(fKey || "");
    setIsSettingsOpen(false);

    setApiFeedback({
      type: "success",
      message: "<strong>Configuración guardada</strong>. Las credenciales se han actualizado de forma local."
    });
    setTimeout(() => setApiFeedback(null), 3000);
  };

  // Brand creator callback
  const handleSaveBrand = (newBrand) => {
    const updatedCustom = { ...customBrands, [newBrand.id]: newBrand };
    setCustomBrands(updatedCustom);
    setActiveBrandId(newBrand.id);
  };

  const handleOpenCreateWizard = () => {
    setBrandToEdit(null);
    setIsWizardOpen(true);
  };

  const handleOpenEditWizard = () => {
    setBrandToEdit(activeBrand);
    setIsWizardOpen(true);
  };

  if (!isAuthenticated) {
    return <LoginPortal onLogin={handleLogin} activeBrand={activeBrand} />;
  }

  return (
    <>
      {activeTab === 'portal' ? (
        <WelcomePortal
          activeBrand={activeBrand}
          allBrands={allBrands}
          activeBrandId={activeBrandId}
          setActiveBrandId={setActiveBrandId}
          setActiveTab={setActiveTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          setCurrentStep={setCurrentStep}
          onLogout={handleLogout}
        />

      ) : activeTab === 'series' ? (
        <SeriesPlanner
            onLogout={handleLogout}
            activeBrand={activeBrand}
            allBrands={allBrands}
            activeBrandId={activeBrandId}
            setActiveBrandId={setActiveBrandId}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenEditWizard={handleOpenEditWizard}
            geminiKey={geminiKey}
            openaiKey={openaiKey}
            preferredProvider={preferredProvider}
            falaiKey={falaiKey}
            onOpenCanvasStudio={(slot, applyUpdate, slideIdx) => {
              setPlatform('feed');

              // slideIdx (opcional): si es número >= 0, estamos editando un slide del carrusel.
              // Levantamos su canvasState/headline. Si es null/undefined, editamos el slot principal.
              const isCarouselSlide = typeof slideIdx === 'number' && slideIdx >= 0;
              const slideRef = isCarouselSlide ? slot.carouselSlides?.[slideIdx] : null;

              // Si el slot ya tiene un canvasState guardado de una edición previa,
              // lo restauramos tal cual. Si no, armamos los defaults para esta marca.
              const defaultBg = {
                bgType: 'solid',
                align: 'center',
                // 'data_metric' no existe en composer.js — usamos kicker_headline
                // que ya muestra kicker + número grande + bajada correctamente.
                layout: 'kicker_headline',
                primary: '#0A0B0D',
                secondary: '#121316',
                textColor: '#FAFAFA',
                accentColor: activeBrand.theme.accent,
                accentStyle: 'bracket_corners',
                decorativeElement: slot.visualLanguage === 'bw_lifestyle_emerald' ? 'circle_orb' : 'none',
                showBrandMark: true
              };

              const savedBg = isCarouselSlide ? slideRef?.canvasState?.bgOptions : slot.canvasState?.bgOptions;
              const savedText = isCarouselSlide ? slideRef?.canvasState?.text : slot.canvasState?.text;
              const seedText = isCarouselSlide
                ? (savedText ?? slideRef?.headline ?? `Slide ${slideIdx + 2}`)
                : (savedText ?? slot.copy.headline ?? "Titular de Gráfica");

              setBgOptions(savedBg ? { ...defaultBg, ...savedBg } : defaultBg);
              setImageText(seedText);

              setCanvasApplyCallback(() => (dataUrl, text, finalBg) => {
                // applyUpdate viene de SeriesPlanner y usa su updateSlot local.
                // finalBg llega como tercer argumento desde CanvasStudio (snapshot
                // fresco, no depende del state de App que aún no se commiteó).
                if (applyUpdate) {
                  applyUpdate({
                    generatedImageBase64: dataUrl,
                    copy: { ...slot.copy, headline: text },
                    canvasState: {
                      bgOptions: finalBg || null,
                      text
                    }
                  });
                }
              });

              setIsStudioOpen(true);
            }}
          />
      ) : activeTab === 'reels' ? (
        <ReelsPanel
          onLogout={handleLogout}
          activeBrand={activeBrand}
          allBrands={allBrands}
          activeBrandId={activeBrandId}
          setActiveBrandId={setActiveBrandId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenEditWizard={handleOpenEditWizard}
          geminiKey={geminiKey}
          openaiKey={openaiKey}
          preferredProvider={preferredProvider}
        />
      ) : activeTab === 'ads' ? (
        <FlyerAdsPanel
          onLogout={handleLogout}
          activeBrand={activeBrand}
          allBrands={allBrands}
          activeBrandId={activeBrandId}
          setActiveBrandId={setActiveBrandId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenEditWizard={handleOpenEditWizard}
          openaiKey={openaiKey}
          geminiKey={geminiKey}
          falaiKey={falaiKey}
        />
      ) : (
        <WizardShell
          onLogout={handleLogout}
          activeBrand={activeBrand}
          allBrands={allBrands}
          activeBrandId={activeBrandId}
          setActiveBrandId={setActiveBrandId}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenEditWizard={handleOpenEditWizard}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          platform={platform}
          setPlatform={setPlatform}
          angle={angle}
          setAngle={setAngle}
          postPrompt={postPrompt}
          setPostPrompt={setPostPrompt}
          visualPrompt={visualPrompt}
          setVisualPrompt={setVisualPrompt}
          isGeneratingCopy={isGeneratingCopy}
          isGeneratingImage={isGeneratingImage}
          onGenerateCopy={handleGenerateCopy}
          onGenerateImage={handleGenerateImage}
          onGenerateAll={handleGenerateAll}
          apiFeedback={apiFeedback}
          onCopyCopy={handleCopyCopy}
          onDownloadTxt={handleDownloadTxt}
          referenceImage={referenceImage}
          referenceDescription={referenceDescription}
          isAnalyzingImage={isAnalyzingImage}
          onReferenceImageUpload={handleReferenceImageUpload}
          onAnalyzeReference={handleAnalyzeReference}
          onClearReference={handleClearReference}
          setReferenceDescription={setReferenceDescription}
          suggestedIdeas={suggestedIdeas}
          isGeneratingIdeas={isGeneratingIdeas}
          onGenerateIdeas={handleGenerateIdeas}
          onSelectIdea={handleSelectIdea}
          setSuggestedIdeas={setSuggestedIdeas}
          usePortfolioCases={usePortfolioCases}
          setUsePortfolioCases={setUsePortfolioCases}
          preferredProvider={preferredProvider}
          setPreferredProvider={setPreferredProvider}
          visualMode={visualMode}
          setVisualMode={setVisualMode}
          bgOptions={bgOptions}
          setBgOptions={setBgOptions}
          onOpenStudio={() => setIsStudioOpen(true)}
          generatedImage={generatedImage}
          imageText={imageText}
          setImageText={setImageText}
          caption={caption}
          setCaption={setCaption}
          storyText={storyText}
          setStoryText={setStoryText}
          storySticker={storySticker}
          setStorySticker={setStorySticker}
          onManualImageUpload={handleManualImageUpload}
          lastTextModelUsed={lastTextModelUsed}
          lastImageModelUsed={lastImageModelUsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {/* MODALS & DRAWER */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        geminiKey={geminiKey}
        openaiKey={openaiKey}
        falaiKey={falaiKey}
        onSave={handleSaveSettings}
      />

      <BrandWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSaveBrand={handleSaveBrand}
        brandToEdit={brandToEdit}
      />

      <CanvasStudio
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        activeBrand={activeBrand}
        platform={platform}
        initialText={(platform === "feed" || platform === "feed_square") ? imageText : storyText}
        bgOptions={bgOptions}
        setBgOptions={setBgOptions}
        enableAiPanel={visualMode === 'text_with_image'}
        falaiKey={falaiKey}
        onApply={(dataUrl, text, finalBg) => {
          if (canvasApplyCallback) {
            canvasApplyCallback(dataUrl, text, finalBg);
            setCanvasApplyCallback(null);
          } else {
            setGeneratedImage(dataUrl);
            if (platform === "feed" || platform === "feed_square") {
              setImageText(text);
            } else {
              setStoryText(text);
            }
            setLastImageModelUsed("Canvas Studio (Gratis)");
            setApiFeedback({
              type: "success",
              message: "<strong>Pieza aplicada desde Canvas Studio.</strong> Sin costo de API."
            });
          }
        }}
      />
    </>
  );
}
