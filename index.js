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

// ===== VARIÁVEIS =====

let fila = [];
let painel = null;

let filasX1 = {};
let paineisX1 = {};

let tickets = {};

// ===== READY =====

client.on('clientReady', () => {
  console.log('🤖 Bot online!');
});

// ===== COMANDOS =====

client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;

    const isAdmin = message.member?.roles.cache.has(cargoAdmin);
    if (!isAdmin) return;

    // ===== PAINEL 10 =====

    if (message.content === '!painel') {
      message.delete().catch(() => {});
      if (painel) return;

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

    // ===== X1 =====

    if (message.content.startsWith('!x1')) {
      message.delete().catch(() => {});

      const valor = message.content.split(' ')[1];
      if (!['1', '3', '5', '10'].includes(valor)) return;
      if (paineisX1[valor]) return;

      filasX1[valor] = [];

      const embed = new EmbedBuilder()
        .setTitle(`🔥1x1 | R$${valor}`)
        .setDescription("Ninguém na fila.")
        .setColor("#1989e2");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`entrar_x1_${valor}`).setLabel('Entrar').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`sair_x1_${valor}`).setLabel('Sair').setStyle(ButtonStyle.Danger)
      );

      paineisX1[valor] = await message.channel.send({
        embeds: [embed],
        components: [row]
      });
    }

  } catch (err) {
    console.log("ERRO COMANDO:", err);
  }
});

// ===== INTERAÇÕES =====

client.on('interactionCreate', async (interaction) => {
  try {

    if (!interaction.isButton()) return;
    if (!interaction.customId) return;

    const membro = interaction.member;

    // ===== SALA 10 =====

    if (interaction.customId === 'entrar') {

      if (fila.includes(interaction.user.id))
        return interaction.reply({ content: 'Já está na fila!', ephemeral: true });

      if (fila.length >= 10)
        return interaction.reply({ content: 'Fila cheia!', ephemeral: true });

      fila.push(interaction.user.id);
      await membro.roles.add(cargoFila).catch(() => {});

      await interaction.reply({ content: 'Entrou!', ephemeral: true });
    }

    if (interaction.customId === 'sair') {

      const index = fila.indexOf(interaction.user.id);
      if (index === -1)
        return interaction.reply({ content: 'Não está na fila!', ephemeral: true });

      fila.splice(index, 1);
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
      interaction.channel.send(`🔥 Sala fechada!

🎟️ Vá até <#${canalTicket10}>`);
    }

    // ===== ENTRAR X1 =====

    if (interaction.customId.startsWith('entrar_x1_')) {

      const valor = interaction.customId.split('_')[2];
      if (!filasX1[valor]) return;

      const filaAtual = filasX1[valor];

      if (filaAtual.includes(interaction.user.id))
        return interaction.reply({ content: 'Já entrou!', ephemeral: true });

      filaAtual.push(interaction.user.id);

      await interaction.reply({ content: `Entrou no X1`, ephemeral: true });

      const lista = filaAtual.length
        ? filaAtual.map(id => `<@${id}>`).join('\n')
        : "Ninguém na fila.";

      await paineisX1[valor].edit({
        embeds: [new EmbedBuilder()
          .setTitle(`🔥1x1 | R$${valor}`)
          .setDescription(lista)
          .setColor("#1989e2")]
      });

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
          valor: valor,
          confirmados: []
        };

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('confirmar_x1').setLabel('Confirmar').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('cancelar_x1').setLabel('Cancelar').setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setLabel('Regras')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/channels/${servidorID}/${canalRegrasX1}`)
        );

        await canal.send(`${p1} ${p2}`);

        const embed = new EmbedBuilder()
          .setTitle(`🔥1x1 | R$${valor}`)
          .setDescription("📜 Leia as regras antes de confirmar")
          .addFields({ name: "Confirmados:", value: "Nenhum jogador confirmou ainda." })
          .setColor("#1989e2");

        const msg = await canal.send({ embeds: [embed], components: [row] });

        tickets[canal.id].mensagem = msg.id;

        filasX1[valor] = [];

        await paineisX1[valor].edit({
          embeds: [new EmbedBuilder()
            .setTitle(`🔥1x1 | R$${valor}`)
            .setDescription("Ninguém na fila.")
            .setColor("#1989e2")]
        });
      }
    }

    // ===== SAIR X1 =====

    if (interaction.customId.startsWith('sair_x1_')) {

      const valor = interaction.customId.split('_')[2];
      if (!filasX1[valor]) return;

      const filaAtual = filasX1[valor];
      const index = filaAtual.indexOf(interaction.user.id);

      if (index === -1)
        return interaction.reply({ content: 'Você não está na fila!', ephemeral: true });

      if (filaAtual.length >= 2)
        return interaction.reply({ content: 'X1 já formado!', ephemeral: true });

      filaAtual.splice(index, 1);

      await interaction.reply({ content: 'Saiu da fila!', ephemeral: true });

      const lista = filaAtual.length
        ? filaAtual.map(id => `<@${id}>`).join('\n')
        : "Ninguém na fila.";

      await paineisX1[valor].edit({
        embeds: [new EmbedBuilder()
          .setTitle(`🔥1x1 | R$${valor}`)
          .setDescription(lista)
          .setColor("#1989e2")]
      });
    }

    // ===== CONFIRMAR =====

    if (interaction.customId === 'confirmar_x1') {

      const dados = tickets[interaction.channel.id];
      if (!dados) return;

      if (!dados.jogadores.includes(interaction.user.id))
        return interaction.reply({ content: 'Você não participa!', ephemeral: true });

      if (!dados.confirmados.includes(interaction.user.id)) {
        dados.confirmados.push(interaction.user.id);
      }

      const lista = dados.confirmados.length
        ? dados.confirmados.map(id => `<@${id}>`).join('\n')
        : "Nenhum jogador confirmou ainda.";

      const msg = await interaction.channel.messages.fetch(dados.mensagem);

      await msg.edit({
        embeds: [new EmbedBuilder()
          .setTitle(`🔥1x1 | R$${dados.valor}`)
          .addFields({ name: "Confirmados:", value: lista })
          .setColor("#1989e2")]
      });

      await interaction.reply({ content: 'Confirmado!', ephemeral: true });

      if (dados.confirmados.length === 2) {

        const valorFinal = tabelaValores[dados.valor];

        const mensagens = await interaction.channel.messages.fetch();
        await interaction.channel.bulkDelete(mensagens, true).catch(() => {});

        await interaction.channel.send(`<@${dados.jogadores[0]}> <@${dados.jogadores[1]}> <@&${cargoAdmin}>`);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('fechar_ticket').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger)
        );

        const embedFinal = new EmbedBuilder()
          .setTitle(`🔥 X1 DE R$${dados.valor} FORMADO!`)
          .setDescription(`<@${dados.jogadores[0]}> 🆚 <@${dados.jogadores[1]}> 🫠`)
          .addFields(
            { name: "💸 Valor da partida", value: `R$${valorFinal}` },
            { name: "📩 Pagamento", value: "Aguarde um admin enviar o PIX." }
          )
          .setColor("#1989e2");

        await interaction.channel.send({ embeds: [embedFinal], components: [row] });
      }
    }

    // ===== CANCELAR =====

    if (interaction.customId === 'cancelar_x1') {

      const dados = tickets[interaction.channel.id];
      if (!dados) return;

      if (!dados.jogadores.includes(interaction.user.id))
        return interaction.reply({ content: 'Você não participa!', ephemeral: true });

      await interaction.reply('X1 cancelado.');

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
        delete tickets[interaction.channel.id];
      }, 2000);
    }

    // ===== FECHAR COM TRANSCRIÇÃO =====

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

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
        delete tickets[interaction.channel.id];
      }, 3000);
    }

  } catch (err) {
    console.log("ERRO INTERAÇÃO:", err);
  }
});

// ===== LOGIN =====

client.login(process.env.TOKEN);