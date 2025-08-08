const config = require("../config.js");
const { InteractionType } = require("discord.js");

module.exports = async (client, interaction) => {
  try {
    // Only in servers
    if (!interaction?.guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }

    // ✅ Owner-only check for slash commands
    if (interaction.type === InteractionType.ApplicationCommand) {
      if (!config.ownerID.includes(interaction.user.id)) {
        return interaction.reply({
          content: "❌ These slash commands are owner-only.",
          ephemeral: true
        });
      }

      // Find the slash command from the collection
      const command = client.slashCommands.get(interaction.commandName);
      if (!command) {
        return interaction.reply({
          content: "❌ Command not found.",
          ephemeral: true
        });
      }

      try {
        await command.run(client, interaction);
      } catch (err) {
        console.error(err);
        return interaction.reply({
          content: `❌ Error: ${err.message}`,
          ephemeral: true
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
};
