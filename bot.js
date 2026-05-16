const { Client, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const http = require('http');

const client = new Client({ intents: [1, 512, 32768] });

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1489612859179798588";
const INVITE = "https://discord.gg/UBv2EJa2uB";

const commands = [
    new SlashCommandBuilder().setName('spam').setDescription('meow hub spam').setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('say').setDescription('Make bot say something').addStringOption(o=>o.setName('message').setDescription('What to say').setRequired(true)).setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('blame').setDescription('Frame someone').addUserOption(o=>o.setName('user').setDescription('Who to blame').setRequired(true)).setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('flood').setDescription('Invite spam').setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('custom-spam').setDescription('Spam anything').addStringOption(o=>o.setName('text').setDescription('What to spam').setRequired(true)).setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('fast-flood').setDescription('Fast invite flood').setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('l-spam').setDescription('Lag spam').setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON(),
    new SlashCommandBuilder().setName('purge').setDescription('Delete recent bot messages').addIntegerOption(o=>o.setName('count').setDescription('How many (1-100)').setRequired(true)).setIntegrationTypes([0,1]).setContexts([0,1,2]).toJSON()
];

const MEOW_SPAM = 'meow hub owns u '.repeat(Math.floor(1950 / 18));
const SPAM_MSG = `${MEOW_SPAM}\n${INVITE}\n@everyone @here`;

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

    if (cmd === 'say') {
        const msg = interaction.options.getString('message');
        await interaction.reply({content:'Sent!', ephemeral:true});
        await interaction.followUp({content:msg});
        return;
    }

    if (cmd === 'blame') {
        const user = interaction.options.getUser('user');
        const embed = new EmbedBuilder()
            .setTitle('RAID EXECUTED')
            .setDescription(`${user} thank you for executing this raid with ${INVITE}`)
            .setColor(0xff0000)
            .setThumbnail(user.displayAvatarURL())
            .setFooter({text:'meow hub on top'});
        await interaction.reply({content:'Sent!', ephemeral:true});
        await interaction.followUp({content:`${user}`, embeds:[embed]});
        return;
    }

    if (cmd === 'spam') {
        await interaction.reply({content:'Spamming...', ephemeral:true});
        const p = [];
        for (let i=0;i<100;i++) {
            p.push(interaction.followUp({content:SPAM_MSG}).catch(()=>{}));
        }
        await Promise.all(p);
        return;
    }

    if (cmd === 'flood') {
        await interaction.reply({content:'Flooding...', ephemeral:true});
        const p = [];
        for (let i=0;i<100;i++) {
            p.push(interaction.followUp({content:INVITE}).catch(()=>{}));
        }
        await Promise.all(p);
        return;
    }

    if (cmd === 'fast-flood') {
        await interaction.reply({content:'Fast flooding...', ephemeral:true});
        const p = [];
        for (let i=0;i<100;i++) {
            p.push(interaction.followUp({content:INVITE}).catch(()=>{}));
        }
        await Promise.all(p);
        return;
    }

    if (cmd === 'custom-spam') {
        const text = interaction.options.getString('text');
        await interaction.reply({content:'Spamming...', ephemeral:true});
        const p = [];
        for (let i=0;i<100;i++) {
            p.push(interaction.followUp({content:text}).catch(()=>{}));
        }
        await Promise.all(p);
        return;
    }

    if (cmd === 'l-spam') {
        await interaction.reply({content:'Lag spam...', ephemeral:true});
        const LINE_SEP = '\u2028';
        const header = `${INVITE} `;
        const footer = ' @everyone @here';
        const pad = LINE_SEP.repeat(1990 - header.length - footer.length);
        const msg = header + pad + footer;
        const p = [];
        for (let i=0;i<100;i++) {
            p.push(interaction.followUp({content:msg}).catch(()=>{}));
        }
        await Promise.all(p);
        return;
    }

    if (cmd === 'purge') {
        const count = Math.min(interaction.options.getInteger('count'), 100);
        await interaction.reply({content:`Purging ${count}...`, ephemeral:true});
        // followUp messages can't be deleted by the bot easily — skip this for now
        return;
    }
});

client.login(TOKEN);
