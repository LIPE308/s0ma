import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Updates from "expo-updates";
import { criarVerificacaoOTA, lerRegistrosOTA, type EventoOTA, type RegistroOTA } from "./atualizacoes-core";
import { VERSAO_OTA } from "./versao-ota";

const chave = "soma_ota_logs_v1";
const eventos: RegistroOTA[] = [];
let escrita = Promise.resolve();

function registrar(evento: EventoOTA) {
  const registro: RegistroOTA = { horario: new Date().toISOString(), evento };
  eventos.push(registro);
  if (eventos.length > 40) eventos.shift();
  // Somente códigos conhecidos: nunca registrar tokens, payloads ou erros brutos.
  console.info("[SOMA OTA]", evento, VERSAO_OTA);
  escrita = escrita.then(async () => {
    try {
      const anteriores = lerRegistrosOTA(await AsyncStorage.getItem(chave));
      await AsyncStorage.setItem(chave, JSON.stringify([...anteriores, registro].slice(-40)));
    } catch {
      // Falhar ao registrar diagnóstico não pode bloquear o aplicativo.
    }
  });
}

export const verificarAtualizacoesNaAbertura = criarVerificacaoOTA({
  habilitado: Platform.OS !== "web" && !__DEV__ && Updates.isEnabled,
  verificar: Updates.checkForUpdateAsync,
  baixar: Updates.fetchUpdateAsync,
  registrar,
});

export async function diagnosticoAtualizacoes() {
  await escrita;
  let registros = eventos;
  try {
    const salvos = lerRegistrosOTA(await AsyncStorage.getItem(chave));
    if (salvos.length) registros = salvos;
  } catch { /* Diagnóstico em memória continua disponível. */ }
  let codigosNativos: { horario: number; codigo: string; nivel: string }[] = [];
  if (Platform.OS !== "web" && Updates.isEnabled) {
    try {
      const logs = await Updates.readLogEntriesAsync(24 * 60 * 60 * 1000);
      codigosNativos = logs.slice(-20).map(log => ({
        horario: log.timestamp, codigo: log.code, nivel: log.level,
      }));
    } catch { /* Sem acesso aos logs nativos: não altera o fluxo do usuário. */ }
  }
  return {
    habilitado: Platform.OS !== "web" && !__DEV__ && Updates.isEnabled,
    versao: VERSAO_OTA,
    canal: Updates.channel,
    runtime: Updates.runtimeVersion,
    updateId: Updates.updateId,
    origem: Platform.OS === "web" || __DEV__ || !Updates.isEnabled ? "Web, Expo Go ou depuração" : Updates.isEmbeddedLaunch ? "APK instalado" : "Atualização OTA",
    recuperacaoEmergencial: Updates.isEmergencyLaunch,
    registros,
    codigosNativos,
  };
}
