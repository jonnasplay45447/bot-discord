const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let jogadores = [];

const admId = "705865164259459202";
const canalPermitido = "943302732738072606";

client.on('ready', () => {
  console.log('🤖 Bot online!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // 🔒 CANAL PERMITIDO
  if (message.channel.id !== canalPermitido) {
    return message.reply('❌ Use os comandos no canal correto!');
  }

  // ======================
  // 🔒 COMANDOS DE ADM (DISCRETOS)
  // ======================

  if (message.content === '!resetar') {
    if (message.author.id !== admId) return;

    jogadores = [];
    return message.reply('🗑️ Fila resetada!');
  }

  if (message.content.startsWith('!remover')) {
    if (message.author.id !== admId) return;

    const user = message.mentions.users.first();
    if (!user) return message.reply('⚠️ Marque alguém para remover!');

    const index = jogadores.indexOf(user.id);
    if (index === -1) return message.reply('❌ Esse usuário não está na fila!');

    jogadores.splice(index, 1);
    return message.reply(`🗑️ ${user.username} foi removido da fila!`);
  }

  if (message.content === '!fechar') {
    if (message.author.id !== admId) return;

    message.channel.send('🔥 Sala fechada manualmente!');

    jogadores.forEach(async (id) => {
      try {
        const user = await client.users.fetch(id);

        await user.send(`💸 PAGAMENTO VIA PIX

💰 Valor: R$5,00
🔑 Chave PIX: 672aa93c-bae7-4c71-9711-ed676e7d3794

⏱️ Tempo: 5 minutos`);
      } catch (err) {
        console.log('Erro ao enviar DM:', err);
      }
    });
  }

  // ======================
  // 🎮 COMANDOS NORMAIS
  // ======================

  if (message.content === '!entrar') {

    if (jogadores.length >= 10) {
      return message.reply('❌ Sala cheia!');
    }

    if (jogadores.includes(message.author.id)) {
      return message.reply('⚠️ Você já está na lista!');
    }

    jogadores.push(message.author.id);

    // AVISAR ADM
    try {
      const adm = await client.users.fetch(admId);
      await adm.send(`📥 Novo jogador entrou!

👤 ${message.author.tag}
🆔 ${message.author.id}
📊 Posição: ${jogadores.length}`);
    } catch (err) {
      console.log("Erro ao avisar ADM:", err);
    }

    await message.channel.send(`✅ ${message.author.username} entrou (${jogadores.length}/10)`);
    message.delete().catch(() => {});

    // SALA CHEIA
    if (jogadores.length === 10) {
      message.channel.send('🔥 Sala fechada! Confiram o privado.');

      jogadores.forEach(async (id) => {
        try {
          const user = await client.users.fetch(id);

          await user.send(`💸 PAGAMENTO VIA PIX

💰 Valor: R$5,00
🔑 Chave PIX: 672aa93c-bae7-4c71-9711-ed676e7d3794

⏱️ Tempo: 5 minutos

📸 Envie o comprovante para o ADM.`);
        } catch (err) {
          console.log('Erro ao enviar DM:', err);
        }
      });
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

    message.reply('✅ Você saiu da fila!');

    // AVISAR ADM
    try {
      const adm = await client.users.fetch(admId);
      await adm.send(`📤 Jogador saiu!

👤 ${message.author.tag}
📊 Restam: ${jogadores.length}`);
    } catch (err) {
      console.log("Erro ao avisar ADM:", err);
    }
  }

});

client.login(process.env.TOKEN);