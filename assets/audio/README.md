# Vinheta vocal SOMA

`soma-vinheta.wav` é uma vinheta sintética original de 1,74 s: “SOMAAAA”, com o último som prolongado, três camadas harmônicas e reflexões estéreo curtas. O arquivo PCM de 16 bits, estéreo, a 22.050 Hz tem cerca de 153 kB e acompanha o aplicativo; não depende de um serviço de voz online.

A fonte é a fala “Soma!” e “Má!” sintetizada localmente pela voz Microsoft Daniel em português brasileiro. O script `scripts/gerar-vinheta.py` usa NumPy para prolongar a vogal por síntese síncrona ao período, adicionar harmonia, estéreo, saturação suave e textura digital. A direção é uma vinheta de console retrô, sem usar uma gravação de abertura de jogo.

Para regenerar, utilize Windows com a voz Microsoft Daniel instalada e Python com NumPy:

```powershell
python scripts/gerar-vinheta.py
```

As fontes intermediárias ficam em `.expo/audio-fonte`, ignorada pelo Git. O WAV final já está versionado; clonar e executar o aplicativo não exige Python, NumPy ou a instalação dessa voz. A reprodução nativa utiliza Expo Audio; na web, Web Audio permite tratar o bloqueio de autoplay e liberar a reprodução com um toque em “Ouvir abertura”.
