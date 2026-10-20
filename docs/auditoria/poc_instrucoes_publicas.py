"""Instruções privadas na descoberta pública.

1. Pré-requisito: campanha pública de teste com marcador privado em instrucoes.
2. Atacante visitante consulta GET /campanhas/:id sem sessão.
3. Impacto anterior: resposta incluía instruções de entrega e endereço privado.
4. Correção esperada: instrucoes vazias; contato só aparece na ajuda autorizada.
5. Limpeza: nenhuma alteração feita por este teste; remover marcador pela conta dona se desejado.

Padrão: somente roteiro, sem rede. --execute habilita requisições apenas em loopback.
Exemplo: python docs/auditoria/poc_instrucoes_publicas.py --execute --base http://127.0.0.1:3001/api
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
    if not campaign:
        raise SystemExit("Defina SOMA_POC_CAMPAIGN com campanha pública e instruções privadas conhecidas.")
    status, data = request("/campanhas/" + urllib.parse.quote(campaign, safe=""))
    print("Status:", status)
    if status != 200:
        raise SystemExit("Pré-requisito não satisfeito: campanha pública não encontrada.")
    leaked = bool(data.get("instrucoes")) or any(bool(n.get("instrucoes")) for n in data.get("necessidades", []))
    print("Instruções privadas presentes:", leaked)
    if leaked:
        raise SystemExit("FALHA: instruções privadas expostas.")


if __name__ == "__main__":
    main()
