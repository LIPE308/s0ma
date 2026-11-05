# Vídeos de solidariedade das telas de acesso

Cinco cenas ilustrativas de voluntariado e doações. Fontes Pexels, consultadas em 05/11/2026:

1. Organização de alimentos — Julia M Cameron: https://www.pexels.com/video/volunteers-packing-foods-to-donate-6893983/
2. Separação de roupas doadas — Julia M Cameron: https://www.pexels.com/video/volunteers-folding-clothes-6893843/
3. Entrega de alimentos e água — Julia M Cameron: https://www.pexels.com/video/volunteers-serving-food-to-poor-people-6894046/
4. Preparação de caixas de doações — cottonbro studio: https://www.pexels.com/video/volunteers-packing-essential-goods-6590942/
5. Distribuição de refeições — Julia M Cameron: https://www.pexels.com/video/distributing-packed-meals-6894121/

Licença: https://www.pexels.com/license/

## Montagem local

`solidariedade-sequencia.mp4` reúne os cinco vídeos em uma sequência de 35 segundos, com transições de 1 segundo e final preparado para voltar ao início suavemente. Cada trecho começa em 1 segundo do original e é desacelerado com `setpts=1.6*PTS`, limitado a 8 segundos após desacelerar. A montagem desconta as sobreposições das transições. Os arquivos vieram do CDN oficial `videos.pexels.com/video-files/`, com os mesmos IDs das páginas.

Formato: 960 × 540, 24 fps, H.264/yuv420p, sem áudio, faststart, aproximadamente 2,91 MB. Um único player reproduz a montagem, evitando temporizadores e recargas entre as cenas. `solidariedade-capa.jpg` foi extraída da própria montagem e substitui a imagem de família anterior.

As cenas são ilustrativas. As pessoas e organizações retratadas não são apresentadas como participantes ou apoiadoras do SOMA, nem como beneficiárias de campanhas do app.

A sequência está incluída no app, sem streaming externo. A reprodução é automática, sem botões de play/pausa, interação por toque ou controles nativos. Respeita movimento reduzido do sistema e suspende a reprodução em segundo plano ou fora da tela de acesso. Se falhar, mantém a imagem de reserva.

`expo-video` adiciona código nativo: exige uma nova build de APK com runtime atualizado pelo fingerprint antes de receber atualizações OTA que utilizem o player. Não publicar este código para runtimes de APKs sem esse módulo.
