import discord
from discord.ext import commands
import aiohttp
import string
import random
import asyncio
import io

# -- SETTINGS --
DISCORD_TOKEN = "YOUR_BOT_TOKEN_HERE"
PREFIX = "!"
DEFAULT_LENGTH = 5
MIN_LENGTH = 5
MAX_LENGTH = 20
# --------------

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix=PREFIX, intents=intents, help_command=None)

guild_lengths: dict[int, int] = {}

def get_length(guild_id: int) -> int:
    return guild_lengths.get(guild_id, DEFAULT_LENGTH)

def is_admin(ctx):
    return ctx.author.guild_permissions.administrator

async def check_roblox_username(username: str) -> bool:
    url = "https://auth.roblox.com/v1/usernames/validate"
    params = {"Username": username, "Birthday": "2000-01-01"}
    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params) as r:
            if r.status == 200:
                data = await r.json()
                return data.get("code") == 0
    return False

def random_name(length: int) -> str:
    return "".join(random.choices(string.ascii_lowercase, k=length))

def pattern_to_names(pattern: str, count: int = 100) -> list[str]:
    results = set()
    attempts = 0
    while len(results) < count and attempts < 10000:
        attempts += 1
        name = ""
        for ch in pattern:
            if ch in ("?", "*"):
                name += random.choice(string.ascii_lowercase)
            else:
                name += ch.lower()
        results.add(name)
    return list(results)

# -- COMMANDS --

@bot.command(name="help")
async def help_cmd(ctx):
    if not is_admin(ctx):
        return
    length = get_length(ctx.guild.id)
    embed = discord.Embed(title="uhhh.py - Commands", color=0x00FF88)
    embed.add_field(name="!snipe", value=f"Find a random available {length}-letter Roblox username. DMed to you.", inline=False)
    embed.add_field(name="!bulksnipe <amount>", value="Find multiple available names. Sent as a .txt file to your DMs.", inline=False)
    embed.add_field(name="!patternsnipe <pattern>", value="Check names matching a pattern. Use ? as a wildcard.\nExample: !patternsnipe a??le", inline=False)
    embed.add_field(name="!setlength <number>", value=f"Set username length ({MIN_LENGTH}-{MAX_LENGTH}). Currently: {length}", inline=False)
    embed.set_footer(text="Admin only - Results are DMed to you")
    await ctx.send(embed=embed)

@bot.command(name="snipe")
async def snipe(ctx):
    if not is_admin(ctx):
        return
    length = get_length(ctx.guild.id)
    msg = await ctx.send(f"Hunting for an available {length}-letter username...")
    found = None
    attempts = 0

    while attempts < 300:
        candidate = random_name(length)
        if await check_roblox_username(candidate):
            found = candidate
            break
        attempts += 1
        if attempts % 20 == 0:
            try:
                await msg.edit(content=f"Checked {attempts} names... still hunting")
            except Exception:
                pass

    await msg.delete()
    if found:
        await ctx.author.send(
            f"Found one after {attempts+1} attempts!\n\n"
            f"Username: {found}\n"
            f"https://www.roblox.com/login\n\n"
            f"Grab it fast!"
        )
    else:
        await ctx.author.send(f"Couldn't find one after 300 attempts. Try again!")

@bot.command(name="bulksnipe")
async def bulksnipe(ctx, amount: int = 3):
    if not is_admin(ctx):
        return
    if amount < 1 or amount > 20:
        await ctx.send("Amount must be between 1 and 20.")
        return
    length = get_length(ctx.guild.id)
    msg = await ctx.send(f"Finding {amount} available {length}-letter usernames...")
    found = []
    attempts = 0

    while len(found) < amount and attempts < 500:
        candidate = random_name(length)
        if await check_roblox_username(candidate):
            found.append(candidate)
            try:
                await msg.edit(content=f"Found {len(found)}/{amount} so far... (checked {attempts} names)")
            except Exception:
                pass
        attempts += 1
        await asyncio.sleep(0.5)

    await msg.delete()

    if found:
        lines = ["made by uhhhhh.py", ""]
        lines.append(f"Bulk Snipe Results - {len(found)}/{amount} found ({length}-letter)")
        lines.append(f"Checked {attempts} names total")
        lines.append("-" * 30)
        for name in found:
            lines.append(name)
        lines.append("")
        lines.append("Claim at: https://www.roblox.com/login")

        file_content = "\n".join(lines)
        file = discord.File(
            fp=io.BytesIO(file_content.encode()),
            filename="bulksnipe_results.txt"
        )
        await ctx.author.send(f"Found {len(found)}/{amount} available {length}-letter usernames:", file=file)
    else:
        await ctx.author.send(f"Couldn't find any after {attempts} attempts. Try again!")

@bot.command(name="patternsnipe")
async def patternsnipe(ctx, pattern: str = None):
    if not is_admin(ctx):
        return
    if not pattern:
        await ctx.send("Usage: !patternsnipe <pattern> - use ? as wildcard. Example: !patternsnipe a??le")
        return

    length = get_length(ctx.guild.id)
    clean = pattern.lower()
    if len(clean) != length:
        await ctx.send(f"Pattern must be {length} characters long to match current length. Use !setlength to change it.")
        return
    if not all(c in string.ascii_lowercase + "?*" for c in clean):
        await ctx.send("Pattern can only contain letters and ? wildcards.")
        return

    msg = await ctx.send(f"Checking pattern '{clean}' for available names...")
    candidates = pattern_to_names(clean, count=100)
    found = []

    for i, candidate in enumerate(candidates):
        if await check_roblox_username(candidate):
            found.append(candidate)
        if i % 15 == 0 and i > 0:
            try:
                await msg.edit(content=f"Checked {i}/{len(candidates)}... found {len(found)} so far")
            except Exception:
                pass
        await asyncio.sleep(0.5)
        if len(found) >= 10:
            break

    await msg.delete()
    if found:
        await ctx.author.send(
            f"Pattern '{clean}' - found {len(found)} available:\n\n"
            + "\n".join(found)
            + "\n\nhttps://www.roblox.com/login"
        )
    else:
        await ctx.author.send(f"No available names found for pattern '{clean}'. Try again!")

@bot.command(name="setlength")
async def setlength(ctx, length: int = None):
    if not is_admin(ctx):
        return
    if length is None:
        await ctx.send(f"Current length: {get_length(ctx.guild.id)} | Usage: !setlength <{MIN_LENGTH}-{MAX_LENGTH}>")
        return
    if length < MIN_LENGTH or length > MAX_LENGTH:
        await ctx.send(f"Length must be between {MIN_LENGTH} and {MAX_LENGTH}.")
        return
    guild_lengths[ctx.guild.id] = length
    await ctx.send(f"Username length set to {length}.")

bot.run(DISCORD_TOKEN)
