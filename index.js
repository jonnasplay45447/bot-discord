const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== CONFIG =====
const cargoAdmin = "943302582816890973";
const cargoFila = "943302704275550208";
const cargoPago = "1489100736225870015";

const canalTicket10 = "1489094389698527334";
const categoriaTicket = "1492239705843171559";
const canalLogs = "943302717865070632";

const servidorID = "943292592504840273";
const canalRegrasX1 = "1492587300922589340";

// ===== VALORES =====
const tabelaValores = {
  1: "1,50",
  3: "4,00",
  5: "6,00",
  10: "12,00"
};

// ===== MEMÓRIA =====
let fila = [];
let filasX1 = {};
let tickets = {};
let paineisX1 = {};
let painel = null;

// ===== JSON =====
function salvarDados() {
  fs.writeFileSync('dados.json', JSON.stringify({
    fila,
    filasX1,
    tickets
  }, null, 2));
}

function carregarDados() {
  if (!fs.existsSync('dados.json')) return;

  const dados = JSON.parse(fs.readFileSync('dados.json'));

  fila = dados.fila || [];
  filasX1 = dados.filasX1 || {};
  tickets = dados.tickets || {};
}

carregarDados();

// ===== READY =====
client.on('clientReady', () => {
  console.log('🤖 Bot online!');
});

// ===== COMANDOS =====
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const isAdmin = message.member?.roles.cache.has(cargoAdmin);
  if (!isAdmin) return;

  // ===== PAINEL =====
  if (message.content === '!painel') {
    message.delete().catch(() => {});

    const embed = new EmbedBuilder()
      .setTitle("💰 Sala | R$5")
      .setDescription("Ninguém na fila.")
      .setColor("Yellow");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('entrar').setLabel('Entrar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('sair').setLabel('Sair').setStyle(ButtonStyle.Danger)
    );

    painel = await message.channel.send({ embeds: [embed], components: [row] });
  }

  // ===== FINALIZAR =====
  if (message.content === '!finalizar') {
    message.delete().catch(() => {});

    if (fila.length === 0) {
      return message.channel.send('❌ Não há partida ativa.');
    }

    for (const id of fila) {
      try {
        const membro = await message.guild.members.fetch(id);
        await membro.roles.remove(cargoFila).catch(() => {});
        await membro.roles.remove(cargoPago).catch(() => {});
      } catch {}
    }

    fila = [];
    salvarDados();

    if (painel) {
      await painel.delete().catch(() => {});
      painel = null;
    }

    message.channel.send(`🏁 **Partida finalizada!**

⚡ Quem não conseguiu entrar fica ligado, pois novas partidas serão anunciadas em breve.
🎮 Continue acompanhando o JJ Diários para não perder as próximas!`);
  }

  // ===== X1 =====
  if (message.content.startsWith('!x1')) {
    message.delete().catch(() => {});

    const valor = message.content.split(' ')[1];
    if (!['1','3','5','10'].includes(valor)) return;

    filasX1[valor] = [];
    salvarDados();

    const embed = new EmbedBuilder()
      .setTitle(`🔥1x1 | R$${valor}`)
      .setDescription("Ninguém na fila.")
      .setColor("#1989e2");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`entrar_x1_${valor}`).setLabel('Entrar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`sair_x1_${valor}`).setLabel('Sair').setStyle(ButtonStyle.Danger)
    );

    paineisX1[valor] = await message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ===== INTERAÇÕES =====
client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isButton()) return;

    const membro = interaction.member;

    // ===== SALA 10 =====
    if (interaction.customId === 'entrar') {
      if (fila.includes(interaction.user.id))
        return interaction.reply({ content: 'Já está na fila!', ephemeral: true });

      if (fila.length >= 10)
        return interaction.reply({ content: 'Fila cheia!', ephemeral: true });

      fila.push(interaction.user.id);
      salvarDados();

      await membro.roles.add(cargoFila).catch(() => {});
      await interaction.reply({ content: 'Entrou!', ephemeral: true });
    }

    if (interaction.customId === 'sair') {
      const index = fila.indexOf(interaction.user.id);
      if (index === -1)
        return interaction.reply({ content: 'Não está na fila!', ephemeral: true });

      fila.splice(index, 1);
      salvarDados();

      await membro.roles.remove(cargoFila).catch(() => {});
      await interaction.reply({ content: 'Saiu!', ephemeral: true });
    }

    if (painel) {
      const lista = fila.length
        ? fila.map(id => `<@${id}>`).join('\n')
        : "Ninguém na fila.";

      await painel.edit({
        embeds: [new EmbedBuilder().setTitle("💰 Sala | R$5").setDescription(lista)]
      });
    }

    if (fila.length === 10) {
      interaction.channel.send(`🔥 Sala fechada!\n🎟️ Vá até <#${canalTicket10}>`);
    }

    // ===== X1 =====
    if (interaction.customId.startsWith('entrar_x1_')) {

      const valor = interaction.customId.split('_')[2];
      const filaAtual = filasX1[valor] || [];

      if (filaAtual.includes(interaction.user.id))
        return interaction.reply({ content: 'Já entrou!', ephemeral: true });

      filaAtual.push(interaction.user.id);
      filasX1[valor] = filaAtual;
      salvarDados();

      await interaction.reply({ content: 'Entrou no X1', ephemeral: true });

      if (filaAtual.length === 2) {

        const p1 = await interaction.guild.members.fetch(filaAtual[0]);
        const p2 = await interaction.guild.members.fetch(filaAtual[1]);

        const canal = await interaction.guild.channels.create({
          name: `x1-${valor}`,
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
          valor,
          confirmados: []
        };

        salvarDados();

        await canal.send(`${p1} ${p2}`);

        const embed = new EmbedBuilder()
          .setTitle(`🔥1x1 | R$${valor}`)
          .setDescription("📜 Leia as regras antes de confirmar")
          .addFields({ name: "Confirmados:", value: "Nenhum jogador confirmou ainda." })
          .setColor("#1989e2");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('confirmar_x1').setLabel('Confirmar').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('cancelar_x1').setLabel('Cancelar').setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setLabel('Regras')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/channels/${servidorID}/${canalRegrasX1}`)
        );

        const msg = await canal.send({ embeds: [embed], components: [row] });

        tickets[canal.id].mensagem = msg.id;
        salvarDados();

        filasX1[valor] = [];
        salvarDados();
      }
    }

    // ===== FECHAR TICKET =====
    if (interaction.customId === 'fechar_ticket') {

      if (!interaction.member.roles.cache.has(cargoAdmin))
        return interaction.reply({ content: 'Apenas admins!', ephemeral: true });

      const dados = tickets[interaction.channel.id];
      if (!dados) return;

      await interaction.reply('📁 Salvando e fechando...');

      const mensagens = await interaction.channel.messages.fetch({ limit: 200 });

      const texto = mensagens.reverse().map(m =>
        `[${new Date(m.createdTimestamp).toLocaleString('pt-BR')}] ${m.author.tag}: ${m.content || "[embed]"}`
      ).join('\n');

      const buffer = Buffer.from(texto, 'utf-8');

      const log = await client.channels.fetch(canalLogs);

      const embed = new EmbedBuilder()
        .setTitle("📁 Ticket Fechado")
        .addFields(
          { name: "👮 Admin", value: `${interaction.user}` },
          { name: "👥 Jogadores", value: dados.jogadores.map(id => `<@${id}>`).join(', ') },
          { name: "💸 X1", value: `R$${dados.valor}` },
          { name: "📅 Data", value: new Date().toLocaleString('pt-BR') }
        )
        .setColor("#1989e2");

      await log.send({
        embeds: [embed],
        files: [{ attachment: buffer, name: `transcricao-${interaction.channel.name}.txt` }]
      });

      delete tickets[interaction.channel.id];
      salvarDados();

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 3000);
    }

  } catch (err) {
    console.log("ERRO:", err);
  }
});

client.login(process.env.TOKEN);