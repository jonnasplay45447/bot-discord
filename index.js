const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType
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

// ===== SALVAR =====
function salvar() {
  fs.writeFile('dados.json',
    JSON.stringify({ fila, filasX1, tickets }, null, 2),
    () => {}
  );
}

// ===== READY =====
client.on('clientReady', () => console.log('⚡ RÁPIDO ON'));

// ===== COMANDOS =====
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  if (!msg.member.roles.cache.has(cargoAdmin)) return;

  if (msg.content === '!painel') {
    msg.delete().catch(()=>{});

    const embed = new EmbedBuilder()
      .setTitle("💰 Sala | R$5")
      .setDescription("Ninguém na fila.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('entrar').setLabel('Entrar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('sair').setLabel('Sair').setStyle(ButtonStyle.Danger)
    );

    painel = await msg.channel.send({ embeds:[embed], components:[row] });
  }

  if (msg.content === '!finalizar') {
    msg.delete().catch(()=>{});

    fila = [];
    salvar();

    if (painel) {
      painel.delete().catch(()=>{});
      painel = null;
    }

    msg.channel.send("🏁 Finalizado.");
  }

  if (msg.content.startsWith('!x1')) {
    msg.delete().catch(()=>{});

    const valor = msg.content.split(' ')[1];
    filasX1[valor] = [];
    salvar();

    const embed = new EmbedBuilder()
      .setTitle(`🔥1x1 | R$${valor}`)
      .setDescription("Ninguém na fila.")
      .setColor("#1989e2");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`entrar_x1_${valor}`).setLabel('Entrar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`sair_x1_${valor}`).setLabel('Sair').setStyle(ButtonStyle.Danger)
    );

    paineisX1[valor] = await msg.channel.send({ embeds:[embed], components:[row] });
  }
});

// ===== INTERAÇÕES =====
client.on('interactionCreate', async (i) => {
  if (!i.isButton()) return;

  try {
    await i.reply({ content: '✔️', ephemeral: true });

    // ===== SALA =====
    if (i.customId === 'entrar') {
      if (!fila.includes(i.user.id)) fila.push(i.user.id);
      salvar();

      setTimeout(async () => {
        try {
          await i.member.roles.add(cargoFila).catch(()=>{});
          if (painel) {
            const lista = fila.length ? fila.map(id=>`<@${id}>`).join('\n') : "Ninguém na fila.";
            await painel.edit({
              embeds:[new EmbedBuilder().setTitle("💰 Sala | R$5").setDescription(lista)]
            });
          }
        } catch {}
      }, 0);
    }

    if (i.customId === 'sair') {
      fila = fila.filter(id => id !== i.user.id);
      salvar();

      setTimeout(async () => {
        try {
          await i.member.roles.remove(cargoFila).catch(()=>{});
          if (painel) {
            const lista = fila.length ? fila.map(id=>`<@${id}>`).join('\n') : "Ninguém na fila.";
            await painel.edit({
              embeds:[new EmbedBuilder().setTitle("💰 Sala | R$5").setDescription(lista)]
            });
          }
        } catch {}
      }, 0);
    }

    // ===== X1 ENTRAR =====
    if (i.customId.startsWith('entrar_x1_')) {

      const valor = i.customId.split('_')[2];
      let filaAtual = filasX1[valor] || [];

      if (!filaAtual.includes(i.user.id)) {
        filaAtual.push(i.user.id);
        filasX1[valor] = filaAtual;
        salvar();
      }

      setTimeout(async () => {
        try {
          const lista = filaAtual.length ? filaAtual.map(id=>`<@${id}>`).join('\n') : "Ninguém na fila.";
          if (paineisX1[valor]) {
            await paineisX1[valor].edit({
              embeds:[new EmbedBuilder()
                .setTitle(`🔥1x1 | R$${valor}`)
                .setDescription(lista)
                .setColor("#1989e2")]
            });
          }
        } catch {}
      }, 0);

      if (filaAtual.length === 2) {

        const [id1, id2] = filaAtual;

        const canal = await i.guild.channels.create({
          name: `x1-${valor}`,
          type: ChannelType.GuildText,
          parent: categoriaTicket,
          permissionOverwrites: [
            { id: i.guild.id, deny: ['ViewChannel'] },
            { id: id1, allow: ['ViewChannel','SendMessages'] },
            { id: id2, allow: ['ViewChannel','SendMessages'] },
            { id: cargoAdmin, allow: ['ViewChannel'] }
          ]
        });

        tickets[canal.id] = { jogadores:[id1,id2], valor, confirmados:[] };
        salvar();

        await canal.send(`<@${id1}> <@${id2}>`);

        const embed = new EmbedBuilder()
          .setTitle(`🔥1x1 | R$${valor}`)
          .setDescription("📜 Leia as regras antes de confirmar")
          .addFields({ name:"Confirmados:", value:"Nenhum jogador confirmou ainda." })
          .setColor("#1989e2");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('confirmar_x1').setLabel('Confirmar').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('cancelar_x1').setLabel('Cancelar').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setLabel('Regras').setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/channels/${servidorID}/${canalRegrasX1}`)
        );

        await canal.send({ embeds:[embed], components:[row] });

        filasX1[valor] = [];
        salvar();

        if (paineisX1[valor]) {
          await paineisX1[valor].edit({
            embeds:[new EmbedBuilder()
              .setTitle(`🔥1x1 | R$${valor}`)
              .setDescription("Ninguém na fila.")
              .setColor("#1989e2")]
          });
        }
      }
    }

    // ===== X1 SAIR (CORRIGIDO) =====
    if (i.customId.startsWith('sair_x1_')) {

      const valor = i.customId.split('_')[2];
      let filaAtual = filasX1[valor] || [];

      if (!filaAtual.includes(i.user.id)) {
        return i.followUp({ content: 'Você não está na fila.', ephemeral: true });
      }

      filaAtual = filaAtual.filter(id => id !== i.user.id);
      filasX1[valor] = filaAtual;
      salvar();

      setTimeout(async () => {
        try {
          const lista = filaAtual.length ? filaAtual.map(id=>`<@${id}>`).join('\n') : "Ninguém na fila.";
          if (paineisX1[valor]) {
            await paineisX1[valor].edit({
              embeds:[new EmbedBuilder()
                .setTitle(`🔥1x1 | R$${valor}`)
                .setDescription(lista)
                .setColor("#1989e2")]
            });
          }
        } catch {}
      }, 0);
    }

    // ===== CANCELAR (CORRIGIDO) =====
    if (i.customId === 'cancelar_x1') {

      const dados = tickets[i.channel.id];

      if (!dados) {
        return i.followUp({ content: 'Esse X1 não existe mais.', ephemeral: true });
      }

      if (!dados.jogadores.includes(i.user.id)) {
        return i.followUp({ content: 'Você não participa desse X1.', ephemeral: true });
      }

      delete tickets[i.channel.id];
      salvar();

      try {
        await i.channel.send('🚫 O X1 foi cancelado.');
      } catch {}

      setTimeout(() => {
        i.channel.delete().catch(()=>{});
      }, 2000);
    }

    // ===== CONFIRMAR =====
    if (i.customId === 'confirmar_x1') {

      const dados = tickets[i.channel.id];
      if (!dados) return;

      if (!dados.confirmados.includes(i.user.id)) {
        dados.confirmados.push(i.user.id);
        salvar();
      }

      const confirmados = dados.confirmados.length
        ? dados.confirmados.map(id=>`<@${id}>`).join('\n')
        : "Nenhum jogador confirmou ainda.";

      await i.message.edit({
        embeds:[new EmbedBuilder()
          .setTitle(`🔥1x1 | R$${dados.valor}`)
          .setDescription("📜 Leia as regras antes de confirmar")
          .addFields({ name:"Confirmados:", value:confirmados })
          .setColor("#1989e2")]
      });

      if (dados.confirmados.length === 2) {

        const embedFinal = new EmbedBuilder()
          .setTitle(`🔥 X1 DE R$${dados.valor} FORMADO!`)
          .setDescription(
            `<@${dados.jogadores[0]}> 🆚 <@${dados.jogadores[1]}>\n\n` +
            `💸 Valor\nR$${tabelaValores[dados.valor]}\n\n` +
            `📩 Aguarde o admin enviar o PIX.`
          )
          .setColor("#1989e2");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('fechar_ticket')
            .setLabel('Fechar Ticket')
            .setStyle(ButtonStyle.Danger)
        );

        await i.channel.send({
          content:`<@&${cargoAdmin}>`,
          embeds:[embedFinal],
          components:[row]
        });
      }
    }

    // ===== FECHAR =====
    if (i.customId === 'fechar_ticket') {

      const dados = tickets[i.channel.id];
      if (!dados) return;

      const msgs = await i.channel.messages.fetch({ limit:100 });

      const texto = msgs.reverse().map(m =>
        `[${m.author.tag}] ${m.content}`
      ).join('\n');

      const buffer = Buffer.from(texto);

      const embed = new EmbedBuilder()
        .setTitle("📁 Ticket Fechado")
        .addFields(
          { name:"Jogadores", value: dados.jogadores.map(id=>`<@${id}>`).join(', ') },
          { name:"Valor", value:`R$${dados.valor}` }
        );

      const log = await client.channels.fetch(canalLogs);

      await log.send({
        embeds:[embed],
        files:[{ attachment:buffer, name:'transcricao.txt' }]
      });

      delete tickets[i.channel.id];
      salvar();

      setTimeout(()=> i.channel.delete().catch(()=>{}), 3000);
    }

  } catch (err) {
    console.log("ERRO:", err);
  }
});

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

client.login(process.env.TOKEN);