const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const config = require("../config.js");

const requesters = new Map(); // { trackUri: "<@user>" }

async function getOrCreatePlayer(client, message) {
  const guildId = message.guild.id;
  let player = client.riffy.players.get(guildId);
  const voice = message.member.voice.channel;
  if (!voice) throw new Error("Join a voice channel first.");

  const perms = voice.permissionsFor(message.guild.members.me);
  if (!perms?.has(PermissionsBitField.Flags.Connect) || !perms?.has(PermissionsBitField.Flags.Speak)) {
    throw new Error("I need **Connect** and **Speak** permissions in your voice channel.");
  }

  if (!player) {
    player = await client.riffy.createPlayer({
      guildId,
      voiceId: voice.id,
      textId: message.channel.id,
      volume: 80,
      deaf: true
    });
  } else if (player.voiceChannel !== voice.id) {
    // Move to user's VC if different
    await player.setVoiceChannel(voice.id);
    await player.setTextChannel(message.channel.id);
  }
  return player;
}

module.exports = {
  name: "play",
  requesters,
  run: async (client, message, args) => {
    try {
      const query = args.join(" ");
      if (!query) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(config.embedColor).setDescription("Usage: `.play <url or search query>`")] });
      }

      const player = await getOrCreatePlayer(client, message);
      const res = await client.riffy.search(query, { requester: message.author });

      if (!res || !res.tracks?.length) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(config.embedColor).setDescription("❌ No results found.")] });
      }

      const lt = res.loadType?.toUpperCase?.() || "SEARCH_RESULT";
      if (lt === "PLAYLIST_LOADED") {
        res.tracks.forEach(tr => requesters.set(tr.info.uri, `<@${message.author.id}>`));
        await player.queue.add(res.tracks);
        await message.reply({
          embeds: [new EmbedBuilder().setColor(config.embedColor)
            .setDescription(`📚 Enqueued **${res.tracks.length}** tracks from playlist **${res.playlist?.name || "Unknown"}**`)]
        });
      } else {
        const track = res.tracks[0];
        requesters.set(track.info.uri, `<@${message.author.id}>`);
        await player.queue.add(track);
        await message.reply({
          embeds: [new EmbedBuilder().setColor(config.embedColor)
            .setDescription(`🎵 Enqueued: **${track.info.title}**`)]
        });
      }

      if (!player.playing && !player.paused) await player.play();
    } catch (e) {
      console.error(e);
      message.reply({ embeds: [new EmbedBuilder().setColor(config.embedColor).setDescription(`❌ ${e.message || "Failed to play."}`)] });
    }
  }
};
