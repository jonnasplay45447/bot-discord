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

// 🔥 DOIS ADMS
const adms = [
  "705865164259459202",
  "1016493803487645736"
];

const canalPermitido = "943302732738072606";

client.on('ready', () => {
  console.log('🤖 Bot online!');
});

// GERAR PAINEL
function gerarPainel() {
  let texto = "💰 Controle de Pagamentos\n\n";

  jogadores.forEach((id, i) => {
    const status = pagamentos[id] ? "✅ Pago" : "❌ Pendente";
    texto += `${i + 1}. <@${id}> - ${status}\n`;
  });

  return texto;
}

// GERAR BOTÕES
function gerarBotoes() {
  const rows = [];

  jogadores.forEach((id) => {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`pagar_${id}`)
        .setLabel(`✅ Confirmar`)
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`remover_${id}`)
        .setLabel(`❌ Remover`)
        .setStyle(ButtonStyle.Danger)
    );

    rows.push(row);
  });

  return rows;
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.channel.id !== canalPermitido) {
    return message.reply('❌ Use os comandos no canal correto!');
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

    // SALA CHEIA
    if (jogadores.length === 10) {
      message.channel.send('🔥 Sala fechada! Confiram o privado.');

      jogadores.forEach(async (id) => {
        const user = await client.users.fetch(id);

        await user.send(`💸 PAGAMENTO VIA PIX

💰 Valor: R$5,00
🔑 Chave PIX: 672aa93c-bae7-4c71-9711-ed676e7d3794

⏱️ Tempo: 5 minutos`);
      });

      // ENVIA PAINEL PARA TODOS OS ADMS
      for (const admId of adms) {
        try {
          const adm = await client.users.fetch(admId);

          await adm.send({
            content: gerarPainel(),
            components: gerarBotoes()
          });
        } catch (err) {
          console.log("Erro ao enviar painel pro ADM:", err);
        }
      }
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

});

// ======================
// 🔘 BOTÕES (2 ADMS)
// ======================

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  // 🔒 VERIFICA SE É ADM
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