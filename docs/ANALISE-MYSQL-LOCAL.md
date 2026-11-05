# Situação atual do SOMA — MySQL local

Atualizado em 05/11/2026. O projeto usa o MySQL da máquina como banco padrão. O trabalho de OTA foi integrado à branch `main`.

## Projeto e banco conferidos

A cópia aberta no VS Code é `Documentos\s0ma`: Expo SDK 54, React Native 0.81.5, aplicativo 1.1.0/versionCode 3 e backend Node com `mysql2`.

O MySQL 8.4.8 está em `127.0.0.1:3307`, banco `soma`, com dados em `backend/.mysql/dados`. A conexão autenticada foi verificada: 36 tabelas, 4 usuários, 3 campanhas e nenhum pagamento registrado no momento da consulta. As credenciais permanecem em `backend/.env`, fora do Git.

Há outras cópias do projeto na máquina. A pasta `ChatGPT\soma` contém um projeto Vite; `ChatGPT\korvy\soma-fork` contém o desenvolvimento anterior. A conexão validada pertence à cópia `Documentos\s0ma`.

## Mudanças integradas

- OTA com canais separados, runtime por fingerprint, download em segundo plano e aplicação na próxima abertura. Não há reinício automático durante uma operação.
- MySQL selecionado por padrão, mesmo se existir uma `DATABASE_URL` antiga. PostgreSQL continua disponível apenas por escolha explícita de compatibilidade.
- O script de APK exige que a API confirme MySQL na verificação de saúde.
- URLs legadas removidas dos perfis EAS. Novas builds e o comando assistido de OTA exigem configurar a API correta.
- Configuração antiga do Render arquivada em `docs/legado/render-supabase.yaml`.

Nenhum dado remoto foi migrado ou apagado. Nenhum serviço remoto foi desligado. A integração no GitHub não publica OTA nem backend em produção.

## Verificações

| Verificação | Resultado |
| --- | --- |
| Conexão e consultas no MySQL local | Passou |
| Backend com MySQL | 52 testes passaram |
| Controle OTA | 9 testes passaram |
| Seleção MySQL e bloqueios de publicação | 4 testes passaram |
| TypeScript e lint | Passaram |
| Compilação web | Passou |

Os testes do backend usam bancos temporários próprios, sem substituir o banco `soma`.

## O que falta para distribuir ao grupo

1. Configurar o endereço da API Node que atende ao MySQL. No telefone, `localhost` aponta para o próprio aparelho. Para teste na mesma rede, usar o IP do computador no perfil `local`; distribuição pública exige API HTTPS acessível e o servidor ligado.
2. Alinhar a URL em `eas.json` e no ambiente EAS correspondente. As variáveis privadas existentes na nuvem não foram alteradas. O app nunca deve receber credenciais do banco nem acessar diretamente a porta 3307.
3. Gerar uma nova build de teste após essa configuração, incrementando o versionCode, e validar OTA no aparelho. O APK de preview anterior usa a API remota antiga; seu teste no celular não foi confirmado. APKs já instalados não passam automaticamente a usar o banco local.
4. Configurar Google OAuth e SMTP nesta cópia, caso essas integrações sejam necessárias. Elas não estão configuradas no `.env` local verificado.

Pagamentos, repasses e receita publicitária continuam simulados. MySQL e OTA não ativam Pix ou cobranças reais.

## Executar localmente

Na pasta `Documentos\s0ma`:

```powershell
npm run banco:local:estado
npm run compilar:web
npm run servidor
```

Se o MySQL estiver parado, executar `npm run banco:local` antes do servidor. Abrir `http://localhost:3001` após iniciar a API. A compilação web foi concluída; o servidor não foi iniciado como parte desta integração.

O procedimento de futuras atualizações está em [OTA.md](OTA.md).
