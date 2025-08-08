const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const config = require("./config.js");

// ===== Client Setup =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.config = config;
client.prefixCommands = new Collection();
client.slashCommands = new Collection();

// ===== Load Prefix Commands (Public) =====
const prefixCommandsPath = path.join(__dirname, "prefixCommands");
if (fs.existsSync(prefixCommandsPath)) {
  const prefixCommandFiles = fs.readdirSync(prefixCommandsPath).filter(file => file.endsWith(".js"));
  for (const file of prefixCommandFiles) {
    const command = require(path.join(prefixCommandsPath, file));
    if (command.name && typeof command.run === "function") {
      client.prefixCommands.set(command.name.toLowerCase(), command);
      console.log(`✅ Loaded prefix command: ${command.name}`);
    } else {
      console.log(`⚠ Skipping ${file} - missing name or run()`);
    }
  }
} else {
  console.warn("⚠ No prefixCommands folder found.");
}

// ===== Load Slash Commands (Owner Only in interactionCreate.js) =====
const slashCommandsPath = path.join(__dirname, config.commandsDir);
if (fs.existsSync(slashCommandsPath)) {
  const slashCommandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith(".js"));
  for (const file of slashCommandFiles) {
    const command = require(path.join(slashCommandsPath, file));
    if (command.name && typeof command.run === "function") {
      client.slashCommands.set(command.name.toLowerCase(), command);
      console.log(`✅ Loaded slash command: ${command.name}`);
    } else {
      console.log(`⚠ Skipping ${file} - missing name or run()`);
    }
  }
} else {
  console.warn("⚠ No slash commands folder found.");
}

// ===== Load Events =====
const eventsPath = path.join(__dirname, "events");
fs.readdirSync(eventsPath).forEach(file => {
  const event = require(path.join(eventsPath, file));
  const eventName = file.split(".")[0];
  client.on(eventName, (...args) => event(client, ...args));
});

// ===== Start Bot =====
client.login(config.TOKEN).then(() => {
  console.log(`✅ Logged in as ${client.user?.tag || "BOT"}`);
}).catch(err => {
  console.error("❌ Failed to login:", err);
});
