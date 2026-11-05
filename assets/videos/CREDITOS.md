# Vídeos das telas de acesso

Fontes Pexels, consultadas em 05/11/2026:

- Ron Lach: https://www.pexels.com/video/a-couple-hugging-their-daughter-9870990/
- Kampus Production: https://www.pexels.com/video/parents-hugging-their-children-6300525/
- Kindel Media: https://www.pexels.com/video/girl-hugging-her-parents-7981704/
- Licença: https://www.pexels.com/license/

## Montagem local

`familias-sequencia.mp4` reúne trechos dos três vídeos em uma sequência de 21 segundos, com transições de 1 segundo e final preparado para voltar ao início suavemente. Os trechos novos foram desacelerados com `setpts=1.6*PTS`; o primeiro já estava desacelerado na edição anterior. Os arquivos vieram do CDN oficial `videos.pexels.com/video-files/`, com os mesmos IDs das páginas.

Formato: 960 × 540, 24 fps, H.264/yuv420p, sem áudio, faststart, aproximadamente 2,22 MB. A montagem em um arquivo único evita carregar vários players ou depender de temporizadores JavaScript para trocar as cenas. A imagem de reserva foi extraída do primeiro vídeo.

Uso ilustrativo de convivência familiar. As pessoas retratadas não são apresentadas como beneficiárias, participantes ou apoiadoras do SOMA.

A sequência está incluída no app, sem streaming externo. A reprodução é automática, sem botões de play/pausa, interação por toque ou controles nativos. Continua respeitando movimento reduzido do sistema e suspende a reprodução em segundo plano ou fora da tela de acesso. Se falhar, mantém a imagem de reserva.

`expo-video` adiciona código nativo: exige uma nova build de APK com runtime atualizado pelo fingerprint antes de receber atualizações OTA que utilizem o player. Não publicar este código para runtimes de APKs sem esse módulo.
