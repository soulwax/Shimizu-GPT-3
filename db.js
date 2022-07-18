const mongoose = require('mongoose')
const Guild = require('./models/guildModel.js')(mongoose)
const Conversation = require('./models/convoModel.js')(mongoose)

const syncGuildsWithDB = (client, myself) => {
  const guilds = client.guilds.cache.map((guild) => guild.name)
  const guildIDs = client.guilds.cache.map((guild) => guild.id)
  console.log(`\tGuilds: ${guilds.join(', ')}`)
  // Iterate through each guild and add it to the database if it doesn't exist in the collection yet
  for (let i = 0; i < guildIDs.length; i++) {
    const guildID = guildIDs[i]
    const guildName = guilds[i]
    const guildDBObject = new Guild({
      guildID: guildID,
      guildName: guildName,
      premise: myself.premise,
      tokens: myself.tokens,
      completionMode: myself.options.completionMode,
      chanceToRespond: myself.options.chanceToRespond,
      whitelistedChannels: myself.options.whitelistedChannels,
      blacklistedChannels: myself.options.blacklistedChannels
    })
    Guild.findOne({ guildID: guildID }, (err, guild) => {
      if (err) {
        console.error(err)
      } else if (!guild) {
        guildDBObject.save()
        console.log(`\tAdded ${guildName} to the database.`)
      } else {
        console.log(`\t${guildName} already exists in the database.`)
      }
    })
  }

  // If there is a guild in the database that is not in the client, remove it from the database
  Guild.find({}, (err, guilds) => {
    if (err) {
      console.error(err)
    } else {
      for (let i = 0; i < guilds.length; i++) {
        const guild = guilds[i]
        if (!guildIDs.includes(guild.guildID)) {
          Guild.deleteOne({ guildID: guild.guildID }, (err) => {
            if (err) {
              console.error(err)
            } else {
              console.log(`\tRemoved ${guild.guildName} from the database.`)
            }
          })
        }
      }
    }
  })
}

module.exports = { syncGuildsWithDB }
