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

// ===== JSON =====
function salvar() {
  fs.writeFileSync('dados.json', JSON.stringify({ fila, filasX1, tickets }, null, 2));
}

function carregar() {
  if (!fs.existsSync('dados.json')) return;
  const d = JSON.parse(fs.readFileSync('dados.json'));
  fila = d.fila || [];
  filasX1 = d.filasX1 || {};
  tickets = d.tickets || {};
}
carregar();

// ===== READY =====
client.on('clientReady', () => console.log('ON'));

// ===== COMANDOS =====
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  if (!msg.member.roles.cache.has(cargoAdmin)) return;

  if (msg.content === '!painel') {
    await msg.delete().catch(()=>{});

    const embed = new EmbedBuilder()
      .setTitle("💰 Sala")
      .setDescription("Ninguém na fila.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('entrar').setLabel('Entrar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('sair').setLabel('Sair').setStyle(ButtonStyle.Danger)
    );

    painel = await msg.channel.send({ embeds:[embed], components:[row] });
  }

  if (msg.content === '!finalizar') {
    await msg.delete().catch(()=>{});

    fila = [];
    salvar();

    if (painel) {
      await painel.delete().catch(()=>{});
      painel = null;
    }

    msg.channel.send("🏁 Finalizado.");
  }

  if (msg.content.startsWith('!x1')) {
    await msg.delete().catch(()=>{});

    const valor = msg.content.split(' ')[1];
    if (!['1','3','5','10'].includes(valor)) return;

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

  try { await i.deferReply({ ephemeral:true }); } catch {}

  try {

    // ===== X1 ENTRAR =====
    if (i.customId.startsWith('entrar_x1_')) {

      const valor = i.customId.split('_')[2];
      const filaAtual = filasX1[valor] || [];

      if (filaAtual.includes(i.user.id))
        return i.editReply('Já entrou.');

      filaAtual.push(i.user.id);
      filasX1[valor] = filaAtual;
      salvar();

      await i.editReply('Entrou no X1.');

      // atualizar painel
      try {
        const lista = filaAtual.length
          ? filaAtual.map(id=>`<@${id}>`).join('\n')
          : "Ninguém na fila.";

        if (paineisX1[valor]) {
          await paineisX1[valor].edit({
            embeds:[new EmbedBuilder()
              .setTitle(`🔥1x1 | R$${valor}`)
              .setDescription(lista)
              .setColor("#1989e2")]
          });
        }
      } catch {}

      // formar x1
      if (filaAtual.length === 2) {

        const p1 = await i.guild.members.fetch(filaAtual[0]);
        const p2 = await i.guild.members.fetch(filaAtual[1]);

        const canal = await i.guild.channels.create({
          name: `x1-${valor}`,
          type: ChannelType.GuildText,
          parent: categoriaTicket,
          permissionOverwrites: [
            { id: i.guild.id, deny: ['ViewChannel'] },
            { id: p1.id, allow: ['ViewChannel', 'SendMessages'] },
            { id: p2.id, allow: ['ViewChannel', 'SendMessages'] },
            { id: cargoAdmin, allow: ['ViewChannel'] }
          ]
        });

        tickets[canal.id] = {
          jogadores: [p1.id, p2.id],
          valor,
          confirmados: []
        };

        salvar();

        await canal.send(`<@${p1.id}> <@${p2.id}>`);

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

        // reset painel
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

    // ===== CONFIRMAR =====
    if (i.customId === 'confirmar_x1') {

      const dados = tickets[i.channel.id];
      if (!dados) return i.editReply('Erro.');

      if (!dados.jogadores.includes(i.user.id))
        return i.editReply('Você não participa.');

      if (!dados.confirmados.includes(i.user.id)) {
        dados.confirmados.push(i.user.id);
        salvar();
      }

      const confirmados = dados.confirmados.length
        ? dados.confirmados.map(id=>`<@${id}>`).join('\n')
        : "Nenhum jogador confirmou ainda.";

      const embed = new EmbedBuilder()
        .setTitle(`🔥1x1 | R$${dados.valor}`)
        .setDescription("📜 Leia as regras antes de confirmar")
        .addFields({ name:"Confirmados:", value:confirmados })
        .setColor("#1989e2");

      await i.message.edit({ embeds:[embed] });
      await i.editReply('Confirmado.');

      // ambos confirmaram
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
          new ButtonBuilder()
            .setCustomId('fechar_ticket')
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

    // ===== CANCELAR =====
    if (i.customId === 'cancelar_x1') {

      delete tickets[i.channel.id];
      salvar();

      await i.editReply('X1 cancelado.');

      setTimeout(()=> i.channel.delete().catch(()=>{}), 2000);
    }

    // ===== FECHAR =====
    if (i.customId === 'fechar_ticket') {

      if (!i.member.roles.cache.has(cargoAdmin))
        return i.editReply('Apenas admin.');

      const dados = tickets[i.channel.id];
      if (!dados) return;

      const msgs = await i.channel.messages.fetch({ limit:100 });

      const texto = msgs.reverse().map(m =>
        `${m.author.tag}: ${m.content}`
      ).join('\n');

      const buffer = Buffer.from(texto,'utf-8');

      const log = await client.channels.fetch(canalLogs);

      await log.send({
        content:`Ticket fechado | R$${dados.valor}`,
        files:[{ attachment:buffer, name:'log.txt' }]
      });

      delete tickets[i.channel.id];
      salvar();

      await i.editReply('Fechando...');

      setTimeout(()=> i.channel.delete().catch(()=>{}), 3000);
    }

  } catch (err) {
    console.log(err);
    try { i.editReply('Erro interno.'); } catch {}
  }
});

// ===== ANTI CRASH =====
process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

client.login(process.env.TOKEN);