const { randomUUID } = require('node:crypto');
const { prepararArquivo } = require('./midias');

// Compatibilidade aditiva com a main 6d63efd. Fontes antigas permanecem intactas.
async function migrarCompatibilidade(consultar,transacao) {
  await transacao(async q=>{
    await q("SELECT chave FROM soma_migracoes WHERE chave='002-lancamentos-em-andamento' FOR UPDATE");
    if ((await q("SELECT chave FROM soma_migracoes WHERE chave='003-integracao-main'"))[0]) return;
    const tabelas=await q('SELECT TABLE_NAME AS nome FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()');
    const existe=t=>tabelas.some(r=>r.nome===t);
    async function importarImagem(valor,usuario,campanha,finalidade) {
      const b64=String(valor||'').match(/^data:image\/(?:png|jpeg);base64,(.+)$/)?.[1];
      if (!b64) return null;
      let arquivo;try { arquivo=prepararArquivo(b64,finalidade); } catch { return null; }
      const id=randomUUID();
      await q('INSERT INTO arquivos (id,usuario_id,campanha_id,nome,mime,finalidade,publico,tamanho,conteudo) VALUES (?,?,?,?,?,?,?,?,?)',[id,usuario,campanha,'imagem-importada',arquivo.mime,finalidade,Number(finalidade==='campanha'),arquivo.conteudo.length,arquivo.conteudo]);
      return id;
    }
    const colunas=await q('SHOW COLUMNS FROM perfis');
    if (colunas.some(c=>c.Field==='foto')) {
      for (const p of await q('SELECT * FROM perfis')) {
        const avatar=p.avatar_id||await importarImagem(p.foto,p.usuario_id,null,'avatar');
        const capa=p.capa_id||await importarImagem(p.capa,p.usuario_id,null,'capa');
        await q('UPDATE perfis SET avatar_id=?,capa_id=? WHERE usuario_id=?',[avatar,capa,p.usuario_id]);
      }
    }
    if (existe('localizacoes_publicas')) await q("INSERT IGNORE INTO campanhas_detalhes (campanha_id,uf,mapa_autorizado) SELECT campanha_id,uf,1 FROM localizacoes_publicas");
    if (existe('imagens_campanha')) for (const f of await q('SELECT i.*,c.usuario_id FROM imagens_campanha i JOIN campanhas c ON c.id=i.campanha_id')) {
      const [atual]=await q('SELECT imagem_id FROM campanhas_detalhes WHERE campanha_id=?',[f.campanha_id]);
      if (atual?.imagem_id) continue;
      const id=await importarImagem(f.imagem,f.usuario_id,f.campanha_id,'campanha');
      if (id) await q('INSERT INTO campanhas_detalhes (campanha_id,imagem_id) VALUES (?,?) ON DUPLICATE KEY UPDATE imagem_id=VALUES(imagem_id)',[f.campanha_id,id]);
    }
    // A UF já era gravada por escolha explícita. Não inferir município/endereço.

    if (existe('identidades_google')) await q("INSERT IGNORE INTO identidades (usuario_id,provedor,sujeito) SELECT usuario_id,'google',sub FROM identidades_google");
    if (existe('revisoes_urgencia')) for (const r of await q('SELECT * FROM revisoes_urgencia ORDER BY id')) {
      await q("INSERT INTO urgencia_historico (campanha_id,usuario_id,acao,dados,criado_em) VALUES (?,?,'importacao',?,?)",[r.campanha_id,r.revisor_id||r.autor_id,JSON.stringify({relato:r.relato,classe_anterior:r.categoria,justificativa:r.justificativa||'Pedido anterior preservado. Envie uma solicitação com as evidências atuais para nova avaliação.',estado_anterior:r.estado,origem_id:r.id}),r.revisada_em||r.criada_em]);
    }
    if (existe('receitas_solidarias')) for (const r of await q('SELECT * FROM receitas_solidarias ORDER BY id')) {
      const insercao=await q("INSERT INTO receitas_publicitarias (referencia,bruto,justificativa,estado,usuario_id,criada_em,confirmada_em) VALUES (?,?,?,'distribuida',?,?,?)",['legado:'+r.id+':'+r.referencia,r.valor,'Importação de receita simulada anteriormente distribuída. Fonte preservada em receitas_solidarias.',r.autor_id,r.criada_em,r.criada_em]);
      for (const d of await q('SELECT * FROM distribuicoes_solidarias WHERE receita_id=?',[r.id])) {
        const necessidades=await q("SELECT id,meta,recebido FROM necessidades WHERE campanha_id=? AND tipo='dinheiro' ORDER BY id FOR UPDATE",[d.campanha_id]);
        if (!necessidades.length) throw new Error('Distribuição antiga sem necessidade financeira: exige conciliação manual antes da migração.');
        let restante=d.valor;
        for (let i=0;i<necessidades.length&&restante>0;i++) {
          const n=necessidades[i],valor=i===necessidades.length-1?restante:Math.min(restante,Math.max(0,n.meta-n.recebido));if(!valor) continue;
          const referencia='anuncio-legado:'+r.id+':'+n.id;
          await q('INSERT INTO distribuicoes (receita_id,campanha_id,necessidade_id,valor,peso,criterios,criada_em) VALUES (?,?,?,?,1,?,?)',[insercao.insertId,d.campanha_id,n.id,valor,JSON.stringify({importado:true,fonte:'distribuicoes_solidarias',receita_antiga:r.id}),r.criada_em]);
          await q("INSERT INTO lancamentos (campanha_id,necessidade_id,origem,referencia,valor,criado_em) VALUES (?,?,'anuncio',?,?,?)",[d.campanha_id,n.id,referencia,valor,r.criada_em]);
          await q('UPDATE necessidades SET recebido=recebido+? WHERE id=?',[valor,n.id]);restante-=valor;
        }
      }
    }
    await q("INSERT INTO auditoria (acao,dados) VALUES ('integracao_main_importada',?)",[JSON.stringify({fonte:'6d63efd',urgencias:'Revisões anteriores preservadas em revisoes_urgencia; prioridade requer os critérios e evidências atuais.',privacidade:'Perfis importados privados até nova autorização.'})]);
    await q("INSERT INTO soma_migracoes (chave) VALUES ('003-integracao-main')");
  });
}
module.exports={migrarCompatibilidade};
