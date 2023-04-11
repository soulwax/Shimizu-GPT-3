const { myselfDefault } = require('./ai.js')
const Guild = require('./models/guild.js')
const Conversation = require('./models/conversation.js')

/**
 * Function that syncs guilds between client and database
 * @param {Object} client - The discord client object
 * @param {Object} myself - The myself object (manually set)
 * @returns {Boolean} frue if the sync was successful, false if it failed
 */
const getGuildsAndIds = (client) => {
  return client.guilds.cache.map((guild) => ({
    name: guild.name,
    id: guild.id
  }))
}

const logGuilds = (guilds) => {
  const guildNames = guilds.map((guild) => guild.name)
  console.log(`\tGuilds: ${guildNames.join(', ')}`) // TODO: add verbose option
}

const guildExistsInDb = async (guildId) => {
  return Boolean(await Guild.findOne({ guildId }))
}

const createGuildDBObject = (iteratedGuild, client, myself) => {
  const { id: guildId, name } = iteratedGuild
  const joinedAt = client.guilds.cache.get(guildId).joinedAt.toISOString()
  const {
    id,
    name: myName,
    model,
    key,
    temperature,
    top_p,
    frequency_penalty,
    presence_penalty,
    stop,
    chanceToRespond,
    rawMode,
    completionMode,
    tokens,
    premise,
    whiteList,
    blackList
  } = myself

  return new Guild({
    guildId,
    name,
    joinedAt,
    tokens,
    premise,
    whitelistedChannels: whiteList,
    blacklistedChannels: blackList,
    myself: {
      myId: id,
      name: myName,
      model,
      apiKey: key,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty,
      stop,
      chanceToRespond,
      rawMode,
      completionMode
    }
  })
}

const saveGuild = async (guildDBObject) => {
  try {
    await guildDBObject.save()
    console.log(`\t\tGuilds were successfully saved to the database if they didn't exist yet`)
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

const syncGuildsWithDB = async (client, myself) => {
  const guilds = getGuildsAndIds(client)
  logGuilds(guilds)

  for (const iteratedGuild of guilds) {
    const { id: iteratedGuildId, name: iteratedGuildName } = iteratedGuild

    if (await guildExistsInDb(iteratedGuildId)) {
      console.log(`\t\tGuild ${iteratedGuildName} already exists in the database`)
      continue
    }

    const guildDBObject = createGuildDBObject(iteratedGuild, client, myself)
    await saveGuild(guildDBObject)
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

const saveMessage = async (channelId, content, author) => {
  const timestamp = new Date()
  const message = { content, timestamp, author }

  const conversation = await Conversation.findOne({ channelId })

  if (conversation) {
    conversation.messages.push(message)
    await conversation.save()
  } else {
    const newConversation = new Conversation({ channelId, messages: [message] })
    await newConversation.save()
  }
}

const getConversationMessages = async (channelId) => {
  const conversation = await Conversation.findOne({ channelId })
  return conversation ? conversation.messages : []
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
  return guild.myself.chanceToRespond // setting always returns the current value (for convenience)
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
  return guild.myself.completionMode // setting always returns the current value (for convenience)
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
  return guild.myself.rawMode // setting always returns the current value (for convenience)
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
    return guild.myself.completionMode
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
    return guild.myself.rawMode
  }
}

// Set whitelisted channel for guild by ID
const setWhitelistedChannelForGuild = async (guildID, channelID) => {
  const guild = await getGuild(guildID)
  if (!guild) return
  // check if whitelisted channels are already set
  if (!guild.myself.whitelistedChannels) {
    guild.myself.whitelistedChannels = []
  }
  // check if channel is already whitelisted
  if (guild.myself.whitelistedChannels.includes(channelID)) {
    console.log(`\tChannel ${channelID} is already whitelisted for guild ${guildID}`)
    return guild.myself.whitelistedChannels || null // setting always returns the current value (for convenience)
  }
  // add channel to whitelist
  guild.myself.whitelistedChannels.push(channelID)
  await guild.save()
  console.log(`\tAdded channel ${channelID} to whitelist for guild ${guildID}`)
  await updateGuildCache(guild)
  return guild.myself.whitelistedChannels || null // setting always returns the current value (for convenience)
}

const setPremiseForGuild = async (guildID, premise) => {
  const guild = await getGuild(guildID)
  if (!guild) return
  guild.myself.premise = premise
  await guild.save()
  console.log(`\tAdjusted premise for guild ${guildID} to ${premise}`)
  await updateGuildCache(guild)
  return guild.myself.premise || null // setting always returns the current value (for convenience)
}

const getPremiseForGuild = async (guildID) => {
  const guild = await getGuild(guildID)
  if (!guild) {
    console.log(`\tNo guild found for id: ${guildID}`)
    return false
  } else if (guild.myself.premise === undefined) {
    console.log(`\tNo premise found for ${guildID} but the guild was found.`)
    return false
  } else {
    console.log(`\tPremise found for ${guildID}, ${guild.myself.premise}`)
    return guild.myself.premise || false
  }
}

module.exports = {
  syncGuildsWithDB,
  getGuild,
  updateGuildVariables,
  getConversationMessages,
  saveMessage,
  setChanceForGuild,
  setCompletionModeForGuild,
  setRawModeForGuild,
  getRawModeForGuild,
  getChanceForGuild,
  getCompletionModeForGuild,
  getMyselfForGuild,
  setWhitelistedChannelForGuild,
  setPremiseForGuild,
  getPremiseForGuild
}
