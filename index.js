const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let jogadores = [];
let pagamentos = {};
let timerAtivo = false;

const adms = [
  "705865164259459202",
  "1016493803487645736"
];

const canalPermitido = "943302732738072606";

client.on('ready', () => {
  console.log('🤖 Bot online!');
});

// ======================
// 📊 PAINEL
// ======================

function gerarPainel() {
  let texto = "💰 Controle de Pagamentos\n\n";

  jogadores.forEach((id, i) => {
    const status = pagamentos[id] ? "✅ Pago" : "❌ Pendente";
    texto += `${i + 1}. <@${id}> - ${status}\n`;
  });

  return texto;
}

// ======================
// 🔘 BOTÕES
// ======================

function gerarBotoes() {
  return jogadores.map(id =>
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`pagar_${id}`)
        .setLabel('✅ Confirmar')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`remover_${id}`)
        .setLabel('❌ Remover')
        .setStyle(ButtonStyle.Danger)
    )
  );
}

// ======================
// ⏱️ TIMER
// ======================

function iniciarTimer() {
  if (timerAtivo) return;
  timerAtivo = true;

  setTimeout(async () => {

    let removidos = [];

    jogadores = jogadores.filter(id => {
      if (!pagamentos[id]) {
        removidos.push(id);
        return false;
      }
      return true;
    });

    for (const id of removidos) {
      try {
        const user = await client.users.fetch(id);
        user.send('❌ Você foi removido por não pagar em 5 minutos.');
      } catch {}
      delete pagamentos[id];
    }

    for (const admId of adms) {
      try {
        const adm = await client.users.fetch(admId);
        adm.send(`⏱️ Timer finalizado!\n❌ Removidos: ${removidos.length}`);
      } catch {}
    }

    timerAtivo = false;

  }, 5 * 60 * 1000);
}

// ======================
// 💬 MENSAGENS
// ======================

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // 🔒 canal sem spam
  if (message.channel.id !== canalPermitido) {
    if (message.content.startsWith('!')) {
      return message.reply('❌ Use os comandos no canal correto!');
    }
    return;
  }

  // ======================
  // 🎮 ENTRAR
  // ======================

  if (message.content === '!entrar') {

    if (jogadores.length >= 10) {
      return message.reply('❌ Sala cheia!');
    }

    if (jogadores.includes(message.author.id)) {
      return message.reply('⚠️ Você já está na lista!');
    }

    jogadores.push(message.author.id);
    pagamentos[message.author.id] = false;

    await message.channel.send(`✅ ${message.author.username} entrou (${jogadores.length}/10)`);
    message.delete().catch(() => {});

    if (jogadores.length === 10) {
      message.channel.send('🔥 Sala fechada! Confiram o privado.');

      jogadores.forEach(async (id) => {
        const user = await client.users.fetch(id);

        await user.send(`💸 PAGAMENTO VIA PIX

💰 Valor: R$5,00
🔑 Chave PIX: 672aa93c-bae7-4c71-9711-ed676e7d3794

⏱️ Tempo: 5 minutos`);
      });

      for (const admId of adms) {
        const adm = await client.users.fetch(admId);

        adm.send({
          content: gerarPainel(),
          components: gerarBotoes()
        });
      }

      iniciarTimer();
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
  // ❌ SAIR
  // ======================

  if (message.content === '!sair') {
    const index = jogadores.indexOf(message.author.id);

    if (index === -1) {
      return message.reply('❌ Você não está na fila!');
    }

    jogadores.splice(index, 1);
    delete pagamentos[message.author.id];

    message.reply('✅ Você saiu da fila!');
  }

  // ======================
  // 🏁 FINALIZAR
  // ======================

  if (message.content === '!finalizar') {

    if (!adms.includes(message.author.id)) return;

    if (jogadores.length === 0) {
      return message.reply('❌ Não há partida ativa!');
    }

    message.channel.send(`🏁 Partida finalizada!

👥 Jogadores: ${jogadores.length}
💰 Pagantes: ${Object.values(pagamentos).filter(p => p).length}

🔥 Nova partida liberada! Digite !entrar`);

    jogadores = [];
    pagamentos = {};
  }

});

// ======================
// 🔘 BOTÕES
// ======================

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (!adms.includes(interaction.user.id)) {
    return interaction.reply({ content: '❌ Apenas ADM!', ephemeral: true });
  }

  const [acao, userId] = interaction.customId.split('_');

  // ✅ PAGAR
  if (acao === 'pagar') {
    pagamentos[userId] = true;

    const todosPagaram = jogadores.every(id => pagamentos[id] === true);

    // 🚀 INÍCIO AUTOMÁTICO
    if (todosPagaram && jogadores.length > 0) {

      const canal = await client.channels.fetch(canalPermitido);

      canal.send(`🎮 Todos pagaram!
🔥 Partida iniciando...`);

      jogadores = [];
      pagamentos = {};
      timerAtivo = false;

      return interaction.update({
        content: "✅ Todos pagaram! Partida iniciada!",
        components: []
      });
    }

    return interaction.update({
      content: gerarPainel(),
      components: gerarBotoes()
    });
  }

  // ❌ REMOVER
  if (acao === 'remover') {
    jogadores = jogadores.filter(id => id !== userId);
    delete pagamentos[userId];

    return interaction.update({
      content: gerarPainel(),
      components: gerarBotoes()
    });
  }
});

client.login(process.env.TOKEN);