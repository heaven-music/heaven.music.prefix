const config = require("../config.js");

module.exports = async (client, message) => {
  // Ignore bots or DMs
  if (message.author.bot || !message.guild) return;

  // Use prefix from config.js
  const prefix = config.prefix;

  // If the message doesn't start with the prefix, ignore it
  if (!message.content.startsWith(prefix)) return;

  // Extract command and args
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Find the command in the prefixCommands collection
  const command = client.prefixCommands.get(commandName);
  if (!command) return;

  try {
    command.run(client, message, args);
  } catch (err) {
    console.error(err);
    message.reply("There was an error running that command.");
  }
};
