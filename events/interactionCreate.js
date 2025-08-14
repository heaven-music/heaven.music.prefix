const config = require("../config.js");
const { InteractionType } = require("discord.js");

module.exports = async (client, interaction) => {
  try {
    if (!interaction?.guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }

    if (interaction.type === InteractionType.ApplicationCommand) {
      if (!config.ownerID.includes(interaction.user.id)) {
        return interaction.reply({
          content: "❌ These slash commands are owner-only.",
          ephemeral: true
        });
      }

      const command = client.slashCommands.get(interaction.commandName);
      if (!command) {
        return interaction.reply({
          content: "❌ Command not found.",
          ephemeral: true
        });
      }

      try {
        // Pass empty args so play.js works in both cases
        await command.run(client, interaction, []);
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
