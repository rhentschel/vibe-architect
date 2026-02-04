import { corsHeaders, handleCors } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

interface NodeData {
  id: string
  type: string
  label: string
  description?: string
  [key: string]: unknown
}

type ExportFormat = 'standard' | 'lovable' | 'claude-code' | 'firebase-studio' | 'navigation' | 'user-stories' | 'dashboard'

interface RequestBody {
  projectName: string
  projectDescription: string
  graph: {
    nodes: NodeData[]
    edges: Array<{ id: string; source: string; target: string; label?: string }>
    gaps: Array<{ id: string; description: string; severity: string; resolved: boolean }>
  }
  messages: Array<{ role: string; content: string }>
  part?: 1 | 2 | 3 | 4 | 5 | 6  // Which part to generate (standard uses 6 parts, others use 2)
  format?: ExportFormat  // Export format for different vibe-coding tools
}

function getSystemPrompt(part: 1 | 2 | 3 | 4 | 5 | 6, format: ExportFormat = 'standard'): string {
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
  if (format === 'dashboard') {
    return getDashboardSystemPrompt()
  }
  return getStandardSystemPrompt(part)
}

function getDashboardSystemPrompt(): string {
  return `Du bist ein erfahrener UI/UX Designer, spezialisiert auf Dashboard-Design und Datenvisualisierung.

Deine Aufgabe: Erstelle ein VISUELLES Dashboard-Design-Konzept basierend auf der Architektur. Fokussiere dich auf das AUSSEHEN und die BENUTZERERFAHRUNG, nicht auf technische Details.

## AUSGABE-FORMAT

# Dashboard UI/UX Design - [Projektname]

## 🎨 Design System

### Farbpalette
\`\`\`
Primary:     #3B82F6 (Blau)      - Haupt-Aktionen, aktive Elemente
Secondary:   #10B981 (Grün)      - Erfolg, positive Trends
Accent:      #F59E0B (Orange)    - Warnungen, Highlights
Danger:      #EF4444 (Rot)       - Fehler, negative Trends
Neutral:     #6B7280 (Grau)      - Text, Borders

Background:  #F9FAFB (Hell)      - Seiten-Hintergrund
Surface:     #FFFFFF (Weiß)      - Karten, Widgets
Dark Mode:   #1F2937 (Dunkel)    - Alternative Hintergrund
\`\`\`

### Typografie
- **Headlines**: Inter Bold, 24-32px
- **Subheadings**: Inter Semibold, 18-20px
- **Body**: Inter Regular, 14-16px
- **Small/Labels**: Inter Medium, 12px
- **KPI-Zahlen**: Inter Bold, 36-48px (Monospace für Zahlen)

### Spacing & Grid
- **Base Unit**: 8px
- **Padding Widgets**: 24px
- **Gap zwischen Widgets**: 16px
- **Border Radius**: 12px (Karten), 8px (Buttons), 4px (Inputs)
- **Grid**: 12 Spalten, 24px Gutter

### Schatten & Elevation
- **Level 1** (Karten): \`0 1px 3px rgba(0,0,0,0.1)\`
- **Level 2** (Hover): \`0 4px 6px rgba(0,0,0,0.1)\`
- **Level 3** (Modals): \`0 10px 25px rgba(0,0,0,0.15)\`

---

## 📐 Layout-Struktur

### Header (64px Höhe)
\`\`\`
┌──────────────────────────────────────────────────────────────────┐
│  [Logo]     Dashboard-Titel          🔍 Suche    🔔 ●  [Avatar ▼]│
└──────────────────────────────────────────────────────────────────┘
\`\`\`
- Logo links, 32px
- Titel zentriert oder links
- Rechts: Suche (optional), Notifications mit Badge, User-Avatar mit Dropdown

### Sidebar (240px Breite, collapsible auf 64px)
\`\`\`
┌────────────────────┐
│  ☰  Menü-Toggle    │
├────────────────────┤
│  🏠 Dashboard      │ ← aktiv: Background #EBF5FF, linker Border 3px Primary
│  📊 Analytics      │
│  👥 Benutzer       │
│  ⚙️ Einstellungen  │
├────────────────────┤
│  ─────────────────  │
│  📁 Projekte       │
│     └─ Projekt A   │
│     └─ Projekt B   │
└────────────────────┘
\`\`\`
- Hover: Background #F3F4F6
- Icons: 20px, Lucide Icons
- Collapsed: Nur Icons mit Tooltip

### Main Content Area
- Max-Width: 1440px, zentriert
- Padding: 24px
- Background: #F9FAFB

---

## 🎯 KPI-Karten Design

### Einzelne KPI-Karte
\`\`\`
┌─────────────────────────────────────┐
│  📈                                 │  ← Icon, 24px, Primary Color
│                                     │
│  Aktive Nutzer                      │  ← Label, 14px, Grau #6B7280
│                                     │
│  1.234                              │  ← Wert, 36px Bold, Schwarz
│                                     │
│  ↑ 12,5%  vs. letzter Monat         │  ← Trend, 12px, Grün wenn positiv
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  ← Sparkline, 24px Höhe
└─────────────────────────────────────┘
\`\`\`
- **Größe**: Min 200px breit, 140px hoch
- **Hover**: Elevation Level 2, leichte Scale (1.02)
- **Klickbar**: Cursor pointer, führt zu Detail-Ansicht

### KPI-Varianten
1. **Standard**: Zahl + Trend + Sparkline
2. **Progress**: Zahl + Progress-Bar (z.B. 75% von Ziel)
3. **Comparison**: Zwei Zahlen nebeneinander (Aktuell vs. Vorher)
4. **Mini**: Nur Zahl + Icon (für mobile)

---

## 📊 Chart-Designs

### Line Chart (Zeitverlauf)
\`\`\`
┌─────────────────────────────────────────────────────────┐
│  Umsatzentwicklung                    [7T] [30T] [1J]   │  ← Zeitraum-Toggle
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  €50k ┤                            ╭──●                 │
│       │                       ╭────╯                    │
│  €40k ┤                  ╭────╯                         │
│       │             ╭────╯                              │
│  €30k ┤        ╭────╯                                   │
│       │   ╭────╯                                        │
│  €20k ┤───╯                                             │
│       └────┬────┬────┬────┬────┬────┬────┬             │
│           Mo   Di   Mi   Do   Fr   Sa   So              │
│                                                         │
│  ● Umsatz    ○ Vorjahr (gestrichelt)                    │  ← Legende
└─────────────────────────────────────────────────────────┘
\`\`\`
- **Linie**: 2px, Primary Color, abgerundete Ecken
- **Punkte**: 6px Durchmesser, bei Hover 10px
- **Fläche**: Gradient von Primary 20% zu Transparent
- **Tooltip**: Schwebendes Card mit Datum + Wert
- **Grid**: Gestrichelte horizontale Linien, #E5E7EB

### Bar Chart (Vergleich)
\`\`\`
┌─────────────────────────────────────────────────────────┐
│  Verkäufe nach Kategorie                                │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Kategorie A  ████████████████████████████████░░  85%   │
│  Kategorie B  ██████████████████████░░░░░░░░░░░░  62%   │
│  Kategorie C  ████████████████░░░░░░░░░░░░░░░░░░  45%   │
│  Kategorie D  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░  28%   │
│                                                         │
└─────────────────────────────────────────────────────────┘
\`\`\`
- **Balken**: Border-radius 4px rechts
- **Abstand**: 12px zwischen Balken
- **Hover**: Balken wird heller, Tooltip erscheint

### Donut Chart (Anteile)
\`\`\`
┌─────────────────────────────────────┐
│  Verteilung                         │
│                                     │
│         ╭───────────╮               │
│       ╱   ██████     ╲              │
│      │   ████████████ │             │
│      │   ████ 45% ███ │             │  ← Zentrale Zahl
│      │   ████████████ │             │
│       ╲   ██████     ╱              │
│         ╰───────────╯               │
│                                     │
│  ● Typ A (45%)  ● Typ B (35%)       │
│  ● Typ C (20%)                      │
└─────────────────────────────────────┘
\`\`\`
- **Dicke**: 40px
- **Lücke**: 2px zwischen Segmenten
- **Hover**: Segment "explodiert" leicht raus

---

## 📋 Tabellen-Design

### Datentabelle
\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│  Letzte Aktivitäten                              🔍 Filter  ⬇ Export│
├─────────────────────────────────────────────────────────────────────┤
│  ☐  Name ▼           Status        Datum           Aktionen        │
├─────────────────────────────────────────────────────────────────────┤
│  ☐  Max Mustermann   🟢 Aktiv      15.01.2024     [👁] [✏️] [🗑️]  │
│  ☐  Anna Schmidt     🟡 Ausstehend 14.01.2024     [👁] [✏️] [🗑️]  │
│  ☐  Peter Weber      🔴 Inaktiv    10.01.2024     [👁] [✏️] [🗑️]  │
├─────────────────────────────────────────────────────────────────────┤
│  ◀ Zurück          Seite 1 von 5           10 ▼        Weiter ▶    │
└─────────────────────────────────────────────────────────────────────┘
\`\`\`
- **Header**: Background #F9FAFB, Font-weight 600
- **Zeilen**: Hover Background #F3F4F6
- **Alternierend**: Optional leichter Grau-Wechsel
- **Status-Badges**: Pill-Form, 6px padding, entsprechende Farbe
- **Aktions-Buttons**: Ghost-Style, nur Icons, Tooltip bei Hover

---

## 🔔 Benachrichtigungen & Feedback

### Toast-Notifications
\`\`\`
┌────────────────────────────────────┐
│ ✓  Erfolgreich gespeichert    ✕   │  ← Grüner linker Border
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ⚠  Achtung: Ungespeicherte...  ✕  │  ← Oranger linker Border
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ✕  Fehler beim Laden           ✕   │  ← Roter linker Border
└────────────────────────────────────┘
\`\`\`
- Position: Top-right, 24px vom Rand
- Animation: Slide-in von rechts
- Auto-dismiss: Nach 5 Sekunden

### Empty States
\`\`\`
┌─────────────────────────────────────────┐
│                                         │
│              📭                         │
│                                         │
│       Keine Daten vorhanden            │
│                                         │
│   Erstelle deinen ersten Eintrag       │
│                                         │
│         [ + Neu erstellen ]            │
│                                         │
└─────────────────────────────────────────┘
\`\`\`

### Loading States
- **Skeleton**: Animierte graue Blöcke (Pulse-Animation)
- **Spinner**: 24px, Primary Color, bei Buttons inline
- **Progress**: Für längere Operationen, mit Prozentanzeige

---

## 📱 Responsive Verhalten

### Desktop (>1200px)
- Sidebar: Voll ausgeklappt, 240px
- KPIs: 4 Spalten
- Charts: 2 Spalten (66% + 33%)
- Tabelle: Alle Spalten sichtbar

### Tablet (768-1200px)
- Sidebar: Collapsed auf Icons, 64px
- KPIs: 2 Spalten
- Charts: Volle Breite, untereinander
- Tabelle: Scroll horizontal

### Mobile (<768px)
\`\`\`
┌─────────────────────┐
│ ☰  Dashboard    👤  │  ← Hamburger-Menü
├─────────────────────┤
│ ┌─────────────────┐ │
│ │    KPI 1        │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │    KPI 2        │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │                 │ │
│ │    Chart        │ │
│ │                 │ │
│ └─────────────────┘ │
│                     │
│ [Tab1] [Tab2] [Tab3]│  ← Bottom Navigation
└─────────────────────┘
\`\`\`

---

## ✨ Micro-Interactions & Animationen

### Hover-Effekte
- **Karten**: Scale 1.02, Shadow Level 2, 200ms ease
- **Buttons**: Background-Shift, 150ms
- **Links**: Underline slide-in

### Transitions
- **Seiten-Wechsel**: Fade (200ms)
- **Modal öffnen**: Scale von 0.95 + Fade (250ms)
- **Sidebar toggle**: Width-Transition (300ms ease)

### Daten-Updates
- **Zahlen-Änderung**: Count-Up Animation
- **Chart-Update**: Smooth line morph
- **Neuer Eintrag**: Highlight-Flash (gelber Background, 1s fade)

---

## 🌓 Dark Mode

### Anpassungen
\`\`\`
Background:  #111827    (statt #F9FAFB)
Surface:     #1F2937    (statt #FFFFFF)
Text:        #F9FAFB    (statt #111827)
Border:      #374151    (statt #E5E7EB)
\`\`\`

### Chart-Farben Dark Mode
- Hellere Töne für bessere Sichtbarkeit
- Grid-Linien: #374151
- Tooltip-Background: #374151

---

✅ **DASHBOARD UI/UX DESIGN VOLLSTÄNDIG**

## REGELN

1. **Visuell denken**: Beschreibe WIE es aussieht, nicht wie es funktioniert
2. **ASCII-Mockups**: Nutze ASCII-Art um Layouts zu visualisieren
3. **Farben konkret**: Immer Hex-Werte oder Tailwind-Klassen angeben
4. **Spacing konsistent**: Immer 8px-Grid einhalten
5. **States beschreiben**: Hover, Active, Disabled, Loading, Empty
6. **Mobile first**: Responsive Verhalten für alle Breakpoints

WICHTIG:
- Nutze deutsche Sprache
- Fokussiere auf VISUELLES Design, nicht Technik
- Beziehe dich auf die Architektur-Nodes für Dashboard-Inhalte
- Beende IMMER mit "✅ **DASHBOARD UI/UX DESIGN VOLLSTÄNDIG**"`
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

function getLovableSystemPrompt(part: 1 | 2 | 3 | 4): string {
  if (part === 1) {
    return `Du bist ein erfahrener Technical Writer, der Knowledge-Files für Lovable (lovable.dev) erstellt.

Lovable ist ein KI-gesteuerter Full-Stack Web-App Builder. Knowledge-Files werden als Kontext für die KI verwendet.

Du schreibst TEIL 1 des Knowledge-Files.

STRUKTUR FÜR TEIL 1:

# [Projektname] - Lovable Knowledge File

## Product Vision
Klare, inspirierende Beschreibung des Produkts in 2-3 Absätzen.
- Was ist das Produkt?
- Welches Problem löst es?
- Was macht es einzigartig?
- Wer ist die Zielgruppe?

## Design Philosophy
Beschreibe den gewünschten visuellen Stil DETAILLIERT:

### Visual Style
- Hauptstil: z.B. "minimal", "premium", "corporate", "modern SaaS", "playful"
- Inspiration: Ähnliche Apps/Websites als Referenz

### Farbpalette
- Primary Color: Hex-Wert und Verwendung
- Secondary Color: Hex-Wert und Verwendung
- Accent Color: Für CTAs und Highlights
- Neutral Colors: Grautöne für Text/Backgrounds
- Semantic Colors: Success, Warning, Error

### Typografie
- Headings: Font-Familie, Gewichte
- Body Text: Font-Familie, Größen
- UI Elements: Buttons, Labels

### Spacing & Layout
- Generelles Spacing-System (4px, 8px, 16px, etc.)
- Border-Radius Stil (sharp, rounded, pill)
- Shadow-Stil (none, subtle, prominent)

---
**[FORTSETZUNG IN TEIL 2]**

WICHTIG:
- Design-Buzzwords helfen Lovable den richtigen Stil zu generieren
- Je detaillierter die Design-Vorgaben, desto besser das Ergebnis`
  }

  if (part === 2) {
    return `Du bist ein erfahrener Technical Writer, der Knowledge-Files für Lovable erstellt.

Du schreibst TEIL 2 des Knowledge-Files (User Journeys & Features).

STRUKTUR FÜR TEIL 2:

## User Roles
Definiere ALLE Benutzerrollen:

### [Rolle 1]
- **Beschreibung**: Wer ist dieser Benutzer?
- **Ziele**: Was will er erreichen?
- **Berechtigungen**: Was darf er sehen/tun?

### [Rolle 2]
...

## User Journeys
Für JEDEN Benutzertyp DETAILLIERTE Journeys:

### Journey: [Rolle] - [Hauptaufgabe]
**Kontext**: Warum macht der Benutzer das?

1. **Einstieg**: Wo startet der Benutzer?
   - Was sieht er?
   - Welche UI-Elemente sind sichtbar?

2. **Schritt 2**: [Aktion]
   - Interaktion (Klick, Eingabe, etc.)
   - Feedback vom System
   - Nächster Screen

3. **Schritt 3**: ...

4. **Abschluss**: Erfolgs-State
   - Bestätigung
   - Nächste mögliche Aktionen

### Journey: [Rolle] - [Weitere Aufgabe]
...

## Core Features
Liste ALLER Features gruppiert nach Bereich:

### [Bereich 1]
| Feature | Beschreibung | Priorität | User Journey |
|---------|--------------|-----------|--------------|
| Feature A | Was es tut | Must-have | Journey X |
| Feature B | Was es tut | Nice-to-have | Journey Y |

### [Bereich 2]
...

---
**[FORTSETZUNG IN TEIL 3]**

WICHTIG:
- Sei SEHR detailliert bei User Journeys - Lovable braucht diese für die UI-Generierung
- Jeder Schritt sollte beschreiben WAS der Benutzer SIEHT`
  }

  if (part === 3) {
    return `Du bist ein erfahrener Technical Writer, der Knowledge-Files für Lovable erstellt.

Du schreibst TEIL 3 des Knowledge-Files (UI Components & Tech Stack).

STRUKTUR FÜR TEIL 3:

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind (Lovable Standard)
- **UI Library**: shadcn/ui (Lovable Standard)
- **Icons**: lucide-react
- **State Management**: [Empfehlung basierend auf Komplexität]
- **Forms**: react-hook-form + zod
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)

## Page Structure
Beschreibe JEDE Seite der Anwendung:

### /[route]
- **Zweck**: Was macht diese Seite?
- **Layout**: Header, Sidebar, Main Content, Footer
- **Komponenten**:
  - KomponentenName: Beschreibung
  - KomponentenName: Beschreibung
- **Daten**: Welche Daten werden geladen?
- **Aktionen**: Was kann der Benutzer tun?

### /[weitere-route]
...

## Component Guidelines

### Layout Components
\`\`\`
AppLayout
├── Header
│   ├── Logo
│   ├── Navigation
│   └── UserMenu
├── Sidebar (optional)
│   └── SideNav
├── MainContent
│   └── [Page Content]
└── Footer (optional)
\`\`\`

### Reusable Components
Für JEDE wiederverwendbare Komponente:

#### [ComponentName]
- **Zweck**: Was macht die Komponente?
- **Props**:
  \`\`\`typescript
  interface ComponentNameProps {
    prop1: string
    prop2?: number
    onAction?: () => void
  }
  \`\`\`
- **Varianten**: default, primary, secondary, etc.
- **Verwendung**: Wo wird sie eingesetzt?

---
**[FORTSETZUNG IN TEIL 4]**

WICHTIG:
- Lovable nutzt shadcn/ui - nutze deren Komponenten-Namen
- Beschreibe die Hierarchie der Komponenten`
  }

  return `Du bist ein erfahrener Technical Writer, der Knowledge-Files für Lovable erstellt.

Du schreibst TEIL 4 des Knowledge-Files (Backend & Data Models).

STRUKTUR FÜR TEIL 4:

## Backend Architecture

### Supabase Database Schema
Für JEDE Tabelle:

#### [table_name]
\`\`\`sql
CREATE TABLE [table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field1 TEXT NOT NULL,
  field2 INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

**Beziehungen:**
- Gehört zu: [andere_tabelle]
- Hat viele: [andere_tabelle]

**RLS Policies:**
\`\`\`sql
-- Benutzer können nur eigene Daten lesen
CREATE POLICY "Users read own data" ON [table_name]
  FOR SELECT USING (auth.uid() = user_id);
\`\`\`

### TypeScript Interfaces
\`\`\`typescript
interface TableName {
  id: string
  field1: string
  field2: number | null
  createdAt: Date
  updatedAt: Date
}
\`\`\`

## Authentication & Authorization
- **Auth Provider**: Supabase Auth
- **Login Methods**: Email/Password, Magic Link, OAuth (Google, GitHub)
- **Rollen-System**: Wie werden Rollen zugewiesen?
- **Protected Routes**: Welche Routen erfordern Auth?

## Edge Functions (falls benötigt)
Für komplexe Backend-Logik:

### [function-name]
- **Trigger**: Wann wird sie aufgerufen?
- **Input**: Was erwartet sie?
- **Output**: Was gibt sie zurück?
- **Logik**: Was macht sie?

## External Integrations
- **API 1**: Zweck, Endpoints
- **API 2**: ...

## Environment Variables
\`\`\`env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# Weitere...
\`\`\`

---
✅ **LOVABLE KNOWLEDGE FILE VOLLSTÄNDIG**

WICHTIG:
- SQL-Syntax für Supabase verwenden
- RLS Policies sind KRITISCH für Sicherheit
- TypeScript Interfaces für Type-Safety`
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

function getStandardSystemPrompt(part: 1 | 2 | 3 | 4 | 5 | 6): string {
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

  if (part === 5) {
    return `Du bist ein erfahrener Technical Writer, der detaillierte Product Requirements Documents (PRD) für Software-Projekte erstellt.

Du schreibst TEIL 5 des PRD (Sections 9-10). Teile 1-4 wurden bereits erstellt.

STRUKTUR FÜR TEIL 5 (beginne direkt mit Section 9):

## 9. Open Questions / Gaps

Liste ALLE ungelösten Gaps aus dem Graph:

### 🔴 High Severity
- [HIGH] Beschreibung des Problems
  - **Impact**: Auswirkungen
  - **Empfehlung**: Lösungsvorschlag

### 🟡 Medium Severity
- [MEDIUM] Beschreibung...

### 🟢 Low Severity
- [LOW] Beschreibung...

## 10. Implementation Phases

Erstelle eine realistische Roadmap:

### Phase 1: Foundation (Monat 1-3)
- Meilenstein 1.1: Setup
- Meilenstein 1.2: Core Database
- **Deliverable**: ...

### Phase 2: Core Features (Monat 4-6)
...

### Phase 3: Integration (Monat 7-9)
...

### Kritische Abhängigkeiten
1. X → Y
2. ...

---
**[FORTSETZUNG IN TEIL 6]**

WICHTIG:
- Gaps nach Severity gruppieren
- Implementation Phases mit klaren Meilensteinen
- Realistische Timeline angeben`
  }

  return `Du bist ein erfahrener Technical Writer, der detaillierte Product Requirements Documents (PRD) für Software-Projekte erstellt.

Du schreibst TEIL 6 des PRD (Section 11 - Appendix). Teile 1-5 wurden bereits erstellt.

STRUKTUR FÜR TEIL 6 (beginne direkt mit Section 11):

## 11. Appendix

### 📚 Glossar
Definiere KURZ die wichtigsten Fachbegriffe (max 15-20 Einträge):
- **Begriff** - Kurze Definition (1 Zeile)

### 🔗 Referenzen
- Externe Dokumentationen
- API-Referenzen
- Relevante Standards (DSGVO, PSD2, etc.)

### 🏗️ Diagramm-Legende
Erkläre die verwendeten Symbole im Architektur-Diagramm:
- 🔷 process - Services
- 🗄️ database - Datenbanken
- 🌐 external - Externe Services

---
✅ **PRD VOLLSTÄNDIG**

WICHTIG:
- Glossar KOMPAKT halten (max 20 Begriffe)
- Nur projektrelevante Begriffe
- Beende IMMER mit "✅ **PRD VOLLSTÄNDIG**"`
}

function buildUserPrompt(body: RequestBody, part: 1 | 2 | 3 | 4 | 5 | 6, format: ExportFormat = 'standard'): string {
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
    'dashboard': 'Dashboard Design',
  }

  const formatName = formatNames[format]
  const singlePartFormats: ExportFormat[] = ['navigation', 'user-stories', 'dashboard']
  const totalParts = format === 'standard' ? 6 : format === 'lovable' ? 4 : singlePartFormats.includes(format) ? 1 : 2
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

async function generatePart(body: RequestBody, part: 1 | 2 | 3 | 4 | 5 | 6): Promise<ReadableStream> {
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
    // Standard: 6 parts, Lovable: 4 parts, navigation/user-stories/dashboard: 1 part, others: 2 parts
    const format = body.format || 'standard'
    const singlePartFormats: ExportFormat[] = ['navigation', 'user-stories', 'dashboard']
    const totalParts = format === 'standard' ? 6 : format === 'lovable' ? 4 : singlePartFormats.includes(format) ? 1 : 2
    let fullContent = ''
    const decoder = new TextDecoder()

    for (let part = 1; part <= totalParts; part++) {
      const stream = await generatePart(body, part as 1 | 2 | 3 | 4 | 5 | 6)
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
