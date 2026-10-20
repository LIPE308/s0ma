"""Administrador padrão publicado.

1. Pré-requisito: cópia descartável local da versão anterior; senha histórica em SOMA_POC_PASSWORD.
2. Atacante anônimo tenta POST /login com a conta histórica conhecida.
3. Impacto anterior: resposta de administrador permite acessar /administracao.
4. Correção esperada: conta ausente (401) ou login comum, nunca administrador.
5. Limpeza: encerrar a sessão criada; não usar no banco de apresentação.

Padrão: somente roteiro, sem rede. --execute habilita requisições apenas em loopback.
Exemplo: python docs/auditoria/poc_admin_padrao.py --execute --base http://127.0.0.1:3001/api
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

    password = os.environ.get("SOMA_POC_PASSWORD")
    if not password:
        raise SystemExit("Defina SOMA_POC_PASSWORD apenas no ambiente de teste.")
    status, data = request("/login", "POST", {"email": "admin@exemplo.com", "senha": password})
    print("Status login:", status)
    privileged = bool(data.get("usuario", {}).get("administrador"))
    print("Conta recebeu administração:", privileged)
    if data.get("token"):
        request("/sair", "POST", {}, data["token"])
    if privileged:
        raise SystemExit("FALHA: privilégio histórico ainda disponível.")


if __name__ == "__main__":
    main()
