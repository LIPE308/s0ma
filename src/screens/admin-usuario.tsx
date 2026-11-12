import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Line, Notice, Screen } from "../components/ui";
import { EstadoConexao } from "../components/conexao";
import { useDados, useSessao } from "../servicos/api";
type Pessoa = {
 id:number; nome:string; email:string; telefone:string; regiao:string; bloqueado:boolean;
 campanhas:{id:string;titulo:string;estado:string;categoria:string}[];
 atividade:{ajudas:number;doacoes:number};
};
export function CadastroAdministrativo(){
 const {id}=useLocalSearchParams<{id?:string}>();
 const router=useRouter(),admin=useSessao()?.administrador;
 const consulta=useDados<Pessoa>(admin&&id?"/administracao/painel/pessoas/"+id:null);
 const pessoa=consulta.dados;
 return <Screen title="Cadastro e histórico" heading={pessoa?.nome} variant="ledger">
 {!admin?<><Notice>Acesso exclusivo do administrador.</Notice><Button title="Abrir acesso administrativo" onPress={()=>router.replace("/admin")}/></>:!id?<Button title="Voltar aos usuários" onPress={()=>router.replace("/admin")}/>:<>
 <EstadoConexao {...consulta}/>
 {pessoa?<><Line label="Nome completo" value={pessoa.nome}/><Line label="E-mail" value={pessoa.email}/>
 <Line label="Telefone" value={pessoa.telefone||"Não informado"}/><Line label="Cidade" value={pessoa.regiao||"Não informada"}/>
 <Line label="Campanhas criadas" value={String(pessoa.campanhas.length)}/>
 <Line label="Ajudas / doações registradas" value={pessoa.atividade.ajudas+" / "+pessoa.atividade.doacoes}/>
 <Line label="Acesso" value={pessoa.bloqueado?"Bloqueado":"Ativo"}/>
 {pessoa.campanhas.map(c=><Card key={c.id} title={c.titulo} subtitle={c.estado+" · "+c.categoria} onPress={()=>router.push({pathname:"/campanha",params:{id:c.id}})}/>)}</>:null}
 </>}
 </Screen>;
}
