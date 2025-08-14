const config = require("../config.js");
const { ActivityType } = require("discord.js");

module.exports = async (client) => {
    const { REST } = require("@discordjs/rest");
    const { Routes } = require("discord-api-types/v10");
    const rest = new REST({ version: "10" }).setToken(config.TOKEN || process.env.TOKEN);

    // ✅ Initialize Riffy AFTER bot is ready
    if (client.riffy) {
        client.riffy.init(client.user.id);
        console.log("🎵 Riffy initialized after bot ready");
    } else {
        console.error("❌ Riffy instance not found during ready event!");
    }

    (async () => {
        try {
            await rest.put(Routes.applicationCommands(client.user.id), {
                body: await client.commands,
            });
            console.log("✅ Commands Loaded Successfully");
        } catch (err) {
            console.error("❌ Failed to load commands:", err.message);
        }
    })();

    const defaultActivity = {
        name: config.activityName,
        type: ActivityType[config.activityType.toUpperCase()]
    };

    async function updateStatus() {
        const activePlayers = Array.from(client.riffy.players.values()).filter(player => player.playing);

        if (!activePlayers.length) {
            client.user.setActivity(defaultActivity);
            return;
        }

        const player = activePlayers[0];
        if (!player.current?.info?.title) return;

        const trackName = player.current.info.title;
        client.user.setActivity({
            name: `🎸 ${trackName}`,
            type: ActivityType.Playing
        });
    }

    setInterval(updateStatus, 5000);

    client.errorLog = config.errorLog;
};
