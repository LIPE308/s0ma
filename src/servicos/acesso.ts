import type { Href } from 'expo-router';
import { requisitar, atualizarUsuario, type Usuario } from './api';
import { destinoAposLogin } from './navegacao';
export async function destinoDaSessao(retorno?:string):Promise<Href>{
 const p=await requisitar<Usuario>('/sessao');atualizarUsuario(p);
 if(p.administrador&&!retorno)return '/administracao';
 return !p.perfil_completo?{pathname:'/completar-perfil',params:{retorno}}:destinoAposLogin(retorno);
}
