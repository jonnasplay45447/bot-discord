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

const cargoAdmin = "943302582816890973";
const canalPermitido = "943302732738072606";
const canalTicket = "1489094389698527334";

const cargoFila = "943302704275550208";
const cargoPago = "1489100736225870015";

const tempoPagamento = 10 * 60 * 1000;

// ======================

let jogadores = [];
let filaAberta = false;
let filaFechada = false;
let timerPagamento = null;

// ======================

client.on('ready', () => {
  console.log('🤖 Bot online!');
});

// ======================

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const member = message.member;

  // canal único
  if (message.channel.id !== canalPermitido) {
    if (message.content.startsWith('!')) {
      return message.reply('❌ Use os comandos no canal correto!');
    }
    return;
  }

  const isAdmin = member.roles.cache.has(cargoAdmin);

  // ======================
  // 🟢 ABRIR FILA
  // ======================

  if (message.content === '!abrirfila') {

    if (!isAdmin) return;

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

    if (jogadores.includes(message.author.id)) {
      return message.reply('⚠️ Você já está na fila!');
    }

    if (jogadores.length >= 10) {
      return message.reply('❌ Sala cheia!');
    }

    jogadores.push(message.author.id);

    await member.roles.add(cargoFila).catch(() => {});

    message.channel.send(`✅ ${message.author.username} entrou (${jogadores.length}/10)`);

    if (jogadores.length === 10) {

      filaFechada = true;
      filaAberta = false;

      message.channel.send(`🔥 Fila fechada!

🎟️ Vá até o canal <#${canalTicket}> e abra seu ticket para enviar o comprovante.
⏱️ Você tem 10 minutos para pagar!`);

      iniciarTimer(message.guild, message.channel);
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

    if (!isAdmin) return;

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

    if (jogadores.length < 10 && filaFechada) {
      filaFechada = false;
      filaAberta = true;

      message.channel.send('♻️ Vaga liberada! Fila reaberta.');
    }
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
  // 🏁 FINALIZAR
  // ======================

  if (message.content === '!finalizar') {

    if (!isAdmin) return;

    if (timerPagamento) clearTimeout(timerPagamento);

    const membros = message.guild.members.cache;

    for (const membro of membros.values()) {
      if (membro.roles.cache.has(cargoFila)) {
        await membro.roles.remove(cargoFila).catch(() => {});
      }

      if (membro.roles.cache.has(cargoPago)) {
        await membro.roles.remove(cargoPago).catch(() => {});
      }
    }

    jogadores = [];
    filaAberta = false;
    filaFechada = false;

    message.channel.send(`🏁 Partida finalizada!

⚡ Quem não conseguiu entrar fica ligado, pois novas partidas serão anunciadas em breve.
🎮 Continue acompanhando o JJ Diários para não perder as próximas!`);
  }

});

// ======================
// ⏱️ TIMER
// ======================

function iniciarTimer(guild, channel) {

  if (timerPagamento) clearTimeout(timerPagamento);

  timerPagamento = setTimeout(async () => {

    let removidos = [];
    let novosJogadores = [];

    for (const id of jogadores) {

      try {
        const membro = await guild.members.fetch(id);

        if (!membro.roles.cache.has(cargoPago)) {

          await membro.roles.remove(cargoFila).catch(() => {});
          removidos.push(`<@${id}>`);

        } else {
          novosJogadores.push(id);
        }

      } catch {}
    }

    jogadores = novosJogadores;

    if (removidos.length > 0) {
      channel.send(`⏰ Tempo esgotado!

❌ Removidos por não pagamento:
${removidos.join('\n')}`);
    }

    filaFechada = false;
    filaAberta = true;

    channel.send('♻️ Fila reaberta! Novos jogadores podem entrar.');

  }, tempoPagamento);
}

// ======================

client.login(process.env.TOKEN);