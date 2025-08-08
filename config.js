module.exports = {
  TOKEN: "",
  prefix: ".", // ⬅️ NEW: Prefix for normal commands
  language: "en",
  ownerID: ["894898932549832714"], // Your ID (remove empty string)
  
  mongodbUri: "mongodb+srv://heaven:heaven@discordbot.hxbqucv.mongodb.net/?retryWrites=true&w=majority",
  spotifyClientId: "",
  spotifyClientSecret: "",
  setupFilePath: './commands/setup.json',
  commandsDir: './commands',  
  embedColor: "#1db954",
  activityName: "YouTube Music", 
  activityType: "LISTENING", // Available activity types: LISTENING , PLAYING
  SupportServer: "https://discord.gg/h4heaven",
  embedTimeout: 5, 
  errorLog: "", 

  nodes: [
    {
      name: "GlaceYT",
      password: "glaceyt",
      host: "5.39.63.207",
      port: 8262,
      secure: false
    }
  ]
};
