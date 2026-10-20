"""Encerramento contornava moderação.

1. Pré-requisito: campanha suspensa descartável e token do responsável em SOMA_POC_TOKEN.
2. Atacante é o responsável legítimo de campanha que a administração suspendeu.
3. Disparo: PATCH /campanhas/:id/encerrar.
4. Impacto anterior: estado encerrada voltava a tornar a campanha pública; correção responde 409.
5. Limpeza: administrador restaura o estado de teste caso a versão anterior aceite o disparo.

Padrão: somente roteiro, sem rede. --execute habilita requisições apenas em loopback.
Exemplo: python docs/auditoria/poc_moderacao_encerramento.py --execute --base http://127.0.0.1:3001/api
Não imprime senhas, tokens, endereços ou respostas privadas.
"""
import argparse
import json
import os
import urllib.error
import urllib.parse
import urllib.request


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--base", default="http://127.0.0.1:3001/api")
    args = parser.parse_args()
    print(__doc__)
    if not args.execute:
        print("DRY RUN: nenhuma requisição enviada.")
        return
    parsed = urllib.parse.urlsplit(args.base)
    if parsed.scheme != "http" or parsed.hostname not in ("127.0.0.1", "localhost", "::1") or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise SystemExit("Use somente HTTP local de uma cópia descartável.")

    def request(path, method="GET", payload=None, token=None):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        req = urllib.request.Request(args.base.rstrip("/") + path, data=json.dumps(payload).encode() if payload is not None else None, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            return error.code, json.load(error)

    campaign = os.environ.get("SOMA_POC_CAMPAIGN")
    token = os.environ.get("SOMA_POC_TOKEN")
    if not campaign or not token:
        raise SystemExit("Defina SOMA_POC_CAMPAIGN e SOMA_POC_TOKEN de uma campanha suspensa descartável.")
    status, _ = request("/campanhas/" + urllib.parse.quote(campaign, safe="") + "/encerrar", "PATCH", {}, token)
    print("Status esperado 409; recebido:", status)
    if status != 409:
        raise SystemExit("Verifique o estado da campanha; teste só é conclusivo se ela estava suspensa.")


if __name__ == "__main__":
    main()
