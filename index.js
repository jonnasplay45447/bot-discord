const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= CONFIG =================

const cargoAdmin = "943302582816890973";
const cargoFila = "943302704275550208";
const cargoPago = "1489100736225870015";

const canalFila = "943302732738072606";
const canalTicket10 = "1489094389698527334";

const categoriaTicket = "1492239705843171559";
const canalLogs = "943302717865070632";

const pix = "672aa93c-bae7-4c71-9711-ed676e7d3794";

// ==========================================

let fila = [];
let painel = null;

let filasX1 = {};
let paineisX1 = {};

let tickets = {};

// ================= READY =================

client.on('ready', () => {
  console.log('🤖 Bot online!');
});

// ================= COMANDOS =================

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const isAdmin = message.member.roles.cache.has(cargoAdmin);
  if (!isAdmin) return;

  // 🎮 PAINEL 10
  if (message.content === '!painel') {

    if (painel) return message.reply('Já existe um painel!');

    const embed = new EmbedBuilder()
      .setTitle("💰 Sala | R$5")
      .setDescription("🎮 Fila:\nNinguém na fila.")
      .setColor("Yellow");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('entrar').setLabel('Entrar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('sair').setLabel('Sair').setStyle(ButtonStyle.Danger)
    );

    painel = await message.channel.send({ embeds: [embed], components: [row] });
  }

  // 🔥 MULTI X1
  if (message.content.startsWith('!x1')) {

    const valor = message.content.split(' ')[1];

    if (!['1', '3', '5', '10'].includes(valor)) {
      return message.reply('Use: !x1 1 / 3 / 5 / 10');
    }

    if (paineisX1[valor]) {
      return message.reply('Já existe painel desse valor!');
    }

    filasX1[valor] = [];

    const embed = new EmbedBuilder()
      .setTitle(`🔥 X1 | R$${valor}`)
      .setDescription("👥 Fila:\nNinguém na fila.")
      .setColor("Red");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`entrar_x1_${valor}`)
        .setLabel('Entrar')
        .setStyle(ButtonStyle.Success)
    );

    paineisX1[valor] = await message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }

  // 🏁 FINALIZAR
  if (message.content === '!finalizar') {

    for (const membro of message.guild.members.cache.values()) {

      if (membro.roles.cache.has(cargoAdmin)) continue;

      if (membro.roles.cache.has(cargoFila)) {
        await membro.roles.remove(cargoFila).catch(() => {});
      }

      if (membro.roles.cache.has(cargoPago)) {
        await membro.roles.remove(cargoPago).catch(() => {});
      }
    }

    fila = [];

    if (painel) {
      await painel.delete().catch(() => {});
      painel = null;
    }

    message.channel.send(`🏁 Partida finalizada!

⚡ Fique ligado nas próximas!`);
  }
});

// ================= BOTÕES =================

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const membro = interaction.member;

  // ===== SALA 10 =====

  if (interaction.customId === 'entrar') {

    if (fila.includes(interaction.user.id)) {
      return interaction.reply({ content: 'Já está na fila!', ephemeral: true });
    }

    if (fila.length >= 10) {
      return interaction.reply({ content: 'Fila cheia!', ephemeral: true });
    }

    fila.push(interaction.user.id);
    await membro.roles.add(cargoFila).catch(() => {});

    await interaction.reply({ content: 'Entrou na fila!', ephemeral: true });
  }

  if (interaction.customId === 'sair') {

    const index = fila.indexOf(interaction.user.id);
    if (index === -1) return interaction.reply({ content: 'Não está na fila!', ephemeral: true });

    fila.splice(index, 1);
    await membro.roles.remove(cargoFila).catch(() => {});

    await interaction.reply({ content: 'Saiu da fila!', ephemeral: true });
  }

  if (painel) {
    const lista = fila.length
      ? fila.map((id, i) => `<@${id}> - ${i + 1}`).join('\n')
      : "Ninguém na fila.";

    await painel.edit({
      embeds: [new EmbedBuilder()
        .setTitle("💰 Sala | R$5")
        .setDescription(`🎮 Fila:\n${lista}`)
        .setColor("Yellow")]
    });
  }

  if (fila.length === 10) {
    interaction.channel.send(`🔥 Sala fechada!

🎟️ Vá até <#${canalTicket10}> e envie o comprovante.

💸 PIX:
${pix}`);
  }

  // ===== MULTI X1 =====

  if (interaction.customId.startsWith('entrar_x1_')) {

    const valor = interaction.customId.split('_')[2];
    const filaAtual = filasX1[valor];

    if (filaAtual.includes(interaction.user.id)) {
      return interaction.reply({ content: 'Já entrou!', ephemeral: true });
    }

    filaAtual.push(interaction.user.id);

    await interaction.reply({ content: `Entrou no X1 R$${valor}`, ephemeral: true });

    const lista = filaAtual.map((id, i) => `<@${id}> - ${i + 1}`).join('\n');

    await paineisX1[valor].edit({
      embeds: [
        new EmbedBuilder()
          .setTitle(`🔥 X1 | R$${valor}`)
          .setDescription(`👥 Fila:\n${lista}`)
      ]
    });

    if (filaAtual.length === 2) {

      const p1 = await interaction.guild.members.fetch(filaAtual[0]);
      const p2 = await interaction.guild.members.fetch(filaAtual[1]);

      const valorFinal = (parseFloat(valor) * 1.5).toFixed(2).replace('.', ',');

      const canal = await interaction.guild.channels.create({
        name: `x1-${valor}-${p1.user.username}`,
        type: 0,
        parent: categoriaTicket,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: ['ViewChannel'] },
          { id: p1.id, allow: ['ViewChannel', 'SendMessages'] },
          { id: p2.id, allow: ['ViewChannel', 'SendMessages'] },
          { id: cargoAdmin, allow: ['ViewChannel', 'SendMessages'] }
        ]
      });

      tickets[canal.id] = {
        jogadores: [p1.id, p2.id],
        valor: valor
      };

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('fechar_ticket')
          .setLabel('Fechar Ticket')
          .setStyle(ButtonStyle.Danger)
      );

      canal.send({
        content: `🔥 X1 DE R$${valor} FORMADO!

${p1} vs ${p2}

💸 Valor: R$${valorFinal}

💰 PIX:
${pix}`,
        components: [row]
      });

      filasX1[valor] = [];
    }
  }

  // ===== FECHAR TICKET =====

  if (interaction.customId === 'fechar_ticket') {

    if (!interaction.member.roles.cache.has(cargoAdmin)) {
      return interaction.reply({ content: 'Apenas admins!', ephemeral: true });
    }

    const dados = tickets[interaction.channel.id];

    const jogadores = dados
      ? dados.jogadores.map(id => `<@${id}>`).join(', ')
      : 'Desconhecido';

    const valor = dados?.valor || 'N/A';

    const log = await client.channels.fetch(canalLogs);

    const embed = new EmbedBuilder()
      .setTitle("📁 Ticket Fechado")
      .addFields(
        { name: "👮 Admin", value: `${interaction.user}` },
        { name: "👥 Jogadores", value: jogadores },
        { name: "💸 Valor", value: `R$${valor}` },
        { name: "📅 Data", value: `<t:${Math.floor(Date.now()/1000)}:F>` }
      )
      .setColor("Red");

    await log.send({ embeds: [embed] });

    await interaction.reply('Fechando...');

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
      delete tickets[interaction.channel.id];
    }, 3000);
  }
});

// ================= LOGIN =================

client.login(process.env.TOKEN);