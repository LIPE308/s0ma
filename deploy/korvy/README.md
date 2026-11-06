# Publicação temporária da turma

URL pretendida: `https://korvy.com.br/soma`. Sem entrada nos menus, sitemap ou indexação. A rota não exige senha; conhecer o link permite acessar a parte pública do SOMA. Autenticação das contas continua obrigatória nas áreas privadas.

O workflow manual `soma-temporario.yml` do repositório `srdiasjr/korva` usa somente as credenciais SSH já cadastradas. Recebe SHA completo de `LIPE308/s0ma`. Não executa o deploy institucional, não faz checkout no diretório da Korvy, não altera Caddyfile, páginas, SEO, menus ou DNS. Faz build e sobe projeto Compose independente `soma-temporario`, em `/var/lib/soma-temporario`, conectado à rede web existente.

MySQL próprio, persistente, sem porta pública; senhas aleatórias geradas no servidor, arquivo privado modo 600, sem entrar em imagem/Git/APK. O banco da escola permanece intacto. A cópia usa campanhas iniciais do projeto: **não contém automaticamente usuários nem histórico do MySQL da escola**. Credenciais Google/SMTP locais não são enviadas. E-mail e senha podem ser cadastrados; Google e notificações por e-mail dependem de configuração de produção, incluindo callback `/soma/api/auth/google/callback` autorizado no Google Cloud.

A rota é inserida apenas no JSON ativo do Caddy, após backup. Configuração anterior preservada em `/var/lib/soma-temporario/caddy-before-{SHA}.json`. Nenhum arquivo do site é editado. Reiniciar/recriar Caddy remove a rota temporária; executar novamente o workflow a restaura sem duplicação. Esse comportamento é deliberado. Para remover manualmente, restaurar o JSON anterior com `caddy reload`; parar somente o projeto `soma-temporario` se desejado, preservando seus volumes. Não executar `down -v`, prune nem reiniciar o site.

Guardas: memória/disco disponíveis antes do build, limites nos contêineres, health check MySQL e API antes de abrir rota, validação Caddy antes do reload, comparação byte a byte da homepage antes/depois e rollback de configuração/serviço SOMA se falhar. As imagens e volumes não são apagados. Alterações do esquema precisam ser retrocompatíveis para permitir retorno da imagem anterior.

Validação local: três testes da configuração de rota e cookies; 52 testes do backend/MySQL; tipos, lint, export web com base `/soma`; navegador abriu `/soma/mapa-cidades`, carregou bundle sob `/soma/_expo/` e selecionou Petrolina/PE. O resultado da publicação deve ser conferido no workflow e na URL pública; preparação não comprova publicação.

## Tentativa em 06/11/2026

O preflight da execução https://github.com/srdiasjr/korva/actions/runs/42227513066 encontrou somente 181.076 KiB de memória disponível e 1.962.124 KiB de disco livre. A execução parou antes de criar serviços, banco ou alterar a configuração do Caddy. A rota não foi publicada. É necessário disponibilizar recursos suficientes ou escolher outro servidor para o SOMA antes de repetir. Não remover as guardas para forçar a publicação sobre o site institucional.
