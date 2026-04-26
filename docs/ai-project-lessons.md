# Lições de um Projeto Construído com IA — World Cup Predictor 2026

> Guia prático baseado em 57 commits, 12 PRs, 11 fases e uma feature descartada.  
> Aplica-se a qualquer projeto construído em colaboração com Claude (ou outro LLM de código).

---

## O que foi este projeto

Simulador interativo da Copa do Mundo 2026: engine FIFA puro (TDD) → Zustand store → UI React → bracket eliminatório interativo → partilha via URL. Construído em sessões descontínuas ao longo de semanas, cada uma retomando do zero sem memória prévia do modelo.

**Números finais:** 4 235 linhas de código-fonte · 146 testes unitários · 20 testes E2E · 57 commits · 12 PRs · 0 regressões de produção

---

## 1. O que funcionou muito bem

### 1.1 CLAUDE.md como "memória persistente do projeto"

O ficheiro mais alterado de todo o projeto (21 commits). Contém stack, decisões de design, princípios de engenharia, status por fase e backlog. **Sem ele, cada sessão começaria do zero.**

**Regra:** Actualizar o CLAUDE.md no final de cada sessão/fase com o estado real. Ele é o único artefacto que sobrevive ao limite de contexto do modelo.

```
# O que deve conter
- Stack exacta (com versões relevantes)
- Decisões de design e PORQUÊ foram tomadas
- Princípios de engenharia do projecto
- Estado actual ("fase X concluída, Y em curso")
- Backlog priorizado com dependências
- Comandos essenciais
- Convenções de git/PR
```

### 1.2 Ciclo brainstorm → spec → plan → implement

Cada feature seguiu este fluxo:
1. `/brainstorm` — dialogue para alinhar o que se quer construir
2. Spec em `docs/superpowers/specs/` — decisões técnicas aprovadas
3. Plan em `docs/superpowers/plans/` — tarefas atómicas com código
4. Implementação por tarefas com review automático

**Resultado:** Nenhuma feature foi implementada para depois perceber que a abordagem estava errada. Exceção: Fase 5 (ver secção 2.1).

### 1.3 Engine puro + TDD rigoroso

O `src/engine/` não tem uma única importação de React. Funções puras testáveis isoladamente. Os testes da engine (735 linhas) têm **mais linhas que a implementação** (529 linhas).

**Benefício directo:** Quando o cascade foi implementado na Fase 11, os 7 testes unitários confirmaram correctude em 3 minutos. Zero debugging na UI.

### 1.4 GitHub Flow + Squash Merge + @claude review

Cada fase tem um commit limpo e atómico em `main`. O @claude review funcionou como segundo par de olhos — encontrou bugs reais em todos os PRs que precisaram de mais de 1 ronda de review:

| PR | Reviews | Bug encontrado |
|----|---------|----------------|
| #8 | 3× | Lógica de modal com estados inconsistentes |
| #10 | 3× | Cascade incompleto em pickGroupOrder |
| #12 | 2× | `injectScores + reload` apagava o estado nos testes |

**Regra:** Nunca fazer squash merge sem aprovação do @claude. Os bugs que ele encontra são sempre reais.

### 1.5 Helpers E2E extraídos cedo

`e2e/helpers.ts` com `openGroupModal`, `fillGroupScores`, `injectState` eliminou duplicação de ~40 linhas em 4 ficheiros de spec. A `injectState` (trick de `addInitScript` em ordem) resolveu um problema subtil de timing que `injectScores + reload` não resolvia.

**Regra:** Logo que um padrão de teste se repete 2 vezes, extrair para helper.

### 1.6 Limpeza de docs de planeamento após cada fase

Specs e plans são descartados após a fase terminar — o CLAUDE.md fica como registo permanente. O repositório fica limpo e o agente não confunde planos antigos com estado actual.

---

## 2. O que correu mal / podia ter sido melhor

### 2.1 Fase 5 (Community Stats) — feature construída e descartada

**O que aconteceu:** Foi implementada integração com Turso (read-only community stats). Passou em review. Foi para produção. Semanas depois percebeu-se que a feature estava incompleta — não havia write path (ninguém escrevia os dados) e mantê-la só para leitura não fazia sentido. Foi completamente removida.

**Custo:** ~1 semana de trabalho, 12 ficheiros criados, depois apagados. Drizzle, Turso e @libsql/client permaneceram como dead code durante 6 fases.

**O que fazer em vez disso:**
> Antes de implementar qualquer feature que dependa de infraestrutura externa (base de dados, API externa, auth), fazer um **spike de 30 minutos**: "O que acontece quando este dado não existe? Quem o cria? Quem o consome?" Se a resposta for "ainda não sei", não implementar ainda.

### 2.2 @tanstack/react-query adicionado no scaffolding por "uso futuro"

Foi adicionado na Fase 1 para a feature de placar ao vivo (prevista para junho 2026, quando a Copa começar). Ficou instalado durante 11 fases sem uma única query activa. Só foi removido na limpeza da Fase 11.

**Custo:** `package.json` com dependência morta, `QueryClientProvider` a envolver a app sem propósito, `query-client.ts` desnecessário.

**Regra YAGNI:** Não adicionar dependências para features que ainda não têm data. Quando a Fase 12 chegar, `npm install @tanstack/react-query` demora 30 segundos.

### 2.3 Dead code acumulado entre fases

Após a Fase 5, ficaram no repositório:
- `drizzle.config.ts` (ainda lá 6 fases depois)
- `src/components/stats/` (diretório vazio)
- `scripts/generate-og-image.mjs` (script descartável após gerar a imagem)

**Regra:** Na limpeza de cada fase, fazer `find . -empty -type d` e rever o `package.json` — se uma dependência não aparecer em `grep -r "from '${dep}'" src/`, remover.

### 2.4 Mudança de default (`showPositionPicker=true`) quebrou testes E2E silenciosamente

Quando o GroupPositionPicker passou a abrir por default, todos os testes E2E que clicavam em jogos do modal passaram a falhar por pointer-event interception. O problema só foi detectado ao correr os testes — não havia cobertura que o detectasse antes.

**O que fazer:** Quando se muda um default de UI que afecta a acessibilidade/clicabilidade de outros elementos, correr os testes E2E imediatamente antes de commitar.

### 2.5 Tech debt de cascade knockout→knockout identificado mas não resolvido

Durante a Fase 11, o @claude review identificou que `simulateKnockoutWinner` não faz cascade downstream. Ficou documentado em CLAUDE.md como tech debt. Não é bloqueante agora, mas vai criar confusão quando o utilizador mudar um vencedor num round adiantado.

**Regra:** Se o tech debt é identificado durante uma feature paralela e a fix cabe em menos de uma hora, fazer na mesma PR. Se não couber, abrir uma issue imediatamente (não apenas anotar no CLAUDE.md).

### 2.6 README.md desactualizado durante várias fases

O README ficou com referências a Turso, `useCommunityStats`, `.env VITE_TURSO_*` muito depois de esses ter sido removidos. Um utilizador que clonasse o repo entre a Fase 5 e a Fase 11 teria instruções erradas.

**Regra:** README e CLAUDE.md actualizam no mesmo commit que remove a feature. São documentos públicos — o CLAUDE.md é interno, o README é para toda a gente.

---

## 3. O que foi feito a mais (e não precisava)

| Feito | Porquê foi desnecessário |
|---|---|
| `useH2H` hook planeado desde Fase 1 | Nunca foi criado — feature não existiu |
| `query-client.ts` + `QueryClientProvider` | Sem queries = sem necessidade |
| Fase 5 completa | Feature sem write path não tem valor |
| `drizzle.config.ts` no repo | Config de BD que foi removida |
| `scripts/generate-og-image.mjs` após geração | Ficheiro único-uso que ficou |
| Múltiplos tsconfigs (app/node/base) | Para a maioria dos projetos, um chega |

---

## 4. O que a IA fez muito bem (e devias deixar fazer)

- **Engine puro com TDD** — o Claude segue TDD rigorosamente quando é pedido; os testes ficam completos antes da implementação
- **Refactoring de testes E2E** — extraiu padrões repetidos para helpers sem ser pedido
- **Review de PRs** — encontra bugs subtis (timing, edge cases, dead code) de forma sistemática
- **Geração de dados** — o ficheiro `wc2026.ts` (48 equipas, 12 grupos, 72 fixtures) foi gerado integralmente e com 100% de precisão
- **Commit messages** — seguem convenção, são descritivos, têm Co-Author
- **Cascade de dependências** — quando um módulo tem 5 consumidores, o Claude actualiza todos ao mesmo tempo

---

## 5. O que tens de fazer tu (não delegar ao modelo)

- **Decisões de produto** — "quero que o campeão tenha uma animação" é teu. O Claude implementa, não decide.
- **Validar visualmente** — testes passam ≠ feature está bonita. Abrir o browser e testar o golden path é teu.
- **Aprovar specs antes de implementar** — o brainstorm gera uma spec; tu tens de a ler antes de dizer "avança".
- **Definir prioridades do backlog** — o Claude não sabe o que é mais importante para o negócio.
- **Testar em produção** — o deploy automático acontece, mas quem abre o link e confirma que funciona és tu.

---

## 6. Template de CLAUDE.md para novo projecto

```markdown
# [Nome do Projecto] — CLAUDE.md

[Uma frase: o que o projecto faz]

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | ... |
| Estado | ... |
| Testes | ... |
| Deploy | ... |

---

## Decisões de Design

- [Decisão 1 e PORQUÊ]
- [Decisão 2 e PORQUÊ]

---

## Arquitetura de Pastas

\`\`\`
src/
├── [módulo]/   ← [responsabilidade em 1 linha]
\`\`\`

---

## Princípios de Engenharia

- [Ex: lógica de negócio sem React — testável puro]
- TDD obrigatório no core
- SOLID / DRY / KISS / YAGNI

---

## Status das Fases

- ✅ Fase 1 — [descrição] — [N testes], @claude aprovado
- 🔧 Fase 2 — [em curso]

---

## Backlog

### Próxima — [Nome da Fase]
[Descrição + dependências]

### Tech Debt
- [Descrição] — [ficheiro:linha] — [impacto se não resolvido]

---

## Comandos

\`\`\`bash
npm run dev
npm run test
npm run test:e2e
npm run build
\`\`\`

---

## Git

- Branch: \`feat/<nome>\`, \`fix/<nome>\`, \`chore/<nome>\`
- Commits: \`feat:\`, \`fix:\`, \`test:\`, \`chore:\`, \`docs:\`
- Nunca commitar direto na main — sempre via PR
- Code review com @claude antes de mergear
```

---

## 7. Checklist por fase (copiar para cada nova feature)

```
Antes de começar
[ ] CLAUDE.md reflecte o estado actual do projecto
[ ] Fazer /brainstorm para alinhar o que se vai construir
[ ] Spec aprovada antes de qualquer código

Durante a implementação
[ ] Testes escritos antes da implementação (engine/lógica pura)
[ ] Build limpo após cada conjunto de alterações
[ ] Sem dependências adicionadas sem necessidade imediata

Antes do PR
[ ] npm run test — todos passam
[ ] npm run test:e2e — todos passam
[ ] npm run build — sem erros
[ ] Validação visual no browser (golden path + 1 edge case)
[ ] @claude review solicitado — aguardar aprovação

Após merge
[ ] CLAUDE.md actualizado (fase concluída, backlog ajustado)
[ ] README.md consistente com o estado actual
[ ] Docs de planeamento (specs/plans) apagados
[ ] Dead code/deps identificados e removidos
[ ] Branch local apagada
```

---

## 8. Sobre a dinâmica humano-IA neste projecto

O modelo funciona como um **engenheiro sénior com amnésia entre sessões**. Sabe como fazer tudo, mas não se lembra do que fizeste ontem. O teu trabalho é:

1. **Dar contexto** (CLAUDE.md é isso)
2. **Validar produto** (o Claude entrega código, não experiência de utilizador)
3. **Decidir o que construir** (o Claude diz como, tu decides o quê)
4. **Interromper quando está no caminho errado** — se achas que a abordagem está errada, diz antes do commit, não depois

O maior ganho de produtividade não é "escrever código mais depressa" — é **nunca perder contexto entre sessões** e **ter um segundo par de olhos em cada PR que nunca está cansado**.
