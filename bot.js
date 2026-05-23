// bot.js
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const http = require('http');

// Configuration
const CLIENT_ID = "1507782491992227880";
const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 3000;

// Intents as raw numbers: [1, 32768]
const intents = [1, 32768].reduce((acc, bit) => acc | bit, 0);

const client = new Client({ intents });

// Command definitions
const commands = [
    new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Fastest spam - 1950 Arabic chars + invite link')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
    new SlashCommandBuilder()
        .setName('say')
        .setDescription('Send a custom message')
        .addStringOption(option => option.setName('message').setDescription('The message to send').setRequired(true))
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
    new SlashCommandBuilder()
        .setName('blame')
        .setDescription('Blame a user for the raid')
        .addUserOption(option => option.setName('user').setDescription('The user to blame').setRequired(true))
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
    new SlashCommandBuilder()
        .setName('l-spam')
        .setDescription('Lag spam - 1950 Arabic chars + line breaks + invite link')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2])
];

// Arabic character (﷽) repeated
const arabicChar = '﷽';
const arabic1950 = arabicChar.repeat(1950);
const inviteLink = "https://discord.gg/nbjfukjNz";
const everyoneHere = "@everyone @here";

// HTTP server for keep-alive
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive!');
});
server.listen(PORT, () => console.log(`HTTP server running on port ${PORT}`));

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`User ID: ${client.user.id}`);
    
    // Set status to invisible and clear activity
    client.user.setStatus('invisible');
    client.user.setActivity(null);
    
    // Register slash commands globally
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('Registering slash commands globally...');
        console.log(`Using CLIENT_ID: ${CLIENT_ID}`);
        
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(cmd => cmd.toJSON()) });
        
        console.log(`✅ Successfully registered ${commands.length} commands globally!`);
        console.log('Commands will appear in Discord within a few minutes.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    console.log(`Command received: /${interaction.commandName} from ${interaction.user.tag}`);
    
    try {
        switch (interaction.commandName) {
            case 'spam': {
                await interaction.reply({ content: 'Spamming...', ephemeral: true });
                // Fastest spam: 1950 Arabic chars + invite link + everyone/here
                const spamMessage = `${arabic1950}\n${inviteLink}\n${everyoneHere}`.slice(0, 2000);
                const followUps = [];
                for (let i = 0; i < 100; i++) {
                    followUps.push(interaction.followUp({ content: spamMessage }));
                }
                await Promise.all(followUps);
                break;
            }
            
            case 'say': {
                const message = interaction.options.getString('message');
                await interaction.reply({ content: 'Sent!', ephemeral: true });
                await interaction.followUp({ content: message });
                break;
            }
            
            case 'blame': {
                const user = interaction.options.getUser('user');
                await interaction.reply({ content: 'Sent!', ephemeral: true });
                const embed = new EmbedBuilder()
                    .setTitle('RAID EXECUTED')
                    .setDescription(`${user} thank you for executing this raid with ${inviteLink}`)
                    .setColor(0xFF0000)
                    .setThumbnail(user.displayAvatarURL())
                    .setFooter({ text: 'raid on top' });
                await interaction.followUp({ content: `${user}`, embeds: [embed] });
                break;
            }
            
            case 'l-spam': {
                await interaction.reply({ content: 'Lag spam...', ephemeral: true });
                // Lag spam: 1950 Arabic chars + line separators (U+2028) + invite link + everyone/here
                const lineSeparator = '\u2028';
                const lagChars = lineSeparator.repeat(1900);
                const lagMessage = `${arabic1950}\n${lagChars}\n${inviteLink}\n${everyoneHere}`.slice(0, 2000);
                const followUps = [];
                for (let i = 0; i < 100; i++) {
                    followUps.push(interaction.followUp({ content: lagMessage }));
                }
                await Promise.all(followUps);
                break;
            }
        }
    } catch (error) {
        console.error(`Error in ${interaction.commandName}:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'An error occurred!', ephemeral: true });
        }
    }
});

client.login(TOKEN);
