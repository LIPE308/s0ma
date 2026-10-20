"""Vínculo e autoria da contribuição.

1. Pré-requisito: duas campanhas descartáveis distintas A e B; necessidade de objeto de A.
2. Atacante autenticado controla campanha_id=B e necessidade_id=A no POST /ajudas.
3. Impacto anterior: identificador fornecido era ignorado; intenção era registrada em campanha diferente da indicada.
4. Correção esperada: 400, sem reserva criada. A suíte também verifica contribuição financeira própria proibida (403).
5. Limpeza: na versão anterior, cancelar a ajuda criada com a própria sessão; o script faz essa tentativa.
A integridade financeira própria é verificada pela suíte, não por este disparo de objeto.

Padrão: somente roteiro, sem rede. --execute habilita requisições apenas em loopback.
Exemplo: python docs/auditoria/poc_contribuicao_inconsistente.py --execute --base http://127.0.0.1:3001/api
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

    token = os.environ.get("SOMA_POC_TOKEN")
    campaign = os.environ.get("SOMA_POC_CAMPAIGN")
    need = os.environ.get("SOMA_POC_NEED")
    if not token or not campaign or not need:
        raise SystemExit("Defina token de doador, SOMA_POC_CAMPAIGN=B e SOMA_POC_NEED de A, com A diferente de B.")
    status, data = request("/ajudas", "POST", {"tipo": "objeto", "campanha_id": campaign, "necessidade_id": need, "quantidade": 1}, token)
    print("Status esperado 400; recebido:", status)
    if status == 201 and data.get("id"):
        cleanup, _ = request("/ajudas/" + str(data["id"]) + "/cancelar", "PATCH", {}, token)
        print("Cancelamento de limpeza:", cleanup)
    if status != 400:
        raise SystemExit("Verifique pré-requisitos e estado do teste; vínculo inconsistente pode ter sido aceito.")


if __name__ == "__main__":
    main()
