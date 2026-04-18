# Redesign — Cyber Green Light
**Data:** 2026-04-18  
**Status:** Aprovado pelo usuário, aguardando implementação

---

## Contexto

O design atual usa uma paleta marrom-dourada (`#0c0a00` fundo, `#f59e0b` ouro) com sidebar fixa de 240px. O usuário não gostou da sidebar, das cores e da forma de inserir placares. O redesign migra para uma estética robótica/futurista em tema claro com verde neon como cor primária, elimina a sidebar e melhora a UX mobile-first.

---

## Paleta — Cyber Green Light

| Token Tailwind | Valor | Uso |
|---|---|---|
| `wcp-bg` | `#f0f4f1` | Fundo geral do body |
| `wcp-surface` | `#ffffff` | Cards, acordeons, tabelas |
| `wcp-surface-subtle` | `#e8f5ec` | Barra de stats, header section |
| `wcp-primary` | `#00a854` | Cor principal: ícones, texto ativo, botões |
| `wcp-primary-light` | `#00c866` | Bordas, acentos, steppers |
| `wcp-primary-faint` | `#00c86615` | Hover, backgrounds sutis |
| `wcp-text` | `#1a2a1a` | Texto primário |
| `wcp-muted` | `#607060` | Texto secundário, labels |
| `wcp-border` | `#00c86622` | Bordas de cards e separadores |

Remover todos os tokens antigos: `wcp-sidebar`, `wcp-gold`, `wcp-muted` (marrom).

---

## Layout Geral

**Sem sidebar.** Layout de coluna única full-width:

```
┌─────────────────────────────────┐
│ HEADER (logo + share button)    │
├─────────────────────────────────┤
│ BARRA DE FAVORITOS (scroll →)   │
├─────────────────────────────────┤
│                                 │
│  ACCORDION DE GRUPOS (A–L)      │
│  + seção BRACKET                │
│                                 │
└─────────────────────────────────┘
```

---

## Header

**Estrutura:** `flex justify-between items-center px-4 py-3 bg-wcp-surface border-b border-wcp-border`

### Logo (opção C aprovada)
- **Ícone:** círculo 36×36px, fundo `wcp-surface-subtle`, borda `2px solid wcp-primary`, contendo troféu SVG desenhado + badge "26" (círculo verde 13px no canto superior direito)
- **Título:** "World Cup Predictor" — `font-bold text-sm text-wcp-text`
- **Subtítulo:** "FIFA 2026 · 48 seleções" — dois pontos verdes `wcp-primary` (4px) separando itens, `text-[8px] tracking-wide text-wcp-muted`

### Botão Compartilhar
- Pill verde: `bg-wcp-primary text-white text-xs font-semibold rounded-full px-4 py-1.5`
- Texto: "↗ Compartilhar"
- Mantém o comportamento atual do `ShareButton`

---

## Barra de Favoritos da Comunidade

**Posição:** imediatamente abaixo do header, sempre visível.  
**Estrutura:** `bg-wcp-surface-subtle border-b border-wcp-border px-4 py-2`

```
🏆 FAVORITOS   [① 🇧🇷 BRA 18.4%]  [② 🇫🇷 FRA 14.2%]  [③ 🇦🇷 ARG 12.7%]  →
```

- Label "🏆 FAVORITOS" fixo à esquerda: `text-[8px] tracking-widest text-wcp-muted uppercase`
- Pills scrolláveis horizontalmente (overflow-x auto, sem scrollbar visível)
- Cada pill: `flex items-center gap-1.5 bg-wcp-surface border border-wcp-border rounded-full px-2.5 py-1 shrink-0`
  - Badge de posição: círculo 14px, `bg-wcp-primary text-white text-[7px] font-bold` (1º) / `bg-wcp-muted text-white` (2º–5º)
  - Bandeira emoji `text-sm`
  - Código: `text-[9px] font-semibold text-wcp-text`
  - Percentual: `text-[9px] text-wcp-primary font-semibold` (1º) / `text-wcp-muted` (2º–5º)
- **Graceful degradation:** se `VITE_TURSO_URL` ausente, barra não renderiza (comportamento atual mantido)
- Componente: `CommunityStatsBar` — reescreve `CommunityStats.tsx`

---

## Accordion de Grupos

Substitui sidebar + ContentArea. Renderiza todos os 12 grupos numa página com scroll vertical.

**Container:** `max-w-2xl mx-auto w-full px-4 py-4 space-y-2`

### Item do Accordion (cada grupo)
- **Header recolhido:** `flex justify-between items-center px-4 py-3 bg-wcp-surface rounded-xl border border-wcp-border cursor-pointer`
  - Label: "GRUPO A" — `text-wcp-muted text-[10px] tracking-[3px] uppercase`
  - Chevron: `▼` / `▲` em `text-wcp-muted`
- **Header expandido:** mesma estrutura com `bg-wcp-surface-subtle border-b border-wcp-border rounded-t-xl`
  - Label: `text-wcp-primary font-bold`
  - Chevron: `▲` em `text-wcp-primary`

### Conteúdo Expandido

**1. Tabela de Classificação (mantida integralmente)**
- Todas as colunas existentes: `#`, `Seleção`, `J`, `G`, `E`, `P`, `SG`, `GP`, `PTS`
- Estilização adaptada para a nova paleta:
  - Header da tabela: `bg-wcp-surface-subtle text-wcp-muted text-[10px] uppercase tracking-wide`
  - Linhas qualificadas (top 2): `text-wcp-text`, posição em `text-wcp-primary font-bold`
  - PTS: `font-bold text-wcp-primary`
  - Borda: `border-wcp-border`

**2. Seção de Jogos**
- Label "JOGOS": `text-wcp-muted text-[10px] tracking-widest uppercase mb-2`
- Lista de `MatchRow` redesenhados (ver abaixo)

**Componente:** `GroupAccordion.tsx` (novo) — substitui `Sidebar` + `ContentArea`  
**Estado:** `openGroups: Set<string>` no UISlice (suporta múltiplos grupos abertos simultaneamente)

---

## MatchRow — Redesign com Stepper

**Layout:** `flex items-center justify-between bg-wcp-surface border border-wcp-border rounded-xl px-4 py-3`

```
[🇲🇽]        [+]        [+]
[MEX]   [2]   ×   [1]   [BRA]
        [-]        [-]   [🇧🇷]
```

- **Bandeira:** emoji `text-3xl` (≈30px) — tamanho principal de identificação
- **Código do time:** `text-[10px] font-semibold text-wcp-text tracking-wide` abaixo da bandeira
- **Stepper por lado:**
  - Botão `+`: círculo 28px, `bg-wcp-primary-faint border border-wcp-primary-light text-wcp-primary font-bold text-base rounded-full`
  - Número: `text-xl font-bold text-wcp-text min-w-[28px] text-center`
  - Botão `−`: mesmo estilo; desabilitado (opacity-40) quando valor = 0
  - Valor mínimo: 0, sem máximo rígido
- **Separador:** `×` em `text-wcp-primary font-bold px-2`
- **Props mantidas:** `match`, `homeScore`, `awayScore`, `onScoreChange` — interface pública inalterada

---

## Bracket — Espinha de Peixe

### Desktop (≥ 768px)
Layout horizontal convergente: times fluem da esquerda e direita para a Final no centro.

```
OITAVAS(E) → QUARTOS(E) → SEMI(E) → [FINAL] ← SEMI(D) ← QUARTOS(D) ← OITAVAS(D)
```

- Cada coluna é uma rodada, conectada por linhas SVG `stroke="#00c866"` com curvas bezier
- Time vencedor: `bg-wcp-primary-faint border-wcp-primary text-wcp-primary font-bold`
- Time perdedor: `text-wcp-muted opacity-60`
- Final central: card maior com borda `2px wcp-primary`, campeão destacado em badge verde abaixo

### Mobile (< 768px) — Minimap + Cards

**Minimap** (fixo no topo da seção bracket):
- Versão em miniatura (≈280px largura, ≈80px altura) do bracket completo
- Apenas times (sem detalhes), não interativo exceto para selecionar rodada
- Rodada ativa: highlight `wcp-primary-faint`
- Toque numa rodada → atualiza cards abaixo

**Cards de rodada** (abaixo do minimap):
- Cards verticais estilo `MatchRow` mostrando os jogos da rodada ativa
- Mesmo stepper/flags do MatchRow de grupos
- Label da rodada: pill horizontal `bg-wcp-surface border border-wcp-border rounded-full`

**Componentes:**
- `BracketView.tsx` — reescrito com lógica de layout responsivo
- `BracketMinimap.tsx` (novo) — miniatura SVG read-only do bracket

---

## Arquivos a Modificar / Criar

| Arquivo | Ação |
|---|---|
| `tailwind.config.ts` | Substituir tokens de cor |
| `src/index.css` | Atualizar base styles |
| `src/components/layout/AppShell.tsx` | Remover Sidebar, ajustar layout |
| `src/components/layout/Sidebar.tsx` | **Deletar** |
| `src/components/layout/ContentArea.tsx` | **Deletar** (lógica absorvida pelo accordion) |
| `src/components/groups/GroupAccordion.tsx` | **Criar** — accordion de 12 grupos |
| `src/components/groups/GroupTable.tsx` | Adaptar paleta (estrutura mantida) |
| `src/components/groups/MatchRow.tsx` | Reescrever com stepper + bandeiras grandes |
| `src/components/bracket/BracketView.tsx` | Reescrever (converging + minimap mobile) |
| `src/components/bracket/BracketMinimap.tsx` | **Criar** — minimap SVG read-only |
| `src/components/stats/CommunityStats.tsx` | Reescrever como `CommunityStatsBar` (horizontal) |
| `src/store/ui.slice.ts` | Adicionar `openGroups: Set<string>` |

---

## Testes

- Testes unitários Vitest de `MatchRow` (stepper: incremento, decremento, valor mínimo 0)
- Testes unitários de `GroupAccordion` (abre/fecha, múltiplos grupos simultâneos)
- Testes E2E Playwright: accordion abre grupo, insere placar via stepper, tabela atualiza
- Snapshot de `BracketMinimap` (renderização read-only)
- Build limpo sem type errors

---

## O que NÃO muda

- Lógica do engine (`src/engine/`) — zero alterações
- `useCommunityStats` hook — mantido, apenas o componente de exibição muda
- Dados (`src/data/wc2026.ts`) — mantidos
- Share link (`useShareLink`, `encodeState`) — mantidos
- Zustand store (apenas adicionar `openGroups`)
- Deploy GitHub Pages + CI
