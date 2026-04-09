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
let reserva = [];
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

    jogadores = [];
    reserva = [];

    filaAberta = true;
    filaFechada = false;

    message.channel.send('🟢 Fila aberta! Digite !entrar');
  }

  // ======================
  // 🎮 ENTRAR
  // ======================

  if (message.content === '!entrar') {

    if (!filaAberta) {
      return message.reply('❌ A fila está fechada!');
    }

    if (jogadores.includes(message.author.id) || reserva.includes(message.author.id)) {
      return message.reply('⚠️ Você já está na fila!');
    }

    // 🔥 FILA PRINCIPAL
    if (jogadores.length < 10) {

      jogadores.push(message.author.id);
      await member.roles.add(cargoFila).catch(() => {});

      message.channel.send(`✅ ${message.author.username} entrou (${jogadores.length}/10)`);

      if (jogadores.length === 10) {
        filaFechada = true;
        filaAberta = false;

        message.channel.send(`🔥 Fila principal fechada!

🎟️ Vá até o canal <#${canalTicket}> e abra seu ticket.
⏱️ Você tem 10 minutos para pagar!

📌 Agora a fila de espera está aberta (até 20 jogadores).`);

        iniciarTimer(message.guild, message.channel);
      }

    } else if (reserva.length < 10) {

      // 🕐 FILA RESERVA
      reserva.push(message.author.id);

      message.channel.send(`⏱️ ${message.author.username} entrou na fila de espera (${reserva.length}/10)`);

    } else {
      return message.reply('❌ Fila e reserva cheias!');
    }
  }

  // ======================
  // ❌ SAIR
  // ======================

  if (message.content === '!sair') {

    if (filaFechada) {
      return message.reply('❌ Não é possível sair após fechar!');
    }

    let index = jogadores.indexOf(message.author.id);

    if (index !== -1) {
      jogadores.splice(index, 1);
      await member.roles.remove(cargoFila).catch(() => {});
      return message.reply('✅ Você saiu da fila!');
    }

    index = reserva.indexOf(message.author.id);

    if (index !== -1) {
      reserva.splice(index, 1);
      return message.reply('✅ Você saiu da fila de espera!');
    }

    return message.reply('❌ Você não está na fila!');
  }

  // ======================
  // 📋 FILA
  // ======================

  if (message.content === '!fila') {

    let texto = "📋 Fila:\n";

    jogadores.forEach((id, i) => {
      texto += `<@${id}> - ${i + 1}\n`;
    });

    if (reserva.length > 0) {

      texto += `\n⏱️ Fila de espera:\n`;

      reserva.forEach((id, i) => {
        texto += `<@${id}> - ${i + 11}\n`;
      });

      texto += `\n⚡ Caso alguém da fila principal não pague, o próximo da fila de espera assume automaticamente!`;
    }

    message.reply(texto);
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
    reserva = [];
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

    for (const id of jogadores) {

      const membro = await guild.members.fetch(id);

      if (!membro.roles.cache.has(cargoPago)) {

        await membro.roles.remove(cargoFila).catch(() => {});
        removidos.push(id);
      }
    }

    // remove quem não pagou
    jogadores = jogadores.filter(id => !removidos.includes(id));

    // 🔥 PUXA DA RESERVA
    while (jogadores.length < 10 && reserva.length > 0) {

      const novo = reserva.shift();
      jogadores.push(novo);

      const membro = await guild.members.fetch(novo);
      await membro.roles.add(cargoFila).catch(() => {});

      channel.send(`🔄 <@${novo}> entrou da fila de espera para a principal!`);
    }

    if (removidos.length > 0) {
      channel.send(`⏰ Removidos por não pagamento:\n${removidos.map(id => `<@${id}>`).join('\n')}`);
    }

    filaAberta = true;
    filaFechada = false;

    channel.send('♻️ Fila reaberta!');

  }, tempoPagamento);
}

// ======================

client.login(process.env.TOKEN);