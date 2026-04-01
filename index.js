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

const adms = [
  "705865164259459202",
  "1016493803487645736"
];

const canalPermitido = "943302732738072606";

client.on('ready', () => {
  console.log('🤖 Bot online!');
});

// PAINEL
function gerarPainel() {
  let texto = "💰 Controle de Pagamentos\n\n";

  jogadores.forEach((id, i) => {
    const status = pagamentos[id] ? "✅ Pago" : "❌ Pendente";
    texto += `${i + 1}. <@${id}> - ${status}\n`;
  });

  return texto;
}

// BOTÕES
function gerarBotoes() {
  return jogadores.map(id =>
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`pagar_${id}`)
        .setLabel(`✅ Confirmar`)
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`remover_${id}`)
        .setLabel(`❌ Remover`)
        .setStyle(ButtonStyle.Danger)
    )
  );
}

// ⏱️ TIMER DE PAGAMENTO
async function iniciarTimer() {
  setTimeout(async () => {

    let removidos = [];

    jogadores = jogadores.filter(id => {
      if (!pagamentos[id]) {
        removidos.push(id);
        return false;
      }
      return true;
    });

    // avisar removidos
    for (const id of removidos) {
      try {
        const user = await client.users.fetch(id);
        user.send('❌ Você foi removido por não realizar o pagamento no tempo.');
      } catch {}
      delete pagamentos[id];
    }

    // avisar ADM
    for (const admId of adms) {
      try {
        const adm = await client.users.fetch(admId);
        adm.send(`⏱️ Timer finalizado!\n❌ Removidos: ${removidos.length}`);
      } catch {}
    }

  }, 5 * 60 * 1000); // 5 minutos
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.channel.id !== canalPermitido) {
    if (message.content.startsWith('!')) {
      return message.reply('❌ Use os comandos no canal correto!');
    }
    return;
  }

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

      // enviar painel pros adms
      for (const admId of adms) {
        const adm = await client.users.fetch(admId);
        adm.send({
          content: gerarPainel(),
          components: gerarBotoes()
        });
      }

      // 🔥 INICIA TIMER
      iniciarTimer();
    }
  }

  if (message.content === '!fila') {
    if (jogadores.length === 0) {
      return message.reply('Fila vazia 😴');
    }

    const lista = jogadores
      .map((id, i) => `<@${id}> - ${i + 1}`)
      .join('\n');

    message.reply(`📋 Fila:\n${lista}`);
  }

  if (message.content === '!sair') {
    const index = jogadores.indexOf(message.author.id);

    if (index === -1) {
      return message.reply('❌ Você não está na fila!');
    }

    jogadores.splice(index, 1);
    delete pagamentos[message.author.id];

    message.reply('✅ Você saiu da fila!');
  }
});

// BOTÕES
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (!adms.includes(interaction.user.id)) {
    return interaction.reply({ content: '❌ Apenas ADM!', ephemeral: true });
  }

  const [acao, userId] = interaction.customId.split('_');

  if (acao === 'pagar') {
    pagamentos[userId] = true;

    return interaction.update({
      content: gerarPainel(),
      components: gerarBotoes()
    });
  }

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