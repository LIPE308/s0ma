// Apenas para testar com o telefone na mesma rede confiável.
process.env.ENDERECO = '0.0.0.0';
console.log('Teste em rede local: mantenha este terminal aberto. Não use senhas reais em HTTP.');
require('../backend/servidor');
