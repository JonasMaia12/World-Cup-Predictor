# Fase 4 — Social: ShareButton + SEO/OG

**Data:** 2026-04-16  
**Status:** Aprovado  
**Escopo:** ShareButton com link compartilhável via URL state + meta tags Open Graph estáticas

---

## Contexto

O projeto é 100% estático (Vite + React + GitHub Pages). Não há backend. O estado do bracket fica no LocalStorage via Zustand persist.

A Fase 4 adiciona a capacidade de compartilhar um bracket via link e melhora o preview ao compartilhar o site em redes sociais. Turso/stats da comunidade ficam para a Fase 5.

---

## Decisões de Design

| Decisão | Escolha | Motivo |
|---|---|---|
| Mecanismo de compartilhamento | Estado na query string `?s=` | 100% estático, sem backend, funciona no WhatsApp/Twitter |
| Codificação do estado | `base64url(JSON.stringify(scores))` | Simples, ~300 chars para 96 jogos, sem dependência extra |
| Posição do botão | Header (AppShell) | Sempre visível, não ocupa espaço no conteúdo |
| Preview OG | Meta tags estáticas genéricas | CSR não permite OG dinâmico sem SSR/edge functions |
| Turso stats | Adiado para Fase 5 | CLI verificado e database `wcp2026` já criada em `aws-eu-west-1` |

---

## Arquitetura

### Fluxo de compartilhamento

```
Zustand scores (Record<string, {home, away}>)
  → JSON.stringify
  → btoa / base64url encode
  → append ?s=<token> à URL atual
  → navigator.clipboard.writeText(url)
  → botão mostra "✓ Link copiado!" por 2s
```

### Fluxo de restauração

```
App inicializa
  → lê window.location.search
  → se ?s= presente: base64url decode → JSON.parse → setScores(scores)
  → bracket renderiza com estado do link
```

---

## Componentes

### `src/lib/share.ts`
Funções puras, zero dependências React:

```ts
encodeState(scores: Scores): string  // → base64url string
decodeState(search: string): Scores | null  // → null se inválido/ausente
```

### `src/hooks/useShareLink.ts`
Hook React:
- Lê scores do store Zustand
- Retorna `{ share: () => void, copied: boolean }`
- `share()` gera URL, copia para clipboard, seta `copied = true` por 2s

### `src/components/share/ShareButton.tsx`
Componente visual, props-only via hook:
- Estado normal: botão dourado "↗ Compartilhar bracket"
- Estado copiado: botão verde "✓ Link copiado!" (2s, depois volta)

### `src/main.tsx` (modificação)
Na inicialização, após a importação do store (que hidrata o LocalStorage via persist) e antes de `ReactDOM.createRoot().render()`:
- Chama `decodeState(window.location.search)`
- Se retornar scores válidos, chama `useStore.getState().setScores(scores)` — **URL tem prioridade sobre LocalStorage**
- Se `?s=` ausente ou inválido, o LocalStorage persiste normalmente

### `index.html` (modificação)
Adiciona meta tags OG e Twitter Card:
- `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`

### `public/og-image.png`
Imagem estática 1200×630px com visual do projeto.  
Gerada com HTML/CSS estático ou ferramenta de design.

---

## Testes

### Unitários — `src/lib/share.test.ts`
- Round-trip: `decodeState(encodeState(scores))` retorna scores originais
- Scores vazios (`{}`) → encode/decode funciona
- Query string inválida → `decodeState` retorna `null`
- Query string ausente → `decodeState` retorna `null`
- Scores com todos os 96 jogos → URL cabe em < 2000 chars

### E2E — `e2e/share.spec.ts`
- Preencher alguns scores → clicar ShareButton → verificar que URL contém `?s=`
- Navegar para a URL gerada em nova aba → verificar que scores foram restaurados
- Verificar que o botão muda para "✓ Link copiado!" após click

---

## Arquivos Modificados / Criados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/lib/share.ts` | Novo | encode/decode state ↔ URL |
| `src/lib/share.test.ts` | Novo | Testes unitários |
| `src/hooks/useShareLink.ts` | Novo | Hook: gera URL + clipboard |
| `src/components/share/ShareButton.tsx` | Novo | Botão no header |
| `src/components/layout/AppShell.tsx` | Modificado | Adiciona ShareButton ao header |
| `src/main.tsx` | Modificado | Restaura estado do ?s= na inicialização |
| `index.html` | Modificado | Meta tags OG + Twitter Card |
| `public/og-image.png` | Novo | Imagem OG 1200×630 |
| `e2e/share.spec.ts` | Novo | Teste E2E Playwright |

---

## Fora do Escopo (Fase 4)

- Download de imagem PNG do bracket
- Preview OG dinâmico com bracket do usuário (requer SSR/edge)
- Compressão LZString da URL (desnecessária para o tamanho atual)
- Turso / community stats (Fase 5 — database `wcp2026` já criada)
