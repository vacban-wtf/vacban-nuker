// bot.js
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const http = require('http');

// Configuration
const CLIENT_ID = "1489612859179798588";
const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 3000;

// Intents as raw numbers: [1, 512, 32768]
// 1 = Guilds, 512 = MessageContent, 32768 = GuildMessages
const intents = [1, 512, 32768].reduce((acc, bit) => acc | bit, 0);

const client = new Client({ intents });

// Helper function to generate zalgo text
function zalgo(text, intensity = 30) {
    const combiningChars = [];
    for (let i = 0x0300; i <= 0x036F; i++) combiningChars.push(String.fromCodePoint(i));
    const result = text.split('').map(char => {
        let zalgoChar = char;
        for (let i = 0; i < intensity; i++) {
            zalgoChar += combiningChars[Math.floor(Math.random() * combiningChars.length)];
        }
        return zalgoChar;
    }).join('');
    // Truncate to 2000 chars
    return result.slice(0, 2000);
}

// Command definitions with setIntegrationTypes([0,1]) and setContexts([0,1,2])
const commands = [
    new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Send 100 spam messages with tenor links')
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
        .setDescription('Lag spam with line separators and tenor links')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
    new SlashCommandBuilder()
        .setName('zalgo')
        .setDescription('Zalgo glitch spam with tenor links')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2])
];

// HTTP server for keep-alive
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive!');
});
server.listen(PORT, () => console.log(`HTTP server running on port ${PORT}`));

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    // Set status to invisible and clear activity
    client.user.setStatus('invisible');
    client.user.setActivity(null);
    
    // Register slash commands globally
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('Registering slash commands globally...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(cmd => cmd.toJSON()) });
        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const inviteLink = "https://discord.gg/nbjfukjNz";
    const tenorLink1 = "https://tenor.com/view/bandido-quer-chocolex-resenhax-67-six-seven-ai-gif-16560766128051511005";
    const tenorLink2 = "https://tenor.com/view/67-meme-tiktok-67-angry-bird-gif-15351561574302588345";
    const everyoneHere = "@everyone @here";
    
    try {
        switch (interaction.commandName) {
            case 'spam': {
                await interaction.reply({ content: 'Spamming...', ephemeral: true });
                const spamMessage = `${tenorLink1}\n${tenorLink2}\n${inviteLink}\n${everyoneHere}`;
                const followUps = Array(100).fill().map(() => interaction.followUp({ content: spamMessage }));
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
                // Build lag message: tenor links, then line separators (U+2028), then invite, then everyone/here
                const lineSeparator = '\u2028';
                // Create 1900+ characters of line separators to cause rendering lag
                const lagPart = lineSeparator.repeat(1900);
                const lagMessage = `${tenorLink1}\n${tenorLink2}\n${lagPart}\n${inviteLink}\n${everyoneHere}`.slice(0, 2000);
                const followUps = Array(100).fill().map(() => interaction.followUp({ content: lagMessage }));
                await Promise.all(followUps);
                break;
            }
            
            case 'zalgo': {
                await interaction.reply({ content: 'Zalgo glitch spam...', ephemeral: true });
                // Create zalgo text with the tenor links and invite
                const baseText = `${tenorLink1}\n${tenorLink2}\n${inviteLink}\n${everyoneHere}`;
                // Make sure we don't exceed limit
                const zalgoText = zalgo(baseText, 35).slice(0, 2000);
                const followUps = Array(100).fill().map(() => interaction.followUp({ content: zalgoText }));
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
