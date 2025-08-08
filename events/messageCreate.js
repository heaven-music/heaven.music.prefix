const config = require("../config.js");

module.exports = async (client, message) => {
  // Ignore bots
  if (message.author.bot) return;

  const prefix = "."; // Change this to your prefix

  // If the message doesn't start with the prefix, ignore it
  if (!message.content.startsWith(prefix)) return;

  // Extract command and args
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Find the command in the commands folder
  const command = client.prefixCommands.get(commandName);
  if (!command) return;

  try {
    command.run(client, message, args);
  } catch (err) {
    console.error(err);
    message.reply("There was an error running that command.");
  }
};
