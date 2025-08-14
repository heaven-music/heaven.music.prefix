const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { playlistCollection } = require('../mongodb.js');
const musicIcons = require('../UI/icons/musicicons.js');
const config = require('../config.js');

async function addSong(client, ctx, lang, args) {
    try {
        let playlistName, songInput, userId;

        // === Slash Command ===
        if (ctx.isChatInputCommand?.()) {
            playlistName = ctx.options.getString('playlist');
            songInput = ctx.options.getString('input');
            userId = ctx.user.id;
        } 
        // === Prefix Command ===
        else if (ctx.author) {
            // args[0] = playlist, args[1..] = song name or URL
            playlistName = args[0];
            songInput = args.slice(1).join(' ');
            userId = ctx.author.id;

            if (!playlistName || !songInput) {
                return ctx.reply(`❌ Usage: \`${config.prefix}addsong <playlist> <song name or URL>\``);
            }
        } 
        else {
            return;
        }

        // === Check if playlist exists ===
        const playlist = await playlistCollection.findOne({ name: playlistName });
        if (!playlist) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({
                    name: lang.addsong.embed.playlistNotFound,
                    iconURL: musicIcons.alertIcon,
                    url: config.SupportServer
                })
                .setDescription(lang.addsong.embed.playlistNotFoundDescription)
                .setFooter({ text: lang.footer, iconURL: musicIcons.heartIcon })
                .setTimestamp();

            return ctx.reply({ embeds: [embed], ephemeral: ctx.isChatInputCommand?.() });
        }

        // === Check ownership ===
        if (playlist.userId !== userId) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({
                    name: lang.addsong.embed.accessDenied,
                    iconURL: musicIcons.alertIcon,
                    url: config.SupportServer
                })
                .setDescription(lang.addsong.embed.accessDeniedDescription)
                .setFooter({ text: lang.footer, iconURL: musicIcons.heartIcon })
                .setTimestamp();

            return ctx.reply({ embeds: [embed], ephemeral: ctx.isChatInputCommand?.() });
        }

        // === Song detection ===
        const urlPattern = /^https?:\/\/[^\s$.?#].[^\s]*$/gm;
        let song;

        if (urlPattern.test(songInput)) {
            song = { url: songInput };
        } else {
            song = { name: songInput };
        }

        await playlistCollection.updateOne(
            { name: playlistName },
            { $push: { songs: song } }
        );

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setAuthor({
                name: lang.addsong.embed.songAdded,
                iconURL: musicIcons.correctIcon,
                url: config.SupportServer
            })
            .setDescription(
                lang.addsong.embed.songAddedDescription
                    .replace("{songInput}", songInput)
                    .replace("{playlistName}", playlistName)
            )
            .setFooter({ text: lang.footer, iconURL: musicIcons.heartIcon })
            .setTimestamp();

        return ctx.reply({ embeds: [embed] });

    } catch (error) {
        console.error('Error adding song:', error);

        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({
                name: lang.addsong.embed.error,
                iconURL: musicIcons.alertIcon,
                url: config.SupportServer
            })
            .setDescription(lang.addsong.embed.errorDescription)
            .setFooter({ text: lang.footer, iconURL: musicIcons.heartIcon })
            .setTimestamp();

        return ctx.reply({ embeds: [errorEmbed], ephemeral: ctx.isChatInputCommand?.() });
    }
}

module.exports = {
    name: 'addsong',
    description: 'Add a song to a playlist',
    permissions: '0x0000000000000800',
    options: [
        {
            name: 'playlist',
            description: 'Enter playlist name',
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'input',
            description: 'Enter song name or URL',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    run: addSong, // Prefix handler
    execute: addSong // Slash handler
};
