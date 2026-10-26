# Golee: beba água com amigos

PWA em React + Vite. Cada copo é um gole; o grupo disputa quem toma o Maior Gole do Dia.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/ com service worker e manifest
npm run preview    # serve o build em http://localhost:4173
```

Ícones PNG a partir de `public/icon.svg`:

```bash
node scripts/icons.mjs          # precisa de playwright instalado
```

Teste de ponta a ponta com screenshots (onboarding → goles → abas):

```bash
npm run build && npx vite preview --port 4173 &
OUT=./shots node scripts/e2e.mjs
```

## O que está pronto (fase 1, local)

- Onboarding em 3 telas com meta sugerida (EFSA: 2,0 / 2,5 L ajustada por peso e rotina).
- Aba Hoje: "Qual seu gole hoje?", avatar que enche, ritmo copo por hora, botão Gole, meia garrafa, garrafa, desfazer em 2 min.
- Pontuação: gole 10, Super Gole (cada litro) +25, Gole Cheio +50, selo de ritmo +5; anti-abuso (goles em menos de 5 min valem 3, mais de 6 por hora não pontua, alerta acima de 5 L).
- Grupo: criar, entrar por código ou link `?join=CODIGO`, grupo de demonstração com 4 personagens simulados, ranking diário, semanal e geral, Gole do Grupo, feed com reações, cutucões (3 por dia), opções do grupo.
- Coleção: 8 personagens, desbloqueio por conquistas, títulos, resumo do mês, compartilhar.
- Eu: todas as opções do plano (meta, copo, garrafa, horário, notificações, dicas, privacidade, tema, unidade, exportar CSV, apagar).
- Dicas "Sabia que?" com nível de evidência e link para a fonte.
- PWA: manifest, service worker com precache, lembretes locais no intervalo escolhido enquanto o app está aberto ou instalado, ação "Gole" na notificação (Android).
- Streak tolerante: dia conta com 50% da meta; uma falta por semana não quebra.

## Limitações atuais (resolvidas na fase 1 com servidor)

- Dados vivem só no aparelho (localStorage). Grupos entre aparelhos diferentes, push com o app fechado e convite real exigem o backend.
- `supabase/schema.sql` tem o esquema alvo (perfis, grupos, goles, ranking diário, RLS, assinaturas de push).
- No iPhone, notificações só depois de "Adicionar à Tela de Início"; sem botão de ação na notificação.
