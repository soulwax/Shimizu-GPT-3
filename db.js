const mongoose = require('mongoose')
const guild = require('./models/guild.js')
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
        completionMode: myself.options.completionMode,
        chanceToRespond: myself.options.chanceToRespond,
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
          stop: myself.options.openai.stop
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

const setChanceForGuild = async (client, guildID, chance) => {
  const guild = await getGuild(client, guildID)
  if (guild) {
    guild.chanceToRespond = chance
    guild.save()
    console.log(`\tAdjusted chance for guild ${guildID} to ${chance}`)
  } else {
    console.log(`\tNo guild found for ${guildID}`)
  }
}

const setCompletionModeForGuild = async (client, guildID, mode) => {
  const guild = await getGuild(client, guildID)
  if (guild) {
    guild.completionMode = mode
    guild.save()
    console.log(`\tAdjusted completion mode for guild ${guildID} to ${mode}`)
  } else {
    console.log(`\tNo guild found for ${guildID}`)
  }
}

const setRawModeForGuild = async (client, guildID, mode) => {
  const guild = await getGuild(client, guildID)
  if (guild) {
    guild.rawMode = mode
    guild.save()
    console.log(`\tAdjusted raw mode for guild ${guildID} to ${mode}`)
  } else {
    console.log(`\tNo guild found for ${guildID}`)
  }
}


// Function that gets the guild from the database and returns it
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

const getRawModeForGuild = async (client, guildID) => {
  return getGuild(client, guildID).then((guild) => {
    return guild.rawMode
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
