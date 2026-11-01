# ⚽ Modo Carreira Manager — EA SPORTS FC 27

Gestor de **Modo Carreira** feito para aumentar a imersão no EA FC 27. É **grátis**, **sem login**, **sem servidor e sem banco de dados**: tudo fica salvo no seu navegador **e**, se você quiser, num arquivo no seu PC.

## Como usar

- **Online:** publique a pasta no GitHub Pages, Netlify ou Vercel (é um site estático) e acesse pelo navegador.
- **Local:** abra o `index.html` com dois cliques. Funciona direto do arquivo.
- **Offline / app:** servido por http(s), o site pode ser instalado como app (PWA) e funciona sem internet.

Não há etapa de build nem dependências: HTML, CSS e JavaScript puros.

## Funcionalidades

| Área | O que faz |
|---|---|
| **Central** | Próxima partida, forma, clima no clube (diretoria, torcida, moral, reputação), finanças, destaques, mini-tabela, objetivos, notícias e alertas do auxiliar |
| **Elenco** | Cadastro completo (OVR, POT, posição, contrato, salário, valor, moral, papel, lesão, capitão), visão em tabela ou cartas, filtros e ordenação, **importação em lote via CSV/planilha** (aceita posições em inglês), exportação CSV |
| **Perfil do jogador** | Estatísticas por temporada e na carreira, gráfico de evolução de OVR, notas recentes, histórico, renovação de contrato e estatísticas manuais |
| **Tática** | Campo interativo com 10 formações, escalação automática do melhor XI e plano de jogo |
| **Partidas** | Calendário e resultados, súmula com escalação, gols (com assistência, minuto e tipo), notas, cartões, lesões, melhor em campo, posse, finalizações, xG e pênaltis. Gera um **card de resultado (PNG)** para compartilhar |
| **Competições** | Ligas com tabela (sua linha é calculada pelas partidas), zonas de classificação e rebaixamento, edição da tabela, **simulação da rodada dos rivais** e gráfico de pontos. Copas, continentais e supercopas |
| **Estatísticas** | Rankings de jogadores, gols por período, nota média do time, desempenho por competição e confrontos diretos |
| **Transferências** | Compras, vendas, empréstimos, chegadas livres, dispensas e aposentadorias, com efeito automático no orçamento e saldo. Desfazer, maiores contratações e vendas |
| **Observação** | Lista de alvos com relatório do olheiro e botão "Contratar" |
| **Base** | Jovens, promoção ao profissional e missões de olheiros que geram promessas |
| **Finanças** | Saldo, orçamentos, lançamentos por categoria e gráficos |
| **Diretoria** | Objetivos por temporada, confiança da diretoria, apoio da torcida e desafios pessoais (Road to Glory, Moneyball…) |
| **Imersão** | Notícias geradas automaticamente (goleadas, clássicos, hat-tricks, sequências, crises, marcos de gols, estreias da base, reforços), rumores, **coletivas de imprensa** e **dilemas do clube** com consequências reais |
| **Legado** | Sala de troféus com celebração, 25 conquistas de carreira, história das temporadas, artilheiros e recordistas, perfil e trajetória do treinador (inclusive troca de clube) e diário do treinador |
| **Virada de temporada** | Arquiva a temporada, envelhece o elenco, alerta sobre contratos, encerra empréstimos, cria as novas competições e redefine orçamentos e objetivos |

## Onde ficam os dados

1. **Navegador (automático):** cada alteração é salva no `localStorage`, com backups automáticos a cada 10 minutos e antes de ações importantes.
2. **Arquivo no PC (recomendado):** em **Saves e backup → Criar/vincular arquivo de save** (Chrome, Edge ou Opera no desktop), o app grava um `.json` no seu computador automaticamente a cada alteração. `Ctrl+S` grava na hora.
3. **Exportar / Importar:** baixa e carrega arquivos `.json` em qualquer navegador. Serve para trocar de PC ou compartilhar a carreira.

Nenhum dado sai do seu dispositivo.

## Estrutura

```
index.html            # shell
css/style.css         # tema escuro/claro, responsivo
js/core.js            # utilitários + armazenamento (localStorage, IndexedDB, arquivo)
js/engine.js          # regras: estatísticas, notícias, coletivas, eventos, conquistas, temporadas
js/ui.js              # modais, toasts, gráficos SVG
js/app.js             # roteador e layout
js/views-*.js         # telas
sw.js                 # offline
```

---
Projeto de fãs, sem afiliação com a Electronic Arts.
