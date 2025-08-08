const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const config = require("./config.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.prefixCommands = new Collection();
client.slashCommands = new Collection();

// ===== Load Prefix Commands =====
const prefixCommandsPath = path.join(__dirname, "prefixCommands");
if (fs.existsSync(prefixCommandsPath)) {
  const prefixCommandFiles = fs.readdirSync(prefixCommandsPath).filter(file => file.endsWith(".js"));
  for (const file of prefixCommandFiles) {
    const command = require(path.join(prefixCommandsPath, file));
    if (command.name && typeof command.run === "function") {
      client.prefixCommands.set(command.name.toLowerCase(), command);
      console.log(`Loaded prefix command: ${command.name}`);
    } else {
      console.log(`Skipping ${file} - missing name or run()`);
    }
  }
} else {
  console.warn("⚠️ No prefixCommands folder found.");
}

// ===== Load Events =====
const eventsPath = path.join(__dirname, "events");
fs.readdirSync(eventsPath).forEach(file => {
  const event = require(path.join(eventsPath, file));
  const eventName = file.split(".")[0];
  if (eventName === "messageCreate") {
    client.on("messageCreate", (message) => event(client, message));
  } else {
    client.on(eventName, (...args) => event(client, ...args));
  }
});

client.login(config.TOKEN);
