const mongoose = require('mongoose')
const Guild = require('./models/guild.js')(mongoose)
const Conversation = require('./models/conversation.js')(mongoose)

const syncGuildsWithDB = async (client, myself) => {
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
      whitelistedChannels: myself.whiteList,
      blacklistedChannels: myself.blackList
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

// Function that gets the guild from the database and returns it
// TODO: PROTOTYPE: USE AT YOUR OWN RISK!
const getGuild = async (client, guildID) => {
  Guild.findOne({ guildID: guildID }, (err, guild) => {
    if (err) {
      console.error(err)
    } else if (!guild) {
      console.log(`\t${guildID} not found in the database.`)
    } else {
      console.log(`\t${guild.guildName} found in the database.`)
      return guild
    }
  })
}

// Function that finds the conversation and guild from the database and returns the last 10 objects in the conversation
// TODO: PROTOTYPE: USE AT YOUR OWN RISK!
const getConversation = async (client, guildID, channelID) => {
  Guild.findOne({ guildID: guildID }, (err, guild) => {
    if (err) {
      console.error(err)
    } else if (!guild) {
      console.log(`\t${guildID} not found in the database.`)
    } else {
      console.log(`\t${guild.guildName} found in the database.`)
      Conversation.find({ guildID: guildID, channelID: channelID }, (err, convo) => {
        if (err) {
          console.error(err)
        } else if (!convo) {
          console.log(`\t${channelID} not found in the database.`)
        } else {
          console.log(`\t${channelID} found in the database.`)
          return convo
        }
      })
        .sort({ _id: -1 })
        .limit(10)
    }
  })
}

// Set the chance to reply for a specified guild
// TODO: PROTOTYPE: USE AT YOUR OWN RISK!
const setChanceForGuild = async (client, guildID, chance) => {
  getGuild(client, guildID).then((guild) => {
    guild.chanceToRespond = chance
    guild.save()
  })
}

// Set the completion mode for a specified guild
// TODO: PROTOTYPE: USE AT YOUR OWN RISK!
const setCompletionModeForGuild = async (client, guildID, mode) => {
  getGuild(client, guildID).then((guild) => {
    guild.completionMode = mode
    guild.save()
  })
}

// Get the chance to reply for a specified guild
const getChanceForGuild = async (client, guildID) => {
  return getGuild(client, guildID).then((guild) => {
    return guild.chanceToRespond
  })
}

// Get the completion mode for a specified guild
const getCompletionModeForGuild = async (client, guildID) => {
  return getGuild(client, guildID).then((guild) => {
    return guild.completionMode
  })
}


module.exports = { syncGuildsWithDB, getGuild, getConversation, setChanceForGuild, setCompletionModeForGuild, getChanceForGuild, getCompletionModeForGuild }
