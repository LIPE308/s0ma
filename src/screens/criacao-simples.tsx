import { StyleSheet, BackHandler, Switch, View } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Button,
  Card,
  Choices,
  Copy,
  Disclosure,
  Field,
  Notice,
  Screen,
} from "../components/ui";
import { Calendario } from "../components/calendario";
import { PedirLogin, EstadoConexao } from "../components/conexao";
import { escolherDocumento } from "../components/arquivos";
import {
  categorias,
  converterValor,
  formatarDinheiro,
} from "../data/formatacao";
import { inicioDoDia, lerData } from "../data/calendario";
import {
  criarChaveOperacao,
  mensagemErro,
  requisitar,
  usuarioLogado,
  useDados,
  type Campanha,
} from "../servicos/api";
import type { PerfilAmpliado } from "../servicos/soma2";
import { escolherImagem } from "./inteligencia";
type Documento = { nome: string; base64: string; chave: string };
export function CriacaoSimples() {
  const roteador = useRouter();
  const [etapa, setEtapa] = useState(0);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Família");
  const [imagem, setImagem] = useState("");
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [meta, setMeta] = useState("");
  const [prazo, setPrazo] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("Não informar");
  const [mapa, setMapa] = useState(false);
  const [adulto, setAdulto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const perfil = useDados<PerfilAmpliado>(
    usuarioLogado() ? "/perfil-ampliado" : null,
  );
  const envio = useRef(criarChaveOperacao());
  const salva = useRef<Campanha | null>(null);
  const ultimoCorpo = useRef("");
  useEffect(() => {
    if (perfil.dados) setAdulto(Boolean(perfil.dados.adulto));
  }, [perfil.dados]);
  const voltar = useCallback(() => {
    if (!ocupado) {
      setEtapa((e) => Math.max(0, e - 1));
      setErro("");
    }
  }, [ocupado]);
  useFocusEffect(
    useCallback(() => {
      const l = BackHandler.addEventListener("hardwareBackPress", () => {
        if (etapa > 0) {
          voltar();
          return true;
        }
        return false;
      });
      return () => l.remove();
    }, [etapa, voltar]),
  );
  const valor = Math.round(converterValor(meta) * 100);
  function continuar() {
    setErro("");
    if (etapa === 0 && (!titulo.trim() || !descricao.trim())) {
      setErro("Dê um nome à campanha e conte a história.");
      return;
    }
    if (
      etapa === 0 &&
      (titulo.trim().length > 150 || descricao.length > 10000)
    ) {
      setErro("Use até 150 caracteres no nome e 10.000 na história.");
      return;
    }
    if (
      etapa === 2 &&
      (!Number.isSafeInteger(valor) || valor < 1000 || valor > 100000000)
    ) {
      setErro("Informe uma meta entre R$ 10 e R$ 1.000.000.");
      return;
    }
    if (
      etapa === 2 &&
      prazo &&
      (!lerData(prazo) || lerData(prazo)! < inicioDoDia())
    ) {
      setErro("Escolha hoje, uma data futura ou deixe sem prazo.");
      return;
    }
    if (etapa === 2 && mapa && uf === "Não informar") {
      setErro("Escolha o estado para autorizar a presença no mapa.");
      return;
    }
    setEtapa((e) => e + 1);
  }
  async function foto() {
    setOcupado(true);
    setErro("");
    try {
      const v = await escolherImagem();
      if (v) setImagem(v);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setOcupado(false);
    }
  }
  async function documento() {
    setOcupado(true);
    setErro("");
    try {
      const d = await escolherDocumento();
      if (d)
        setDocumentos((ds) => [...ds, { ...d, chave: criarChaveOperacao() }]);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setOcupado(false);
    }
  }
  async function salvar(enviar: boolean) {
    if (enviar && !adulto) {
      setErro(
        "A publicação precisa de um responsável maior de 18 anos. Você pode salvar o rascunho.",
      );
      return;
    }
    setOcupado(true);
    setErro("");
    try {
      const corpo = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria,
        prazo,
        regiao: cidade.trim(),
        uf: mapa ? uf : "",
        imagem: imagem || undefined,
        necessidades: [
          {
            nome: titulo.trim(),
            tipo: "dinheiro",
            meta: valor,
            tipo_meta: "fechada",
            prioridade: "Normal",
            prazo,
            descricao: "",
          },
        ],
      };
      if (!salva.current) {
        salva.current = await requisitar<Campanha>(
          "/campanhas",
          "POST",
          corpo,
          envio.current,
        );
        ultimoCorpo.current = JSON.stringify(corpo);
      } else if (ultimoCorpo.current !== JSON.stringify(corpo)) {
        const atual = await requisitar<Campanha>(
          "/campanhas/" + salva.current.id,
          "PUT",
          {
            ...corpo,
            necessidades: [
              {
                ...corpo.necessidades[0],
                id: salva.current.necessidades[0].id,
              },
            ],
          },
          envio.current,
        );
        salva.current = atual;
        ultimoCorpo.current = JSON.stringify(corpo);
      }
      const id = salva.current.id;
      await requisitar("/campanhas/" + id + "/contexto", "PUT", {
        mapa_autorizado: mapa,
        uf: mapa ? uf : "",
        municipio: "",
      });
      for (const d of documentos)
        await requisitar(
          "/arquivos",
          "POST",
          {
            nome: d.nome,
            base64: d.base64,
            finalidade: "documento",
            campanha_id: id,
          },
          d.chave,
        );
      if (enviar) {
        const p = perfil.dados;
        if (!p) throw new Error("Reabra o perfil antes de enviar a campanha.");
        await requisitar("/perfil-ampliado", "PUT", {
          tipo: p.tipo,
          biografia: p.biografia,
          nome_instituicao: p.nome_instituicao,
          adulto: true,
          publico: Boolean(p.publico),
          local_publico: Boolean(p.local_publico),
          apoios_publicos: Boolean(p.apoios_publicos),
          cor: p.cor,
          avatar_id: p.avatar_id,
          capa_id: p.capa_id,
          usar_foto_google: Boolean(p.usar_foto_google),
        });
        await requisitar("/campanhas/" + id + "/enviar", "POST");
      }
      roteador.replace({
        pathname: "/gerenciar",
        params: { id, salvo: enviar ? "enviada" : "criada" },
      });
    } catch (e) {
      setErro(
        (salva.current
          ? "O rascunho foi salvo. Você pode tentar concluir novamente. "
          : "") + mensagemErro(e),
      );
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Screen
      variant="form"
      title="Criar campanha"
      heading={
        [
          "Toda história merece ser ouvida.",
          "Uma imagem aproxima.",
          "O que você quer realizar?",
          "Vamos conferir?",
        ][etapa]
      }
      step={"Passo " + (etapa + 1) + " de 4"}
      back={etapa > 0}
      onBack={voltar}
    >
      {!usuarioLogado() ? (
        <PedirLogin />
      ) : (
        <>
          {etapa === 0 ? (
            <>
              <Field
                label="Nome da campanha"
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Ex.: Livros para nossa comunidade"
              />
              <Field
                label="Conte sua história"
                multiline
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Quem precisa de ajuda? O que esse apoio pode transformar?"
              />
              <Copy muted>
                Não inclua documentos, telefone ou endereço residencial na
                história pública.
              </Copy>
              <Disclosure title={"Categoria: " + categoria}>
                <Choices
                  label="Categoria da campanha"
                  options={categorias}
                  selected={categoria}
                  onSelect={setCategoria}
                />
              </Disclosure>
              <Disclosure title="Preciso de objetos, voluntários ou mais de uma meta">
                <Copy>
                  Organize outras formas de ajuda com o mesmo cuidado.
                </Copy>
                <Button
                  secondary
                  title="Criar com outras formas de ajuda"
                  onPress={() => {
                    if (!titulo.trim() || !descricao.trim()) {
                      setErro("Preencha o nome e a história primeiro.");
                      return;
                    }
                    roteador.push({
                      pathname: "/pedidos",
                      params: { titulo, descricao, categoria, avancado: "1" },
                    });
                  }}
                />
              </Disclosure>
            </>
          ) : etapa === 1 ? (
            <>
              {imagem ? (
                <Image
                  source={{ uri: imagem }}
                  accessibilityLabel="Prévia da foto escolhida"
                  contentFit="cover"
                  style={estilosFixos.area1}
                />
              ) : (
                <Card title="Mostre o que importa">
                  <Copy>
                    Uma foto autorizada ajuda a contar a história. Ela é
                    opcional.
                  </Copy>
                </Card>
              )}
              <Button
                secondary
                title={
                  ocupado
                    ? "Preparando…"
                    : imagem
                      ? "Trocar foto"
                      : "Adicionar foto"
                }
                disabled={ocupado}
                onPress={foto}
              />
              {imagem ? (
                <Button
                  secondary
                  title="Remover foto"
                  disabled={ocupado}
                  onPress={() => setImagem("")}
                />
              ) : null}
              <Copy muted>
                Use fotos com autorização. Documentos e dados pessoais não devem
                aparecer na imagem pública.
              </Copy>
              <Disclosure
                title={
                  "Documentos privados (opcional)" +
                  (documentos.length ? " · " + documentos.length : "")
                }
              >
                <Copy>
                  Somente você e a equipe de revisão terão acesso. Até três
                  arquivos de 2 MB. Eles não concedem prioridade
                  automaticamente.
                </Copy>
                {documentos.map((d) => (
                  <View key={d.chave} style={estilosFixos.grupo1}>
                    <Copy>{d.nome}</Copy>
                    <Button
                      secondary
                      title={"Remover " + d.nome}
                      onPress={() =>
                        setDocumentos((ds) =>
                          ds.filter((v) => v.chave !== d.chave),
                        )
                      }
                    />
                  </View>
                ))}
                {documentos.length < 3 ? (
                  <Button
                    secondary
                    title="Adicionar documento privado"
                    disabled={ocupado}
                    onPress={documento}
                  />
                ) : null}
              </Disclosure>
            </>
          ) : etapa === 2 ? (
            <>
              <Field
                label="Quanto você precisa arrecadar? (R$)"
                numeric
                value={meta}
                onChangeText={setMeta}
                placeholder="Ex.: 2.000,00"
              />
              <Calendario
                label="Prazo desejado"
                value={prazo}
                onChange={setPrazo}
                opcional
              />
              <Disclosure title="Adicionar localização (opcional)">
                <Field
                  label="Cidade ou região pública"
                  value={cidade}
                  onChangeText={setCidade}
                  placeholder="Sem endereço residencial"
                />
                <View style={estilosFixos.linha1}>
                  <Switch
                    accessibilityLabel="Incluir apenas meu estado no mapa"
                    value={mapa}
                    onValueChange={setMapa}
                  />
                  <Copy>Incluir apenas o estado no mapa</Copy>
                </View>
                {mapa ? (
                  <Choices
                    label="Estado"
                    options={[
                      "Não informar",
                      ..."AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(
                        " ",
                      ),
                    ]}
                    selected={uf}
                    onSelect={setUf}
                  />
                ) : null}
              </Disclosure>
            </>
          ) : (
            <>
              {imagem ? (
                <Image
                  source={{ uri: imagem }}
                  accessibilityLabel="Foto escolhida para a campanha"
                  contentFit="cover"
                  style={estilosFixos.area2}
                />
              ) : null}
              <Card title={titulo} subtitle={categoria}>
                <Copy>{descricao}</Copy>
                <Copy>Meta: {formatarDinheiro(valor / 100)}</Copy>
                <Copy muted>
                  {prazo ? "Prazo desejado: " + prazo : "Sem prazo definido"}
                  {cidade ? " · " + cidade : ""}
                </Copy>
                {documentos.length ? (
                  <Copy muted>
                    {documentos.length} documento(s) em espaço privado.
                  </Copy>
                ) : null}
              </Card>
              <Copy>
                Ao enviar, a equipe revisa a campanha antes de publicar. Você
                pode guardar um rascunho e continuar depois.
              </Copy>
              <EstadoConexao {...perfil} />
              <View style={estilosFixos.linha2}>
                <Switch
                  accessibilityLabel="Declaro ser maior de 18 anos"
                  value={adulto}
                  onValueChange={setAdulto}
                />
                <Copy>
                  Declaro ser maior de 18 anos e responsável pela campanha.
                </Copy>
              </View>
              <Copy muted>
                As contribuições financeiras nesta versão são simuladas. Nenhum
                dinheiro será cobrado.
              </Copy>
            </>
          )}
          {erro ? <Notice error>{erro}</Notice> : null}
          {etapa < 3 ? (
            <Button title="Continuar" disabled={ocupado} onPress={continuar} />
          ) : (
            <>
              <Button
                title={ocupado ? "Salvando…" : "Enviar para análise"}
                disabled={ocupado || !adulto || !perfil.dados}
                onPress={() => salvar(true)}
              />
              <Button
                secondary
                title="Salvar rascunho e continuar depois"
                disabled={ocupado}
                onPress={() => salvar(false)}
              />
            </>
          )}
          {etapa > 0 ? (
            <Button
              secondary
              title="Voltar e conferir"
              disabled={ocupado}
              onPress={voltar}
            />
          ) : null}
          {salva.current && erro ? (
            <Button
              secondary
              title="Abrir rascunho salvo"
              onPress={() =>
                roteador.replace({
                  pathname: "/gerenciar",
                  params: { id: salva.current!.id },
                })
              }
            />
          ) : null}
        </>
      )}
    </Screen>
  );
}

// Estilos fixos separados do JSX, como no exemplo de aula de 07/05.
const estilosFixos = StyleSheet.create({
  area1: { height: 240, borderRadius: 22 },
  grupo1: { gap: 6 },
  linha1: { flexDirection: "row", alignItems: "center", gap: 12 },
  area2: { height: 190, borderRadius: 22 },
  linha2: { flexDirection: "row", alignItems: "center", gap: 12 },
});
