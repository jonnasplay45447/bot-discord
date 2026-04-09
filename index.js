const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// ======================
// ⚙️ CONFIG (JÁ AJUSTADO PRA VOCÊ)
// ======================

const cargoAdmin = "943302582816890973";
const cargoFila = "943302704275550208";
const cargoPago = "1489100736225870015";

const canalPermitido = "943302732738072606";
const canalTicket = "1489094389698527334";

const pix = "672aa93c-bae7-4c71-9711-ed676e7d3794";

// ======================

let fila = [];
let painelMessage = null;

// ======================

client.on('ready', () => {
  console.log('🤖 Bot online!');
});

// ======================
// 📤 COMANDOS
// ======================

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // só responde comandos no canal correto
  if (message.channel.id !== canalPermitido) {
    if (message.content.startsWith('!')) {
      return message.reply('❌ Use os comandos no canal correto!');
    }
    return;
  }

  const isAdmin = message.member.roles.cache.has(cargoAdmin);

  // ======================
  // 🎛️ PAINEL
  // ======================

  if (message.content === '!painel') {

    if (!isAdmin) return;

    if (painelMessage) {
      return message.reply('❌ Já existe um painel ativo!');
    }

    const embed = new EmbedBuilder()
      .setTitle("💰 Sala | R$5,00")
      .setDescription("🎮 Fila:\nNinguém na fila.")
      .setColor("Yellow")
      .setFooter({ text: "💸 Prêmio: R$10 + R$3 por kill" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('entrar')
        .setLabel('Entrar')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('sair')
        .setLabel('Sair')
        .setStyle(ButtonStyle.Danger)
    );

    painelMessage = await message.channel.send({
      embeds: [embed],
      components: [row]
    });

    message.delete().catch(() => {});
  }

  // ======================
  // 🏁 FINALIZAR
  // ======================

  if (message.content === '!finalizar') {

    if (!isAdmin) return;

    const membros = message.guild.members.cache;

    for (const membro of membros.values()) {
      if (membro.roles.cache.has(cargoFila)) {
        await membro.roles.remove(cargoFila).catch(() => {});
      }
      if (membro.roles.cache.has(cargoPago)) {
        await membro.roles.remove(cargoPago).catch(() => {});
      }
    }

    fila = [];

    if (painelMessage) {
      await painelMessage.delete().catch(() => {});
      painelMessage = null;
    }

    message.channel.send(`🏁 Partida finalizada!

⚡ Quem não conseguiu entrar fica ligado, pois novas partidas serão anunciadas em breve.
🎮 Continue acompanhando o JJ Diários para não perder as próximas!`);
  }
});

// ======================
// 🎮 BOTÕES
// ======================

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const membro = interaction.member;

  // ======================
  // ➕ ENTRAR
  // ======================

  if (interaction.customId === 'entrar') {

    if (fila.includes(interaction.user.id)) {
      return interaction.reply({ content: '⚠️ Você já está na fila!', ephemeral: true });
    }

    if (fila.length >= 10) {
      return interaction.reply({ content: '❌ Fila cheia!', ephemeral: true });
    }

    fila.push(interaction.user.id);

    await membro.roles.add(cargoFila).catch(() => {});

    await interaction.reply({ content: '✅ Você entrou na fila!', ephemeral: true });
  }

  // ======================
  // ➖ SAIR
  // ======================

  if (interaction.customId === 'sair') {

    const index = fila.indexOf(interaction.user.id);

    if (index === -1) {
      return interaction.reply({ content: '❌ Você não está na fila!', ephemeral: true });
    }

    fila.splice(index, 1);

    await membro.roles.remove(cargoFila).catch(() => {});

    await interaction.reply({ content: '✅ Você saiu da fila!', ephemeral: true });
  }

  // ======================
  // 🔄 ATUALIZAR EMBED
  // ======================

  if (!painelMessage) return;

  const lista = fila.length > 0
    ? fila.map((id, i) => `<@${id}> - ${i + 1}`).join('\n')
    : "Ninguém na fila.";

  const embed = new EmbedBuilder()
    .setTitle("💰 Sala | R$5,00")
    .setDescription(`🎮 Fila:\n${lista}`)
    .setColor("Yellow")
    .setFooter({ text: "💸 Prêmio: R$10 + R$3 por kill" });

  await painelMessage.edit({ embeds: [embed] });

  // ======================
  // 🔥 FECHOU COM 10
  // ======================

  if (fila.length === 10) {

    interaction.channel.send(`🔥 Sala fechada!

🎟️ Vá até o canal <#${canalTicket}> e envie o comprovante.

💸 PIX:
${pix}

⏱️ Tempo: 10 minutos`);
  }
});

// ======================

client.login(process.env.TOKEN);