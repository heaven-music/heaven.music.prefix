const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const musicIcons = require('../UI/icons/musicicons.js');
const SpotifyWebApi = require('spotify-web-api-node');
const { getData } = require('spotify-url-info')(require('node-fetch'));
const requesters = new Map();

const spotifyApi = new SpotifyWebApi({
    clientId: config.spotifyClientId,
    clientSecret: config.spotifyClientSecret,
});

async function getSpotifyPlaylistTracks(playlistId) {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body.access_token);

        let tracks = [];
        let offset = 0;
        let limit = 100;
        let total = 0;

        do {
            const response = await spotifyApi.getPlaylistTracks(playlistId, { limit, offset });
            total = response.body.total;
            offset += limit;

            for (const item of response.body.items) {
                if (item.track && item.track.name && item.track.artists) {
                    const trackName = `${item.track.name} - ${item.track.artists.map(a => a.name).join(', ')}`;
                    tracks.push(trackName);
                }
            }
        } while (tracks.length < total);

        return tracks;
    } catch (error) {
        console.error("Error fetching Spotify playlist tracks:", error);
        return [];
    }
}

async function play(client, ctx, args) {
    try {
        let query, user, guildId, voiceChannelId, textChannelId;

        // Slash command
        if (ctx.isChatInputCommand?.()) {
            query = ctx.options.getString('name');
            user = ctx.user;
            guildId = ctx.guildId;
            voiceChannelId = ctx.member.voice.channelId;
            textChannelId = ctx.channelId;
        }
        // Prefix command
        else {
            query = args?.join(' ') || '';
            user = ctx.author;
            guildId = ctx.guild.id;
            voiceChannelId = ctx.member?.voice?.channelId;
            textChannelId = ctx.channel.id;

            if (!query) {
                return ctx.reply(`❌ Usage: \`${config.prefix}play <song name / link / playlist>\``);
            }
        }

        // No voice channel
        if (!voiceChannelId) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({
                    name: 'Error',
                    iconURL: musicIcons.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: 'Music Bot', iconURL: musicIcons.heartIcon })
                .setDescription('You must be in a voice channel to use this command.');

            return ctx.reply({ embeds: [embed], ephemeral: ctx.isChatInputCommand?.() });
        }

        // No lavalink nodes
        if (!client.riffy.nodes || client.riffy.nodes.size === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({
                    name: 'Error',
                    iconURL: musicIcons.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: 'Music Bot', iconURL: musicIcons.heartIcon })
                .setDescription('No Lavalink nodes are connected.');

            return ctx.reply({ embeds: [embed], ephemeral: ctx.isChatInputCommand?.() });
        }

        const player = client.riffy.createConnection({
            guildId,
            voiceChannel: voiceChannelId,
            textChannel: textChannelId,
            deaf: true
        });

        if (ctx.isChatInputCommand?.()) {
            await ctx.deferReply();
        }

        let tracksToQueue = [];
        let isPlaylist = false;

        // Spotify handling
        if (query.includes('spotify.com')) {
            try {
                const spotifyData = await getData(query);

                if (spotifyData.type === 'track') {
                    const trackName = `${spotifyData.name} - ${spotifyData.artists.map(a => a.name).join(', ')}`;
                    tracksToQueue.push(trackName);
                } else if (spotifyData.type === 'playlist') {
                    isPlaylist = true;
                    const playlistId = query.split('/playlist/')[1].split('?')[0];
                    tracksToQueue = await getSpotifyPlaylistTracks(playlistId);
                }
            } catch (err) {
                console.error('Error fetching Spotify data:', err);
                return sendFollowUp(ctx, "❌ Failed to fetch Spotify data.");
            }
        } else {
            // Non-Spotify (YouTube, etc.)
            const resolve = await client.riffy.resolve({ query, requester: user.username });

            if (!resolve || typeof resolve !== 'object' || !Array.isArray(resolve.tracks)) {
                throw new TypeError('Invalid response from Riffy');
            }

            if (resolve.loadType === 'playlist') {
                isPlaylist = true;
                for (const track of resolve.tracks) {
                    track.info.requester = user.username;
                    player.queue.add(track);
                    requesters.set(track.info.uri, user.username);
                }
            } else if (resolve.loadType === 'search' || resolve.loadType === 'track') {
                const track = resolve.tracks.shift();
                track.info.requester = user.username;
                player.queue.add(track);
                requesters.set(track.info.uri, user.username);
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setAuthor({
                        name: 'Error',
                        iconURL: musicIcons.alertIcon,
                        url: config.SupportServer
                    })
                    .setFooter({ text: 'Music Bot', iconURL: musicIcons.heartIcon })
                    .setDescription('No results found.');

                return sendFollowUp(ctx, { embeds: [errorEmbed] });
            }
        }

        // Queue Spotify playlist tracks
        let queuedTracks = 0;
        for (const trackQuery of tracksToQueue) {
            const resolve = await client.riffy.resolve({ query: trackQuery, requester: user.username });
            if (resolve.tracks.length > 0) {
                const trackInfo = resolve.tracks[0];
                player.queue.add(trackInfo);
                requesters.set(trackInfo.uri, user.username);
                queuedTracks++;
            }
        }

        if (!player.playing && !player.paused) player.play();

        const successEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setAuthor({
                name: 'Request Added',
                iconURL: musicIcons.beats2Icon,
                url: config.SupportServer
            })
            .setDescription('Your track(s) have been added to the queue.')
            .setFooter({ text: 'Music Bot', iconURL: musicIcons.heartIcon });

        const message = await sendFollowUp(ctx, { embeds: [successEmbed] });

        if (ctx.isChatInputCommand?.()) {
            setTimeout(() => {
                message.delete().catch(() => { });
            }, 3000);
        }

    } catch (error) {
        console.error('Error processing play command:', error);
        return sendFollowUp(ctx, "❌ An error occurred while processing the request.");
    }
}

function sendFollowUp(ctx, content) {
    if (ctx.isChatInputCommand?.()) {
        return ctx.followUp(content);
    } else {
        return ctx.reply(content);
    }
}

module.exports = {
    name: "play",
    description: "Play a song from a name or link",
    permissions: "0x0000000000000800",
    options: [{
        name: 'name',
        description: 'Enter song name / link or playlist',
        type: ApplicationCommandOptionType.String,
        required: true
    }],
    run: play,     // prefix handler
    execute: play, // slash handler
    requesters: requesters,
};
