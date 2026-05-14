// ============================================================
// Integración de IA — OpenRouter (modelo Gemini 2.0 Flash)
// ============================================================
// SOLO se importa desde route handlers del servidor: la API key
// (OPENROUTER_API_KEY) nunca llega al navegador.
//
// Cada función intenta usar el modelo real y, si no hay API key
// o la llamada falla, cae a una heurística "simulada" basada en
// palabras clave. El enunciado permite simular la IA de forma
// controlada; así la demo nunca se queda sin respuesta.
// ============================================================

import { CATEGORIES, PRIORITIES } from './constants'
import type { Category, Priority } from './constants'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemini-2.0-flash-exp:free'

export type AiMode = 'ia' | 'simulado'
export type Sentiment = 'frustrado' | 'neutral' | 'urgente'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export function aiEnabled(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY)
}

// Llamada cruda al modelo. Lanza error si no hay key o la API falla,
// para que quien la use decida el fallback.
async function callModel(
  messages: ChatMessage[],
  { temperature = 0.4 }: { temperature?: number } = {},
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY no configurada')

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // OpenRouter recomienda identificar la app (opcional).
      'X-Title': 'Help Desk EduLabs',
    },
    body: JSON.stringify({ model: MODEL, messages, temperature }),
  })

  if (!res.ok) {
    throw new Error(`OpenRouter respondió ${res.status}`)
  }
  const data = await res.json()
  const content: string | undefined = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('Respuesta vacía del modelo')
  return content.trim()
}

// Extrae el primer objeto JSON que aparezca en un texto (los modelos
// a veces lo envuelven en ```json ... ``` o agregan texto alrededor).
function extractJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No se encontró JSON en la respuesta')
  return JSON.parse(match[0]) as T
}

// ------------------------------------------------------------
// Heurísticas de respaldo (modo "simulado")
// ------------------------------------------------------------

function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // quita tildes/acentos
}

function guessCategory(text: string): Category {
  const t = norm(text)
  const rules: [RegExp, Category][] = [
    [/correo|email|outlook|gmail|bandeja/, 'Correo'],
    [/impresora|imprimir|toner|tinta|escaner/, 'Impresoras'],
    [/red|wifi|internet|conexion|vpn|lento|cae/, 'Redes'],
    [/contrasena|acceso|login|usuario|cuenta|sesion|password|bloquead/, 'Cuentas y Acceso'],
    [/instalar|software|programa|aplicacion|licencia|excel|word|office|actualiz/, 'Software'],
    [/computador|pc|pantalla|teclado|mouse|proyector|cable|equipo|hardware|monitor|portatil|bateria/, 'Hardware'],
  ]
  for (const [re, cat] of rules) if (re.test(t)) return cat
  return 'Otros'
}

function guessPriority(text: string): Priority {
  const t = norm(text)
  if (/urgente|inmediat|critico|caido|no puedo trabajar|reunion|ya mismo|bloquead|perdiendo/.test(t)) {
    return 'Alta'
  }
  if (/cuando puedan|sin prisa|no es urgente|cuando tengan tiempo|baja prioridad/.test(t)) {
    return 'Baja'
  }
  return 'Media'
}

function guessSentiment(text: string): Sentiment {
  const t = norm(text)
  if (/molest|frustrad|cansad|otra vez|siempre|pesimo|no sirve|inaceptable|!!!|enojad/.test(t)) {
    return 'frustrado'
  }
  if (/urgente|ya mismo|inmediat|ahora|no puedo trabajar|reunion/.test(t)) {
    return 'urgente'
  }
  return 'neutral'
}

// ============================================================
// MÓDULO 2.1 — Asistente al CREAR un ticket (lado del usuario)
// ============================================================

export interface TicketSuggestion {
  category: Category
  priority: Priority
  rewrittenTitle: string | null
  rewrittenDescription: string | null
  reason: string
  mode: AiMode
}

export async function suggestTicketMeta(
  title: string,
  description: string,
): Promise<TicketSuggestion> {
  const text = `${title}\n${description}`

  try {
    const raw = await callModel([
      {
        role: 'system',
        content:
          'Eres un asistente de una mesa de ayuda (Help Desk). Analizas el texto de un ' +
          'ticket de soporte y respondes ÚNICAMENTE con un objeto JSON válido, sin texto extra.',
      },
      {
        role: 'user',
        content:
          `Título: "${title}"\nDescripción: "${description}"\n\n` +
          `Devuelve un JSON con esta forma exacta:\n` +
          `{\n` +
          `  "category": una de ${JSON.stringify(CATEGORIES)},\n` +
          `  "priority": una de ${JSON.stringify(PRIORITIES)},\n` +
          `  "rewrittenTitle": un título más claro y breve (o null si ya está bien),\n` +
          `  "rewrittenDescription": una descripción más clara (o null si ya está bien),\n` +
          `  "reason": una frase corta explicando la categoría y prioridad elegidas\n` +
          `}`,
      },
    ])
    const parsed = extractJson<Partial<TicketSuggestion>>(raw)
    const category = (CATEGORIES as readonly string[]).includes(parsed.category as string)
      ? (parsed.category as Category)
      : guessCategory(text)
    const priority = (PRIORITIES as readonly string[]).includes(parsed.priority as string)
      ? (parsed.priority as Priority)
      : guessPriority(text)
    return {
      category,
      priority,
      rewrittenTitle: parsed.rewrittenTitle?.trim() || null,
      rewrittenDescription: parsed.rewrittenDescription?.trim() || null,
      reason: parsed.reason?.trim() || 'Sugerencia generada por IA.',
      mode: 'ia',
    }
  } catch {
    // Fallback simulado
    return {
      category: guessCategory(text),
      priority: guessPriority(text),
      rewrittenTitle: null,
      rewrittenDescription: null,
      reason:
        'Sugerencia por palabras clave (modo simulado): se detectó el tema y la urgencia ' +
        'a partir del texto del ticket.',
      mode: 'simulado',
    }
  }
}

// ============================================================
// MÓDULO 2.2 — Asistente al ATENDER un ticket (lado del agente)
// ============================================================

export interface TicketAnalysis {
  sentiment: Sentiment
  suggestedReply: string
  mode: AiMode
}

export async function analyzeTicket(ticket: {
  title: string
  description: string
  category: string
  requester_name: string
}): Promise<TicketAnalysis> {
  const text = `${ticket.title}\n${ticket.description}`

  try {
    const raw = await callModel([
      {
        role: 'system',
        content:
          'Eres un asistente para agentes de soporte técnico. Respondes ÚNICAMENTE con un ' +
          'objeto JSON válido, sin texto adicional.',
      },
      {
        role: 'user',
        content:
          `Ticket de ${ticket.requester_name} — categoría ${ticket.category}.\n` +
          `Título: "${ticket.title}"\nDescripción: "${ticket.description}"\n\n` +
          `Devuelve un JSON:\n` +
          `{\n` +
          `  "sentiment": uno de ["frustrado","neutral","urgente"],\n` +
          `  "suggestedReply": una primera respuesta o solución sugerida para el ` +
          `agente, en español, cordial y concreta (máx 5 frases)\n` +
          `}`,
      },
    ])
    const parsed = extractJson<Partial<TicketAnalysis>>(raw)
    const sentiment: Sentiment = (['frustrado', 'neutral', 'urgente'] as const).includes(
      parsed.sentiment as Sentiment,
    )
      ? (parsed.sentiment as Sentiment)
      : guessSentiment(text)
    return {
      sentiment,
      suggestedReply:
        parsed.suggestedReply?.trim() ||
        'Hola, gracias por reportar el inconveniente. Estamos revisando tu caso y te contactaremos en breve.',
      mode: 'ia',
    }
  } catch {
    const sentiment = guessSentiment(text)
    const tono =
      sentiment === 'frustrado'
        ? 'Lamentamos los inconvenientes y entendemos tu molestia. '
        : sentiment === 'urgente'
          ? 'Entendemos que es urgente y le daremos prioridad. '
          : ''
    return {
      sentiment,
      suggestedReply:
        `Hola ${ticket.requester_name}, gracias por tu reporte. ${tono}` +
        `Estamos revisando el caso "${ticket.title}". Para avanzar más rápido, ` +
        `¿podrías confirmarnos desde cuándo ocurre y si aparece algún mensaje de error? ` +
        `(respuesta sugerida en modo simulado)`,
      mode: 'simulado',
    }
  }
}

// Pregunta libre del agente al asistente, desde el panel del ticket.
export async function askAssistant(
  ticket: { title: string; description: string; category: string; status: string },
  question: string,
): Promise<{ answer: string; mode: AiMode }> {
  try {
    const answer = await callModel([
      {
        role: 'system',
        content:
          'Eres un asistente experto en soporte técnico que ayuda a un agente de mesa de ' +
          'ayuda. Respondes en español, de forma concreta y práctica.',
      },
      {
        role: 'user',
        content:
          `Contexto del ticket:\n- Título: ${ticket.title}\n- Descripción: ${ticket.description}\n` +
          `- Categoría: ${ticket.category}\n- Estado: ${ticket.status}\n\n` +
          `Pregunta del agente: ${question}`,
      },
    ])
    return { answer, mode: 'ia' }
  } catch {
    return {
      answer:
        'Modo simulado: para este tipo de caso, lo habitual es (1) reproducir el problema, ' +
        '(2) revisar los pasos básicos según la categoría del ticket, y (3) documentar la ' +
        'solución en el historial. Configura OPENROUTER_API_KEY para obtener respuestas reales del modelo.',
      mode: 'simulado',
    }
  }
}

// ============================================================
// MÓDULO 3 — Chat en vivo
// ============================================================

interface ChatTurn {
  sender_role: string
  sender_name: string | null
  content: string
}

function toChatHistory(messages: ChatTurn[]): ChatMessage[] {
  return messages
    .filter((m) => m.sender_role !== 'sistema')
    .map((m) => ({
      role: m.sender_role === 'usuario' ? 'user' : 'assistant',
      content: m.content,
    }))
}

// Respuesta de la IA directamente al usuario (cuando no hay agente).
export async function chatReplyForUser(
  messages: ChatTurn[],
): Promise<{ reply: string; mode: AiMode }> {
  try {
    const reply = await callModel(
      [
        {
          role: 'system',
          content:
            'Eres el asistente virtual del Help Desk de EduLabs. Atiendes a un usuario en ' +
            'un chat en vivo porque no hay agentes disponibles. Responde en español, breve, ' +
            'cordial y útil. Si el problema es complejo, indícale que un agente puede unirse al chat.',
        },
        ...toChatHistory(messages),
      ],
      { temperature: 0.6 },
    )
    return { reply, mode: 'ia' }
  } catch {
    return {
      reply:
        'Soy el asistente virtual (modo simulado). Cuéntame con más detalle qué problema ' +
        'tienes y te oriento; si lo necesitas, un agente puede unirse a este chat. ' +
        '(Configura OPENROUTER_API_KEY para respuestas reales del modelo.)',
      mode: 'simulado',
    }
  }
}

// Sugerencia de respuesta para el AGENTE (la IA asiste en segundo plano).
export async function chatSuggestionForAgent(
  messages: ChatTurn[],
): Promise<{ suggestion: string; mode: AiMode }> {
  try {
    const suggestion = await callModel(
      [
        {
          role: 'system',
          content:
            'Eres un copiloto para un agente de soporte que está atendiendo un chat en vivo. ' +
            'Lee la conversación y propone, en español, la siguiente respuesta que el agente ' +
            'podría enviar al usuario. Devuelve solo el texto sugerido, sin comillas ni prefijos.',
        },
        ...toChatHistory(messages),
      ],
      { temperature: 0.5 },
    )
    return { suggestion, mode: 'ia' }
  } catch {
    return {
      suggestion:
        'Gracias por tu paciencia. Voy a revisar lo que me comentas y te ayudo a resolverlo ' +
        'paso a paso. (sugerencia en modo simulado)',
      mode: 'simulado',
    }
  }
}
