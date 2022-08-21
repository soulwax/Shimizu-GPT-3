const mongoose = require('mongoose')
const { myselfDefault } = require('./ai.js')
const Guild = require('./models/guild.js')(mongoose)
const Conversation = require('./models/conversation.js')(mongoose)

/**
 * Function that syncs guilds between client and database
 * @param {Object} client - The discord client object
 * @param {Object} myself - The myself object (manually set)
 * @returns {Boolean} frue if the sync was successful, false if it failed
 */
const syncGuildsWithDB = async (client, myself) => {
  const guilds = await client.guilds.cache.map((guild) => guild.name)
  const guildIDs = await client.guilds.cache.map((guild) => guild.id)
  console.log(`\tGuilds: ${guilds.join(', ')}`) //TODO: add verbose option
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
        myself: myself
      })
      await guildDBObject
        .save()
        .then(() => {
          console.log(`\t\tGuilds were successfully saved to the database if they didn't exist yet`)
          return true
        })
        .catch((err) => {
          console.log(err)
          return false
        })
    }
  }
}

// Cache Guilds to prevent database queries
// id => guild
const guilds = {}
/**
 * Get the guild from the database and cache it.
 * @param {string} guildID The ID of the guild to get.
 * @returns {object} The guild object from the database.
 * @returns {null} If the guild is not found in the database.
 */
const getGuildCached = async (id) => {
  //TODO: cache with refresh if guild was changed
  if (guilds[id]) return guilds[id]
  const guild = await Guild.findOne({ guildId: id })
  if (guild) {
    guilds[id] = guild
    return guild
  }
  return null
}

/**
 * Update the guild cache with the given guild object.
 * @param {object} guild The guild object to update the cache with.
 * @returns {void} nothing
 */
const updateGuildCache = async (guild) => {
  guilds[guild.id] = guild
}

/**
 * Get the myself object for a specified guild.
 * @param {string} guildID The ID of the guild to get the myself object for.
 * @returns {object} The myself object for the guild.
 * @returns {object} If the guild is not found in the database, use the default myself object.
 */
const getMyselfForGuild = async (guildID) => {
  const guild = await getGuildCached(guildID)
  if (!guild) return myselfDefault
  return guild.myself || myselfDefault
}

/**
 * Get the guild from the database.
 * @param {string} guildID The ID of the guild to get.
 * @returns {object} The guild object from the database.
 */
const getGuild = async (guildID) => {
  return await getGuildCached(guildID)
}

// Update guild values in the database given an array of guild objects
/**
 * Update the guild values in the database given an array of guild objects.
 * @param {Array} guilds The array of guild objects to update.
 * @returns {void} nothing
 */
const updateGuildVariables = async (guilds) => {
  for (let i = 0; i < guilds.length; i++) {
    const guild = guilds[i]
    const guildDBObject = await getGuild(guild.id) // will most probably get a cached guild object
    guildDBObject.myself.completionMode = guild.myself.completionMode
    guildDBObject.myself.chanceToRespond = guild.myself.chanceToRespond
    guildDBObject.myself.rawMode = guild.myself.rawMode
    await updateGuildCache(guildDBObject) // we therefore update the cache
    await guildDBObject.save() // and save the guild to the database
  }
}

// Find the conversation for a specified guild and channel and add a message to it
/**
 * Add a message to the conversation for a specified guild and channel.
 * @param {Object} message The message object used to extract the conversation data needed.
 * @param {string} content The content of the message to add to the conversation.
 * @returns {boolean} True if the message was added to the conversation, false if it errored.
 */
const addMessageToConversation = async (message, content) => {
  const currentGuildId = message.guild.id
  const currentGuildName = message.guild.name
  const currentChannelId = message.channel.id
  const currentUserId = message.author.id
  const currentUserName = message.author.username
  const currentTimestamp = message.createdAt.toISOString()
  const conversation = await Conversation.findOne({ channelId: currentChannelId })
  if (conversation) {
    await conversation.conversation.push({
      userId: currentUserId,
      userName: currentUserName,
      messages: [
        {
          message: content,
          timestamp: currentTimestamp
        }
      ]
    })
    await conversation.save()
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
    await conversationDBObject
      .save()
      .then(() => {
        console.log(`\tCreated conversation for ${currentGuildName} in ${currentChannelId}`)
        return true
      })
      .catch((err) => {
        console.log(err)
        return false
      })
  }
}

/**
 * Function that gets the conversation from the database and returns it
 * @param {string} guildID - The ID of the guild to get the conversation for
 * @param {string} channelID - The ID of the channel to get the conversation for
 * @returns {object} - The conversation object
 * @returns {null} - If no conversation was found
 */
const setChanceForGuild = async (guildID, chance) => {
  const guild = await getGuild(guildID)
  if (!guild) return
  guild.myself.chanceToRespond = chance
  await guild.save()
  console.log(`\tAdjusted chance for guild ${guildID} to ${chance} or ${chance * 100}%`)
  await updateGuildCache(guild)
  return guild.myself.chanceToRespond || null // setting always returns the current value (for convenience)
}

/**
 * Function that gets the completion mode for a guild from the database and returns it
 * @param {string} guildID - The ID of the guild to get the completion mode for
 * @returns {String} - The completion mode
 * @returns {null} - If no completion mode was found
 */
const setCompletionModeForGuild = async (guildID, mode) => {
  const guild = await getGuild(guildID)
  if (!guild) return
  guild.myself.completionMode = mode
  await guild.save()
  console.log(`\tAdjusted completion mode for guild ${guildID} to ${mode}`)
  await updateGuildCache(guild)
  return guild.myself.completionMode || null // setting always returns the current value (for convenience)
}

/**
 * Function that sets the raw mode for a guild from the database and returns it
 * @param {string} guildID - The ID of the guild to set the raw mode for
 * @param {boolean} rawMode - The raw mode to set
 * @returns {boolean} - The raw mode
 * @returns {null} - If no raw mode was found
 */
const setRawModeForGuild = async (guildID, rawMode) => {
  const guild = await getGuild(guildID)
  if (!guild) return
  guild.myself.rawMode = rawMode
  await guild.save()
  console.log(`\tAdjusted raw mode for guild ${guildID} to ${rawMode}`)
  await updateGuildCache(guild)
  return guild.myself.rawMode || null // setting always returns the current value (for convenience)
}

/**  Function that gets the guild from the database and returns it
 * @param {string} guildID - The ID of the guild to get
 * @returns {object} - The guild object
 * @returns {null} - If no guild was found
 */
const getConversation = async (guildID, channelID) => {
  const convo = await Conversation.find({ guildID: guildID, channelID: channelID })
  if (!convo) return
  return convo
}

/** Get the chance to reply for a specified guild
 * @param {string} guildID - The ID of the guild to get the chance for
 * @returns {number} - The chance to reply
 * @returns {0} - If no chance was found
 */
const getChanceForGuild = async (guildID) => {
  const guild = await getGuild(guildID)
  if (!guild) {
    console.log(`\tNo guild found for id: ${guildID}`)
    return false
  } else if (guild.myself.chanceToRespond === undefined) {
    console.log(`\tNo chance found for ${guildID} but the guild was found.`)
    return false
  } else {
    console.log(`\tChance found for ${guildID}, it is ${guild.myself.chanceToRespond * 100}%`)
    return guild.myself.chanceToRespond || 0
  }
}

/**
 * Function that gets the completion mode for a guild from the database and returns it
 * @param {string} guildID - The ID of the guild to get the completion mode for
 * @returns {boolean} completionMode - The completion mode of the guild (true = complete, false = incomplete)
 * @returns {boolean} false - If no completion mode was found
 */
const getCompletionModeForGuild = async (guildID) => {
  const guild = await getGuild(guildID)
  if (!guild) {
    console.log(`\tNo guild found for id: ${guildID}`)
    return false
  } else if (guild.myself.completionMode === undefined) {
    console.log(`\tNo completion mode found for ${guildID} but the guild was found.`)
    return false
  } else {
    console.log(`\tCompletion mode found for ${guildID}, ${guild.myself.completionMode}`)
    return guild.myself.completionMode || false
  }
}
/**
 * Function that gets the raw mode for a guild from the database and returns it
 * @param {string} guildID - The ID of the guild to get the raw mode for
 * @returns {boolean} rawMode - The raw mode of the guild (true = raw, false = not raw)
 * @returns {boolean} false - If no raw mode was found
 */
const getRawModeForGuild = async (guildID) => {
  const guild = await getGuild(guildID)
  if (!guild) {
    console.log(`\tNo guild found for id: ${guildID}`)
    return false
  } else if (guild.myself.rawMode === undefined) {
    console.log(`\tNo raw mode found for ${guildID} but the guild was found.`)
    return false
  } else {
    console.log(`\tRaw mode found for ${guildID}, returning ${guild.myself.rawMode}`)
    return guild.myself.rawMode || false
  }
}

module.exports = {
  syncGuildsWithDB,
  getGuild,
  updateGuildVariables,
  getConversation,
  setChanceForGuild,
  setCompletionModeForGuild,
  setRawModeForGuild,
  getRawModeForGuild,
  getChanceForGuild,
  getCompletionModeForGuild,
  addMessageToConversation,
  getMyselfForGuild
}
