const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.TOKEN;

let jogadores = [];

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
    message.channel.send(`✅ ${message.author.username} entrou (${jogadores.length}/10)`);
    message.delete();

    if (jogadores.length === 10) {
      message.channel.send('🔥 Sala fechada! Confiram o privado.');

      jogadores.forEach(async (id) => {
        const user = await client.users.fetch(id);
        user.send('💸 Você tem 5 minutos para pagar via PIX!');
      });
    }
  }
});

client.login(TOKEN);