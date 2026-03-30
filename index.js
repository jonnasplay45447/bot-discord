const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let jogadores = [];

client.on('ready', () => {
  console.log('🤖 Bot online!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!entrar') {

    if (jogadores.length >= 10) {
      return message.reply('❌ Sala cheia!');
    }

    if (jogadores.includes(message.author.id)) {
      return message.reply('⚠️ Você já está na lista!');
    }

    jogadores.push(message.author.id);

    await message.channel.send(`✅ ${message.author.username} entrou (${jogadores.length}/10)`);

    // apaga a mensagem do usuário
    message.delete().catch(() => {});

    if (jogadores.length === 10) {
      message.channel.send('🔥 Sala fechada! Confiram o privado.');

      jogadores.forEach(async (id) => {
        try {
          const user = await client.users.fetch(id);
          await user.send('💸 Você tem 5 minutos para pagar via PIX!');
        } catch (err) {
          console.log('Erro ao enviar DM:', err);
        }
      });
    }
  }

  // COMANDO PRA VER FILA
  if (message.content === '!fila') {
    if (jogadores.length === 0) {
      return message.reply('Fila vazia 😴');
    }

    const lista = jogadores
      .map((id, i) => `<@${id}> - ${i + 1}`)
      .join('\n');

    message.reply(`📋 Fila:\n${lista}`);
  }

  // COMANDO PRA SAIR
  if (message.content === '!sair') {
    const index = jogadores.indexOf(message.author.id);

    if (index === -1) {
      return message.reply('❌ Você não está na fila!');
    }

    jogadores.splice(index, 1);

    message.reply('✅ Você saiu da fila!');
  }
});

// LOGIN (só uma vez!)
client.login(process.env.TOKEN);