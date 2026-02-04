import { corsHeaders, handleCors } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

interface NodeData {
  id: string
  type: string
  label: string
  description?: string
  [key: string]: unknown
}

type ExportFormat = 'standard' | 'lovable' | 'claude-code' | 'firebase-studio' | 'navigation' | 'user-stories'

interface RequestBody {
  projectName: string
  projectDescription: string
  graph: {
    nodes: NodeData[]
    edges: Array<{ id: string; source: string; target: string; label?: string }>
    gaps: Array<{ id: string; description: string; severity: string; resolved: boolean }>
  }
  messages: Array<{ role: string; content: string }>
  part?: 1 | 2 | 3 | 4 | 5  // Which part to generate (standard uses 5 parts, others use 2)
  format?: ExportFormat  // Export format for different vibe-coding tools
}

function getSystemPrompt(part: 1 | 2 | 3 | 4 | 5, format: ExportFormat = 'standard'): string {
  if (format === 'lovable') {
    return getLovableSystemPrompt(part as 1 | 2)
  }
  if (format === 'claude-code') {
    return getClaudeCodeSystemPrompt(part as 1 | 2)
  }
  if (format === 'firebase-studio') {
    return getFirebaseStudioSystemPrompt(part as 1 | 2)
  }
  if (format === 'navigation') {
    return getNavigationSystemPrompt()
  }
  if (format === 'user-stories') {
    return getUserStoriesSystemPrompt()
  }
  return getStandardSystemPrompt(part)
}

function getUserStoriesSystemPrompt(): string {
  return `Du bist ein erfahrener Product Owner, der User Stories für Kundenbesprechungen erstellt.

WICHTIG: Dieses Dokument ist für KUNDEN gedacht, nicht für Entwickler!
- Keine technischen Begriffe
- Keine Implementierungsdetails
- Einfache, verständliche Sprache
- Fokus auf NUTZEN für den Anwender

## AUSGABE-FORMAT

# User Stories - [Projektname]

## Projektübersicht
*2-3 Sätze die erklären, was die Software macht und welches Problem sie löst. So einfach, dass es jeder versteht.*

---

## Benutzerrollen

Erkläre kurz, wer die Software nutzen wird:

| Rolle | Beschreibung |
|-------|--------------|
| 👤 Administrator | Verwaltet das System und Benutzer |
| 👥 Mitarbeiter | Tägliche Nutzung der Hauptfunktionen |
| 👁️ Gast | Eingeschränkter Zugriff |

---

## Funktionen nach Bereich

### 🏠 [Bereichsname]

**Was kann der Nutzer hier tun?**
*Kurze Beschreibung des Bereichs in 1-2 Sätzen*

| # | Als... | möchte ich... | um... | Priorität |
|---|--------|---------------|-------|-----------|
| 1 | Mitarbeiter | meine Übersicht sehen | schnell alle wichtigen Infos zu haben | ⭐ Wichtig |
| 2 | Admin | Benutzer verwalten | Zugänge zu kontrollieren | ⭐ Wichtig |
| 3 | Nutzer | Daten exportieren | sie offline nutzen zu können | ○ Optional |

### 📊 [Nächster Bereich]
...

---

## Zusammenfassung

| Kategorie | Anzahl |
|-----------|--------|
| ⭐ Wichtige Funktionen | X |
| ○ Optionale Funktionen | Y |
| **Gesamt** | **Z** |

---

## Offene Fragen

Falls es unklare Punkte gibt, liste sie hier:
- [ ] Frage 1?
- [ ] Frage 2?

---

✅ **USER STORIES VOLLSTÄNDIG**

## REGELN

1. **Einfache Sprache**: Keine Fachbegriffe, keine Abkürzungen
2. **Nutzen betonen**: Immer erklären WARUM etwas wichtig ist
3. **Priorisierung**:
   - ⭐ Wichtig = Must-have für den Start
   - ○ Optional = Nice-to-have, kann später kommen
4. **Gruppierung**: Nach Funktionsbereichen, nicht nach technischen Modulen
5. **Kurz halten**: Max 20-30 User Stories, sonst wird es unübersichtlich
6. **Emojis sparsam**: Nur für Rollen und Bereiche zur besseren Übersicht

WICHTIG:
- Nutze deutsche Sprache
- Vermeide: API, Backend, Frontend, Database, Server, Client, etc.
- Stattdessen: "das System", "die Anwendung", "im Hintergrund"
- Beende IMMER mit "✅ **USER STORIES VOLLSTÄNDIG**"`
}

function getNavigationSystemPrompt(): string {
  return `Du bist ein erfahrener UX-Architekt und Technical Writer, der Navigationsstrukturen für Software-Projekte erstellt.

Deine Aufgabe: Erstelle eine übersichtliche Navigationsstruktur basierend auf den Architektur-Komponenten (Nodes) und deren Verbindungen (Edges).

## AUSGABE-FORMAT

### 1. Hierarchischer Navigationsbaum (ASCII/Markdown)

Zeige die komplette Struktur als eingerückten Baum:

\`\`\`
📱 App Name
├── 🏠 Dashboard
│   ├── Übersicht
│   ├── Statistiken
│   └── Quick Actions
├── 👤 Benutzerverwaltung
│   ├── Profil
│   │   ├── Persönliche Daten
│   │   └── Einstellungen
│   ├── Berechtigungen
│   └── Aktivitätslog
├── 📊 [Hauptbereich 1]
│   ├── [Unterseite]
│   └── [Unterseite]
└── ⚙️ Einstellungen
    ├── Allgemein
    ├── Benachrichtigungen
    └── System
\`\`\`

### 2. Mermaid Flowchart

Erstelle ein Mermaid-Diagramm das die Navigation und Verknüpfungen zeigt:

\`\`\`mermaid
flowchart TD
    subgraph Main["🏠 Hauptnavigation"]
        A[Dashboard]
        B[Bereich 1]
        C[Bereich 2]
    end

    subgraph Sub1["📊 Bereich 1"]
        B1[Unterseite 1]
        B2[Unterseite 2]
    end

    A --> B
    A --> C
    B --> B1
    B --> B2
    B1 -.-> C
\`\`\`

### 3. Navigations-Tabelle

| Screen | Parent | Typ | Beschreibung | Verknüpft mit |
|--------|--------|-----|--------------|---------------|
| Dashboard | - | Hauptseite | Übersicht | Alle Bereiche |
| Profil | Benutzer | Unterseite | Benutzerdaten | Einstellungen |

### 4. User Flows (wichtigste Pfade)

Beschreibe die 3-5 wichtigsten Navigationspfade:

**Flow 1: [Name]**
\`Home → Bereich → Unterseite → Aktion\`

**Flow 2: [Name]**
\`Home → ... → ...\`

## REGELN

1. **Hierarchie ableiten**: Analysiere die Edges um Parent-Child-Beziehungen zu erkennen
2. **Typen erkennen**:
   - "frontend", "page", "screen", "view" → Navigierbare Screens
   - "component", "ui" → UI-Elemente (als Unterpunkte)
   - "backend", "api", "database" → Nicht in Navigation (aber als Verknüpfung erwähnen)
3. **Icons verwenden**: Passende Emojis für Bereiche (🏠 Home, 👤 User, ⚙️ Settings, 📊 Data, etc.)
4. **Verknüpfungen zeigen**: Gestrichelte Linien (-.->)für Querverweise zwischen Bereichen
5. **KI-lesbar**: Struktur so aufbauen, dass Vibe-Coding Tools sie verstehen

## WICHTIG

- Nutze deutsche Sprache
- Fokussiere auf NAVIGIERBARE Elemente (Screens, Pages, Views)
- Backend-Komponenten als "verbunden mit" erwähnen, nicht als Navigation
- Halte das Mermaid-Diagramm übersichtlich (max 15-20 Nodes)
- Beende mit "✅ **NAVIGATIONSSTRUKTUR VOLLSTÄNDIG**"`
}

function getLovableSystemPrompt(part: 1 | 2): string {
  if (part === 1) {
    return `Du bist ein erfahrener Technical Writer, der Knowledge-Files für Lovable (lovable.dev) erstellt.

Lovable ist ein KI-gesteuerter Full-Stack Web-App Builder. Knowledge-Files werden als Kontext für die KI verwendet.

Du schreibst TEIL 1 des Knowledge-Files.

STRUKTUR FÜR TEIL 1:

# [Projektname] - Lovable Knowledge File

## Product Vision
Klare, inspirierende Beschreibung des Produkts in 2-3 Sätzen.
Was macht es einzigartig? Welches Problem löst es?

## Design Philosophy
Beschreibe den gewünschten visuellen Stil mit Design-Buzzwords:
- Beispiele: "minimal", "premium", "developer-focused", "playful", "corporate", "modern SaaS"
- Farbpalette-Hinweise
- Typografie-Stil

## User Journeys
Für JEDEN Benutzertyp:
### [Rolle]
1. Schritt-für-Schritt User Flow
2. Was sieht der Benutzer?
3. Welche Aktionen kann er durchführen?

## Core Features
Liste ALLER Features mit:
- Feature-Name
- Beschreibung
- Priorität (Must-have / Nice-to-have)
- Verknüpfte User Journey

## Tech Stack Requirements
- Frontend: React + TypeScript + Tailwind (Lovable Standard)
- State Management: Empfehlung
- UI Components: shadcn/ui (Lovable Standard)
- Icons: lucide-react

---
**[TEIL 1 ENDE - FORTSETZUNG IN TEIL 2]**

WICHTIG:
- Nutze deutsche Sprache
- Sei SEHR detailliert bei User Journeys
- Design-Buzzwords helfen Lovable den richtigen Stil zu generieren`
  }

  return `Du bist ein erfahrener Technical Writer, der Knowledge-Files für Lovable erstellt.

Du schreibst TEIL 2 des Knowledge-Files (beginne direkt mit Backend).

STRUKTUR FÜR TEIL 2:

## Backend Architecture
### Supabase Setup
- Tabellen-Struktur (Lovable nutzt Supabase nativ)
- Row Level Security (RLS) Policies
- Edge Functions falls benötigt

### API Design
- Endpoints und deren Zweck
- Request/Response Beispiele

## Data Models
Für JEDE Entität:
\`\`\`typescript
interface EntityName {
  id: string
  field1: type
  field2: type
  // Beziehungen
  relatedEntity?: RelatedType
}
\`\`\`

## Authentication & Authorization
- Auth-Flow (Supabase Auth)
- Rollen und Berechtigungen
- Protected Routes

## Component Guidelines
### Layout
- Header/Navigation Struktur
- Sidebar falls vorhanden
- Footer

### Reusable Components
Liste wiederverwendbarer UI-Komponenten:
- Komponenten-Name
- Props
- Verwendungszweck

## Integration Points
- Externe APIs
- Webhooks
- Third-party Services

## Deployment Notes
- Environment Variables
- Supabase Project Setup

---
✅ **LOVABLE KNOWLEDGE FILE VOLLSTÄNDIG**

WICHTIG:
- TypeScript Interfaces für alle Datenmodelle
- Supabase-spezifische Syntax verwenden
- Beende IMMER mit "✅ **LOVABLE KNOWLEDGE FILE VOLLSTÄNDIG**"`
}

function getClaudeCodeSystemPrompt(part: 1 | 2): string {
  if (part === 1) {
    return `Du bist ein erfahrener Technical Writer, der CLAUDE.md Dateien für Claude Code erstellt.

CLAUDE.md ist die "Memory"-Datei für Claude Code CLI. Sie sollte UNTER 300 Zeilen sein und prägnant bleiben.

Du schreibst TEIL 1 der CLAUDE.md.

STRUKTUR FÜR TEIL 1:

# [Projektname]

## Project Overview
Kurze Beschreibung (2-3 Sätze): Was ist das Projekt, welches Problem löst es?

## Quick Start
\`\`\`bash
# Installation
npm install  # oder pnpm/yarn

# Development
npm run dev

# Build
npm run build
\`\`\`

## Architecture
### Directory Structure
\`\`\`
src/
├── components/     # React Komponenten
├── hooks/          # Custom Hooks
├── lib/            # Utilities & Services
├── pages/          # Routen
└── types/          # TypeScript Types
\`\`\`

### Core Components
Liste der wichtigsten Komponenten mit kurzer Beschreibung.

### Data Flow
Wie fließen Daten durch die Anwendung?

## Code Style
### Naming Conventions
- Komponenten: PascalCase
- Hooks: useFeatureName
- Utils: camelCase
- Types: PascalCase

### Patterns
- State Management Ansatz
- Error Handling Pattern
- API Call Pattern

---
**[TEIL 1 ENDE - FORTSETZUNG IN TEIL 2]**

WICHTIG:
- PRÄGNANT bleiben - keine langen Erklärungen
- Bullet Points statt Prosa
- Code-Beispiele nur wo nötig`
  }

  return `Du bist ein erfahrener Technical Writer, der CLAUDE.md Dateien für Claude Code erstellt.

Du schreibst TEIL 2 der CLAUDE.md (beginne direkt mit Commands).

STRUKTUR FÜR TEIL 2:

## Commands
| Command | Description |
|---------|-------------|
| npm run dev | Start dev server |
| npm run build | Production build |
| npm run test | Run tests |
| npm run lint | Lint code |

## Environment Variables
\`\`\`env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# Weitere...
\`\`\`

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/resource | Beschreibung |
| POST | /api/resource | Beschreibung |

## Database Schema
Kurze Übersicht der wichtigsten Tabellen und Beziehungen.

## Testing
- Test Framework und Setup
- Wie Tests ausführen
- Coverage Requirements

## Gotchas
⚠️ Bekannte Probleme und Workarounds:
- Problem 1: Lösung
- Problem 2: Lösung

## Dependencies
Wichtige Dependencies und warum sie verwendet werden:
- dependency-name: Zweck

## Deployment
- Deployment-Prozess
- CI/CD Pipeline falls vorhanden

---
✅ **CLAUDE.md VOLLSTÄNDIG**

WICHTIG:
- Gesamtdokument sollte UNTER 300 Zeilen sein
- Keine redundanten Informationen
- Fokus auf das was Claude Code wissen MUSS
- Beende IMMER mit "✅ **CLAUDE.md VOLLSTÄNDIG**"`
}

function getFirebaseStudioSystemPrompt(part: 1 | 2): string {
  if (part === 1) {
    return `Du bist ein erfahrener Technical Writer, der Prompts für Firebase Studio (App Prototyping Agent) erstellt.

Firebase Studio verwendet einen "Elevator Pitch" Ansatz - beschreibe die App so, als hättest du nur 10-30 Sekunden.

Du schreibst TEIL 1 des Firebase Studio Prompts.

STRUKTUR FÜR TEIL 1:

# [Projektname] - Firebase Studio Prompt

## Elevator Pitch
Eine prägnante Beschreibung der App in 2-3 Sätzen.
Was ist es? Für wen? Welches Problem löst es?

## App Concept
### Primary Purpose
Der Hauptzweck der App in einem Satz.

### Target Users
- Primäre Zielgruppe
- Sekundäre Zielgruppe

### Key Value Proposition
Was macht diese App besonders/besser?

## Core Features (MAX 10 für erste Iteration)
Priorisiere die wichtigsten Features:

1. **Feature 1**: Kurze Beschreibung
2. **Feature 2**: Kurze Beschreibung
3. **Feature 3**: Kurze Beschreibung
(... bis max 10)

## User Interface
### Main Screens
Für jeden Hauptscreen:
- Screen Name
- Zweck
- Haupt-UI-Elemente

### Navigation Flow
Wie navigiert der Benutzer durch die App?

### Visual Style
- Gewünschte Ästhetik
- Farbschema-Hinweise
- Inspiration (falls vorhanden)

---
**[TEIL 1 ENDE - FORTSETZUNG IN TEIL 2]**

WICHTIG:
- Firebase Studio nutzt Next.js
- Halte Features auf MAX 10 für die erste Iteration
- Klare, einfache Sprache - wie ein Elevator Pitch`
  }

  return `Du bist ein erfahrener Technical Writer, der Prompts für Firebase Studio erstellt.

Du schreibst TEIL 2 des Firebase Studio Prompts (beginne direkt mit Technical Requirements).

STRUKTUR FÜR TEIL 2:

## Technical Requirements
### Framework
- Next.js (Firebase Studio Standard)
- TypeScript

### Data Storage
- Firebase/Firestore Struktur
- Collections und Dokumente

### Authentication
- Auth-Methode (Firebase Auth)
- Benutzerrollen

## User Stories
Für jede Kernfunktion:
\`\`\`
Als [Benutzerrolle]
möchte ich [Aktion]
damit [Nutzen/Ziel]
\`\`\`

## Data Models
### [Entity 1]
- field1: type
- field2: type

### [Entity 2]
- field1: type
- field2: type

## API Requirements
Falls externe APIs benötigt:
- API Name
- Verwendungszweck
- Endpoints

## Iteration Plan
### Phase 1 (MVP)
- Feature A
- Feature B

### Phase 2 (Erweiterung)
- Feature C
- Feature D

## Success Criteria
Wie wissen wir, dass die App erfolgreich ist?
- Metrik 1
- Metrik 2

---
✅ **FIREBASE STUDIO PROMPT VOLLSTÄNDIG**

WICHTIG:
- Firebase Studio generiert Next.js Apps
- Fokus auf Klarheit und Einfachheit
- "Enhance your prompt" Feature nutzt diese Struktur
- Beende IMMER mit "✅ **FIREBASE STUDIO PROMPT VOLLSTÄNDIG**"`
}

function getStandardSystemPrompt(part: 1 | 2 | 3 | 4 | 5): string {
  if (part === 1) {
    return `Du bist ein erfahrener Technical Writer, der detaillierte Product Requirements Documents (PRD) für Software-Projekte erstellt.

Du schreibst TEIL 1 des PRD (Sections 1-3).

STRUKTUR FÜR TEIL 1:

# Product Requirements Document (PRD)
## [Projektname]

---

## Inhaltsverzeichnis
1. Executive Summary
2. Problem Statement
3. Goals & Success Metrics
4. User Stories
5. Technical Architecture
6. API Specifications
7. Data Models
8. Security Considerations
9. Open Questions / Gaps
10. Implementation Phases
11. Appendix

---

## 1. Executive Summary
Projektüberblick, Kernfeatures, Technologie-Stack (2-3 Absätze)

## 2. Problem Statement
Aktuelle Herausforderungen, Business Impact (detailliert)

## 3. Goals & Success Metrics
Geschäftsziele und technische Ziele als Tabellen, messbare KPIs

---
**[FORTSETZUNG IN TEIL 2]**`
  }

  if (part === 2) {
    return `Du bist ein erfahrener Technical Writer, der detaillierte Product Requirements Documents (PRD) für Software-Projekte erstellt.

Du schreibst TEIL 2 des PRD (Section 4: User Stories). Teil 1 wurde bereits erstellt.

STRUKTUR FÜR TEIL 2 (beginne direkt mit Section 4):

## 4. User Stories

Gruppiert nach Benutzerrolle. Für JEDE Rolle schreibe 8-15 detaillierte User Stories.
Format: "Als [Rolle] möchte ich [Aktion], um [Nutzen]."

Rollen basierend auf dem System:
- Mieter
- Außendienst-Mitarbeiter
- Sachbearbeiter (Innendienst)
- Verwaltungsleitung
- System-Administrator

---
**[FORTSETZUNG IN TEIL 3]**`
  }

  if (part === 3) {
    return `Du bist ein erfahrener Technical Writer, der detaillierte Product Requirements Documents (PRD) für Software-Projekte erstellt.

Du schreibst TEIL 3 des PRD (Section 5: Technical Architecture). Teile 1-2 wurden bereits erstellt.

STRUKTUR FÜR TEIL 3 (beginne direkt mit Section 5):

## 5. Technical Architecture

### 5.1 Architektur-Übersicht
Erstelle ein Mermaid-Diagramm das alle Komponenten und deren Verbindungen zeigt.

### 5.2 Komponenten-Details
Für JEDEN Node im Graph schreibe einen detaillierten Abschnitt:
- **Name und Typ**
- **Verantwortlichkeiten**: Was macht diese Komponente?
- **Schnittstellen**: Welche APIs/Protokolle werden verwendet?
- **Technologie**: Welche Technologien/Frameworks werden eingesetzt?
- **Abhängigkeiten**: Von welchen anderen Komponenten hängt sie ab?

### 5.3 Datenflüsse
Beschreibe die wichtigsten Datenflüsse basierend auf den Edges im Graph.

---
**[FORTSETZUNG IN TEIL 4]**

WICHTIG: Beschreibe JEDEN Node ausführlich mit allen verfügbaren Daten.`
  }

  if (part === 4) {
    return `Du bist ein erfahrener Technical Writer, der detaillierte Product Requirements Documents (PRD) für Software-Projekte erstellt.

Du schreibst TEIL 4 des PRD (Sections 6-8). Teile 1-3 wurden bereits erstellt.

STRUKTUR FÜR TEIL 4 (beginne direkt mit Section 6):

## 6. API Specifications
Für jeden relevanten Service: Endpoints, Methods, Request/Response-Beispiele
Nutze Code-Blöcke für API-Definitionen

## 7. Data Models
Entitäten mit Feldern, Beziehungen
SQL oder TypeScript-Interface-Beispiele für die wichtigsten Entitäten

## 8. Security Considerations
Auth, Autorisierung, Datenschutz, DSGVO-Anforderungen (detailliert)

---
**[FORTSETZUNG IN TEIL 5]**

WICHTIG:
- Schreibe alle drei Sections vollständig aus
- Security Considerations VOLLSTÄNDIG mit allen relevanten Aspekten`
  }

  return `Du bist ein erfahrener Technical Writer, der detaillierte Product Requirements Documents (PRD) für Software-Projekte erstellt.

Du schreibst TEIL 5 des PRD (Sections 9-11). Teile 1-4 wurden bereits erstellt.

STRUKTUR FÜR TEIL 5 (beginne direkt mit Section 9):

## 9. Open Questions / Gaps
Liste aller ungelösten Gaps aus dem Graph mit Severity

## 10. Implementation Phases
Roadmap mit Phasen, Meilensteinen, Abhängigkeiten, Timeline

## 11. Appendix
Referenzen, Glossar, technische Details, Diagramm-Legende

---
✅ **PRD VOLLSTÄNDIG**

WICHTIG:
- Schreibe alle drei Sections vollständig aus
- Beende IMMER mit "✅ **PRD VOLLSTÄNDIG**"`
}

function buildUserPrompt(body: RequestBody, part: 1 | 2 | 3 | 4 | 5, format: ExportFormat = 'standard'): string {
  const { projectName, projectDescription, graph, messages } = body

  const nodesText = graph.nodes
    .map((n) => {
      const extraData = Object.entries(n)
        .filter(([key]) => !['id', 'type', 'label', 'description'].includes(key))
        .map(([key, value]) => `    - ${key}: ${JSON.stringify(value)}`)
        .join('\n')

      return `### ${n.label} (${n.type})
- ID: ${n.id}
- Beschreibung: ${n.description || 'Keine Beschreibung'}
${extraData ? `- Zusätzliche Daten:\n${extraData}` : ''}`
    })
    .join('\n\n')

  const nodeLabels = new Map(graph.nodes.map(n => [n.id, n.label]))
  const edgesText = graph.edges
    .map((e) => {
      const sourceLabel = nodeLabels.get(e.source) || e.source
      const targetLabel = nodeLabels.get(e.target) || e.target
      return `- ${sourceLabel} → ${targetLabel}${e.label ? `: ${e.label}` : ''}`
    })
    .join('\n')

  const gapsText = graph.gaps
    .filter((g) => !g.resolved)
    .map((g) => `- [${g.severity.toUpperCase()}] ${g.description}`)
    .join('\n') || 'Keine offenen Gaps'

  const conversationSummary = messages
    .slice(-40)
    .map((m) => `${m.role}: ${m.content.slice(0, 1200)}`)
    .join('\n\n')

  const formatNames: Record<ExportFormat, string> = {
    'standard': 'PRD',
    'lovable': 'Lovable Knowledge-File',
    'claude-code': 'CLAUDE.md',
    'firebase-studio': 'Firebase Studio Prompt',
    'navigation': 'Navigationsstruktur',
    'user-stories': 'User Stories',
  }

  const formatName = formatNames[format]
  const singlePartFormats: ExportFormat[] = ['navigation', 'user-stories']
  const totalParts = format === 'standard' ? 5 : singlePartFormats.includes(format) ? 1 : 2
  const partInfo = totalParts === 1
    ? `Erstelle die vollständige ${formatName}:`
    : `Erstelle TEIL ${part} von ${totalParts} des ${formatName}:`

  return `# Projekt: ${projectName}

## Projektbeschreibung
${projectDescription || 'Nicht angegeben'}

---

## Architektur-Komponenten (Nodes)

${nodesText}

---

## Verbindungen / Datenflüsse (Edges)

${edgesText}

---

## Offene Fragen / Gaps

${gapsText}

---

## Konversationsverlauf

${conversationSummary}

---

${partInfo}`
}

async function generatePart(body: RequestBody, part: 1 | 2 | 3 | 4 | 5): Promise<ReadableStream> {
  const format = body.format || 'standard'
  const userPrompt = buildUserPrompt(body, part, format)
  const systemPrompt = getSystemPrompt(part, format)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
  }

  return response.body!
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = (await req.json()) as RequestBody
    const requestedPart = body.part || 1

    const streamHeaders = {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }

    // If requesting a specific part, generate just that part
    if (body.part) {
      const stream = await generatePart(body, requestedPart)

      const transformStream = new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk)
          const lines = text.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
                return
              }
              try {
                const parsed = JSON.parse(data)
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`))
                }
                if (parsed.type === 'message_stop') {
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        },
      })

      const readable = stream.pipeThrough(transformStream)
      return new Response(readable, { headers: streamHeaders })
    }

    // Default: Generate all parts sequentially
    // Standard format uses 5 parts, navigation/user-stories use 1 part, other formats use 2 parts
    const format = body.format || 'standard'
    const singlePartFormats: ExportFormat[] = ['navigation', 'user-stories']
    const totalParts = format === 'standard' ? 5 : singlePartFormats.includes(format) ? 1 : 2
    let fullContent = ''
    const decoder = new TextDecoder()

    for (let part = 1; part <= totalParts; part++) {
      const stream = await generatePart(body, part as 1 | 2 | 3 | 4 | 5)
      const reader = stream.getReader()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ') && line.slice(6) !== '[DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                fullContent += parsed.delta.text
              }
            } catch {}
          }
        }
      }

      // Add separator between parts (except after last part)
      if (part < totalParts) {
        fullContent += '\n\n'
      }
    }

    // Clean up the content - remove part markers and normalize spacing
    fullContent = fullContent
      // Remove continuation markers
      .replace(/\*\*\[FORTSETZUNG IN TEIL \d\]\*\*/g, '')
      .replace(/\*\*\[TEIL \d ENDE - FORTSETZUNG IN TEIL \d\]\*\*/g, '')
      .replace(/---\s*\*\*\[FORTSETZUNG IN TEIL \d\]\*\*\s*/g, '')
      // Normalize section spacing for standard PRD
      .replace(/---\s*\n\s*\n+\s*##\s*(\d+)\./g, '---\n\n## $1.')
      // Normalize section spacing for other formats
      .replace(/---\s*\n\s*\n+\s*##\s*Backend/g, '---\n\n## Backend')
      .replace(/---\s*\n\s*\n+\s*##\s*Commands/g, '---\n\n## Commands')
      .replace(/---\s*\n\s*\n+\s*##\s*Technical Requirements/g, '---\n\n## Technical Requirements')
      // Remove excessive newlines
      .replace(/\n{4,}/g, '\n\n\n')

    return new Response(
      JSON.stringify({ prd: fullContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
