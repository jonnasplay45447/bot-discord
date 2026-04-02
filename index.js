const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ======================
// ⚙️ CONFIG
// ======================

const adms = [
  "705865164259459202",
  "1016493803487645736"
];

const canalPermitido = "943302732738072606";

// 🔥 SEUS CARGOS
const cargoFila = "943302704275550208"; // Na Fila ⚠️
const cargoPago = "1489100736225870015"; // PG✅

// ======================

let jogadores = [];
let filaAberta = false;
let filaFechada = false;

// ======================
// 🤖 READY
// ======================

client.on('ready', () => {
  console.log('🤖 Bot online!');
});

// ======================
// 💬 MENSAGENS
// ======================

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // 🔒 canal único
  if (message.channel.id !== canalPermitido) {
    if (message.content.startsWith('!')) {
      return message.reply('❌ Use os comandos no canal correto!');
    }
    return;
  }

  const member = message.member;

  // ======================
  // 🟢 ABRIR FILA
  // ======================

  if (message.content === '!abrirfila') {

    if (!adms.includes(message.author.id)) return;

    filaAberta = true;
    filaFechada = false;
    jogadores = [];

    message.channel.send('🟢 Fila aberta! Digite !entrar');
  }

  // ======================
  // 🎮 ENTRAR
  // ======================

  if (message.content === '!entrar') {

    if (!filaAberta) {
      return message.reply('❌ A fila está fechada!');
    }

    if (filaFechada) {
      return message.reply('❌ A fila já foi fechada!');
    }

    if (jogadores.includes(message.author.id)) {
      return message.reply('⚠️ Você já está na fila!');
    }

    if (jogadores.length >= 10) {
      return message.reply('❌ Sala cheia!');
    }

    jogadores.push(message.author.id);

    await member.roles.add(cargoFila).catch(err => {
      console.log("Erro ao dar cargo:", err);
    });

    message.channel.send(`✅ ${message.author.username} entrou (${jogadores.length}/10)`);

    // 🔒 FECHAR COM 10
    if (jogadores.length === 10) {

      filaFechada = true;
      filaAberta = false;

      message.channel.send(`🔥 Fila fechada!

🎟️ Liberado acesso ao canal de inscrição!
Envie seu comprovante no ticket.`);
    }
  }

  // ======================
  // ❌ SAIR
  // ======================

  if (message.content === '!sair') {

    if (filaFechada) {
      return message.reply('❌ Não é possível sair após fechar a fila!');
    }

    const index = jogadores.indexOf(message.author.id);

    if (index === -1) {
      return message.reply('❌ Você não está na fila!');
    }

    jogadores.splice(index, 1);

    await member.roles.remove(cargoFila).catch(() => {});

    message.reply('✅ Você saiu da fila!');
  }

  // ======================
  // ❌ REMOVER (ADM)
  // ======================

  if (message.content.startsWith('!remover')) {

    if (!adms.includes(message.author.id)) return;

    const user = message.mentions.users.first();
    if (!user) return message.reply('❌ Marque alguém!');

    const index = jogadores.indexOf(user.id);
    if (index === -1) {
      return message.reply('❌ Esse usuário não está na fila!');
    }

    jogadores.splice(index, 1);

    const membro = await message.guild.members.fetch(user.id);

    await membro.roles.remove(cargoFila).catch(() => {});

    message.channel.send(`❌ ${user.tag} foi removido da fila`);
  }

  // ======================
  // 📋 FILA
  // ======================

  if (message.content === '!fila') {

    if (jogadores.length === 0) {
      return message.reply('Fila vazia 😴');
    }

    const lista = jogadores
      .map((id, i) => `<@${id}> - ${i + 1}`)
      .join('\n');

    message.reply(`📋 Fila:\n${lista}`);
  }

  // ======================
  // 🏁 FINALIZAR (VERSÃO FORTE)
  // ======================

  if (message.content === '!finalizar') {

    if (!adms.includes(message.author.id)) return;

    const membros = await message.guild.members.fetch();

    membros.forEach(async (membro) => {
      try {
        if (membro.roles.cache.has(cargoFila)) {
          await membro.roles.remove(cargoFila);
        }

        if (membro.roles.cache.has(cargoPago)) {
          await membro.roles.remove(cargoPago);
        }
      } catch (err) {
        console.log("Erro ao remover cargo:", err);
      }
    });

    jogadores = [];
    filaAberta = false;
    filaFechada = false;

    message.channel.send(`🏁 Partida finalizada!

⚡ Quem não conseguiu entrar fica ligado, pois novas partidas serão anunciadas em breve.
🎮 Continue acompanhando o JJ Diários para não perder as próximas!`);
  }

});

// ======================

client.login(process.env.TOKEN);