const { Client, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const http = require('http');

const client = new Client({ intents: [1, 512, 32768] });

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1489612859179798588";
const INVITE = "https://discord.gg/UBv2EJa2uB";

const commands = [
    new SlashCommandBuilder().setName('spam').setDescription('meow hub spam').setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('say').setDescription('Make bot say something anonymously').addStringOption(o=>o.setName('message').setDescription('What to say').setRequired(true)).setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('blame').setDescription('Frame someone anonymously').addUserOption(o=>o.setName('user').setDescription('Who to blame').setRequired(true)).setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('flood').setDescription('Invite spam').setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('custom-spam').setDescription('Spam anything').addStringOption(o=>o.setName('text').setDescription('What to spam').setRequired(true)).setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('fast-flood').setDescription('Fast invite flood').setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('l-spam').setDescription('Lag spam').setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('purge').setDescription('Delete recent messages from bot').addIntegerOption(o=>o.setName('count').setDescription('How many (1-100)').setRequired(true)).setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('stop').setDescription('Stop active spam').setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON()
];

const MEOW_SPAM = 'meow hub owns u '.repeat(Math.floor(1950 / 18));
const SPAM_MSG = `${MEOW_SPAM}\n${INVITE}\n@everyone @here`;

let activeSpam = false;

http.createServer((req, res) => { res.writeHead(200); res.end('Alive'); }).listen(process.env.PORT || 3000);

client.once('ready', async () => {
    console.log(`[+] ${client.user.tag} online`);
    client.user.setStatus('invisible');
    client.user.setActivity(null);
    const rest = new REST({version:'10'}).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), {body:commands});
    console.log('[+] Commands registered');
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = interaction.commandName;

    // /stop - emergency kill switch
    if (cmd === 'stop') {
        activeSpam = false;
        await interaction.reply({content:'Stopped all active spam', ephemeral:true});
        return;
    }

    // /say - anonymous, uses channel.send() not followUp
    if (cmd === 'say') {
        const msg = interaction.options.getString('message');
        await interaction.reply({content:'Sent!', ephemeral:true});
        // Regular message, no link to interaction
        await interaction.channel.send(msg).catch(()=>{});
        return;
    }

    // /blame - anonymous frame
    if (cmd === 'blame') {
        const user = interaction.options.getUser('user');
        const embed = new EmbedBuilder()
            .setTitle('RAID EXECUTED')
            .setDescription(`${user} thank you for executing this raid with ${INVITE}`)
            .setColor(0xff0000)
            .setThumbnail(user.displayAvatarURL())
            .setFooter({text:'meow hub on top'});
        await interaction.reply({content:'Sent!', ephemeral:true});
        await interaction.channel.send({content:`${user}`, embeds:[embed]}).catch(()=>{});
        return;
    }

    // /purge - clean up bot messages
    if (cmd === 'purge') {
        const count = Math.min(interaction.options.getInteger('count'), 100);
        await interaction.reply({content:`Purging ${count} messages...`, ephemeral:true});
        try {
            const msgs = await interaction.channel.messages.fetch({limit:100});
            const botMsgs = msgs.filter(m => m.author.id === client.user.id).first(count);
            for (const [id, msg] of botMsgs) {
                await msg.delete().catch(()=>{});
            }
        } catch(e) {}
        return;
    }

    // /spam
    if (cmd === 'spam') {
        await interaction.reply({content:'Spamming...', ephemeral:true});
        activeSpam = true;
        for (let i=0;i<100 && activeSpam;i++) {
            await interaction.channel.send(SPAM_MSG).catch(()=>{});
        }
        activeSpam = false;
        return;
    }

    // /flood
    if (cmd === 'flood') {
        await interaction.reply({content:'Flooding...', ephemeral:true});
        for (let i=0;i<100;i++) {
            await interaction.channel.send(INVITE).catch(()=>{});
        }
        return;
    }

    // /fast-flood
    if (cmd === 'fast-flood') {
        await interaction.reply({content:'Fast flooding...', ephemeral:true});
        const p = [];
        for (let i=0;i<100;i++) {
            p.push(interaction.channel.send(INVITE).catch(()=>{}));
        }
        await Promise.all(p);
        return;
    }

    // /custom-spam
    if (cmd === 'custom-spam') {
        const text = interaction.options.getString('text');
        await interaction.reply({content:'Spamming...', ephemeral:true});
        for (let i=0;i<100;i++) {
            await interaction.channel.send(text).catch(()=>{});
        }
        return;
    }

    // /l-spam
    if (cmd === 'l-spam') {
        await interaction.reply({content:'Lag spam...', ephemeral:true});
        const LINE_SEP = '\u2028';
        const header = `${INVITE} `;
        const footer = ' @everyone @here';
        const pad = LINE_SEP.repeat(1990 - header.length - footer.length);
        const msg = header + pad + footer;
        for (let i=0;i<100;i++) {
            await interaction.channel.send(msg).catch(()=>{});
        }
        return;
    }
});

client.login(TOKEN);
