const mongoose = require('mongoose')
const Guild = require('./models/guild.js')(mongoose)
const Conversation = require('./models/conversation.js')(mongoose)

const syncGuildsWithDB = async (client, myself) => {
  const guilds = await client.guilds.cache.map((guild) => guild.name)
  const guildIDs = await client.guilds.cache.map((guild) => guild.id)
  console.log(`\tGuilds: ${guilds.join(', ')}`)
  // Iterate through each guild and add it to the database if it doesn't exist in the collection yet
  for (let i = 0; i < guildIDs.length; i++) {
    const iteratedGuildId = guildIDs[i]
    const iteratedGuildName = guilds[i]
    // if the guild already exists in the database, continue
    if (await Guild.findOne({ guildId: iteratedGuildId })) {
      console.log(`\t\tGuild ${iteratedGuildName} already exists in the database`)
      continue
    } else {
      // if the guild doesn't exist in the database, add it
      const guildDBObject = new Guild({
        guildId: iteratedGuildId,
        name: iteratedGuildName,
        joinedAt: client.guilds.cache.get(iteratedGuildId).joinedAt.toISOString(),
        tokens: myself.options.openai.tokens,
        premise: myself.premise,
        whitelistedChannels: myself.whiteList,
        blacklistedChannels: myself.blackList,
        myself: {
          myId: myself.id,
          name: myself.name,
          model: myself.options.openai.model,
          apiKey: myself.key,
          temperature: myself.options.openai.temperature,
          top_p: myself.options.openai.top_p,
          frequency_penalty: myself.options.openai.frequency_penalty,
          presence_penalty: myself.options.openai.presence_penalty,
          stop: myself.options.openai.stop,
          completionMode: myself.options.completionMode,
          chanceToRespond: myself.options.chanceToRespond,
          rawMode: myself.options.rawMode
        }
      })
      guildDBObject.save()
    }
  }
}

// Find the conversation for a specified guild and channel and add a message to it
const addMessageToConversation = async (message, content) => {
  const currentGuildId = message.guild.id
  const currentGuildName = message.guild.name
  const currentChannelId = message.channel.id
  const currentUserId = message.author.id
  const currentUserName = message.author.username
  const currentTimestamp = message.createdAt.toISOString()

  const conversation = await Conversation.findOne({ channelId: currentChannelId })
  if (conversation) {
    conversation.conversation.push({
      userId: currentUserId,
      userName: currentUserName,
      messages: [
        {
          message: content,
          timestamp: currentTimestamp
        }
      ]
    })
    conversation.save()
    console.log(`\tAdded message to conversation for ${currentGuildName} in ${currentChannelId}`)
  } else {
    console.log(`\tNo conversation found for ${currentGuildName} in ${currentChannelId}. Creating a new one.`)
    const conversationDBObject = new Conversation({
      type: 'channel',
      guildId: currentGuildId,
      channelId: currentChannelId,
      conversation: [
        {
          userId: currentUserId,
          userName: currentUserName,
          messages: [
            {
              message: content,
              timestamp: currentTimestamp
            }
          ]
        }
      ]
    })
    conversationDBObject.save()
  }
}

const setChanceForGuild = async (guildID, chance) => {
  const guild = await getGuild(guildID)
  if (guild) {
    guild.chanceToRespond = chance
    guild.save()
    console.log(`\tAdjusted chance for guild ${guildID} to ${chance}`)
  } else {
    console.log(`\tNo guild found for ${guildID}`)
  }
}

const setCompletionModeForGuild = async (guildID, mode) => {
  const guild = await getGuild(guildID)
  if (guild) {
    guild.completionMode = mode
    guild.save()
    console.log(`\tAdjusted completion mode for guild ${guildID} to ${mode}`)
  } else {
    console.log(`\tNo guild found for ${guildID}`)
  }
}

const setRawModeForGuild = async (guildID, mode) => {
  const guild = await getGuild(guildID)
  if (guild) {
    guild.rawMode = mode
    guild.save()
    console.log(`\tAdjusted raw mode for guild ${guildID} to ${mode}`)
  } else {
    console.log(`\tNo guild found for ${guildID}`)
  }
}


// Function that gets the guild from the database and returns it
const getGuild = async (guildID) => {
  Guild.findOne({ guildId: guildID }, (err, guild) => {
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
const getConversation = async (guildID, channelID) => {
  Guild.findOne({ guildId: guildID }, (err, guild) => {
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

// Get the chance to reply for a specified guild
const getChanceForGuild = async (guildID) => {
  return getGuild(guildID).then((guild) => {
    if(!guild) {
      console.log(`\tNo guild found for ${guildID}`)
      return false
    } else if(!guild.chanceToRespond) {
      console.log(`\tNo chance found for ${guildID}`)
      return false
    } else {
      console.log(`\tChance found for ${guildID}`)
      return guild.chanceToRespond || 0
    }
  })
}

// Get the completion mode for a specified guild
const getCompletionModeForGuild = async (guildID) => {
  return getGuild(guildID).then((guild) => {
  if(!guild || !guild.completionMode) { 
    console.log(`\tNo completion mode found for ${guildID}`)
    return false
  } else {
    return guild.completionMode || false
  }
  })
}

const getRawModeForGuild = async (guildID) => {
  return getGuild(guildID).then((guild) => {
    if(!guild || !guild.rawMode) {
      console.log(`\tNo raw mode found for ${guildID}`)
      return false
    } else {
      return guild.rawMode || false
    }
  })
}


module.exports = {
  syncGuildsWithDB,
  getGuild,
  getConversation,
  setChanceForGuild,
  setCompletionModeForGuild,
  setRawModeForGuild,
  getRawModeForGuild,
  getChanceForGuild,
  getCompletionModeForGuild,
  addMessageToConversation
}
