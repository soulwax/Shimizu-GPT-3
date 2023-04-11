//#region Explanation of lifecycle
/**
 * Application lifecycle:
 * - initialize environment variables and required modules
 * - - among them being two schemas for guilds and conversations
 * - connect to mongoDB database using a raw connection string
 * - initialize the ai / myself default object
 * - initialize the commands we want to use
 * - initialize the discord client and event loop
 * - define event handlers for the client
 * - connect to discord and go online listening for events and slash commands
 */
//#endregion

//#region enviroment variables
require('dotenv').config({})
const TOKEN = process.env.DISCORD_TOKEN
const VERBOSE = process.env.VERBOSE === 'true' ? true : false
const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING
//#endregion

//#region requires
const mongoose = require(`mongoose`)
const { MessageEmbed } = require(`discord.js`)
const { SlashCommandBuilder } = require(`@discordjs/builders`)
const { REST } = require(`@discordjs/rest`)
const { Routes } = require(`discord-api-types/v9`)
const { Client } = require(`discord.js`)
const rest = new REST({ version: `9` }).setToken(TOKEN)
//#region custom requires
const { cleanText, shouldReply, formatConversationHistory } = require('./helper.js')
const { getPrompt, myselfDefault } = require('./ai.js')
// db requires
const {
  saveMessage,
  syncGuildsWithDB,
  setChanceForGuild,
  setCompletionModeForGuild,
  getConversationMessages,
  setRawModeForGuild,
  getChanceForGuild,
  getCompletionModeForGuild,
  getRawModeForGuild,
  updateGuildVariables,
  getMyselfForGuild,
  getGuild: getGuildFromDB,
  setWhitelistedChannelForGuild: addChannelToWhitelist
} = require('./db.js')
//#endregion
//#endregion

//#region mongoose
mongoose.connect(DB_CONNECTION_STRING, { useNewUrlParser: true })
const db = mongoose.connection
db.on(`error`, console.error.bind(console, `connection error:`))
db.once(`open`, () => {
  console.log(`Connected to MongoDB`)
})
//#endregion

//#region client
const client = new Client({
  intents: myselfDefault.intents
}).setMaxListeners(15)
//#endregion

//#region commands
const commands = [
  new SlashCommandBuilder().setName(`experiment`).setDescription(`Start an experiment`),
  new SlashCommandBuilder().setName('help').setDescription('Replies with a list of commands.'),
  new SlashCommandBuilder().setName('ping').setDescription('Replies with "pong" if the bot is online.'),
  new SlashCommandBuilder().setName('reset').setDescription('Resets the chance to respond to 5%.'),
  new SlashCommandBuilder().setName('shutup').setDescription('Sets the random response rate to 0%'),
  new SlashCommandBuilder().setName('status').setDescription('Reports current status on variables.'),
  new SlashCommandBuilder()
    .setName('setchance')
    .setDescription('Sets the chance to respond to a specific value.')
    .addIntegerOption((option) => {
      return option
        .setName('integer')
        .setDescription('The chance to respond to a specific value.')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100)
    }),
  new SlashCommandBuilder().setName('whitelist').setDescription('Whitelists a channel.'),
  new SlashCommandBuilder().setName('togglecompletion').setDescription('Toggles the completion mode.'),
  new SlashCommandBuilder()
    .setName('togglerawmode')
    .setDescription('Toggles the raw mode. This mode will disable the initial prompt and send the raw text instead.')
]
//#endregion

//#region REFRESH
;(async () => {
  try {
    if (VERBOSE) console.log(`Started refreshing application (/) commands.`)

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands
    })

    if (VERBOSE) console.log(`Successfully reloaded application (/) commands.`)
  } catch (error) {
    console.error(error)
  }
})()
//#endregion

//#region Discord specific helper functions
const getStatusForGuildEmbed = async (interaction) => {
  const embed = new MessageEmbed()
  const completionMode = await getCompletionModeForGuild(interaction.guild.id)
  const rawMode = await getRawModeForGuild(interaction.guild.id)
  const chance = await getChanceForGuild(interaction.guild.id)
  const completionFieldText = `Completion mode: ${completionMode ? 'on' : 'off'}`
  const rawFieldText = `Raw mode: ${rawMode ? 'on' : 'off'}`
  const chanceFieldText = `My chance to respond randomly: ${chance * 100}%`
  embed.setDescription(`${completionFieldText}\n${rawFieldText}\n${chanceFieldText}`)
  return embed
}
//#endregion

//#region command helper function(s)
const handleEmbedForCommand = async (interaction, commandName, commandFunction, embedTitle, embedColor) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === commandName) {
    const newValue = await commandFunction(interaction)
    const embed = new MessageEmbed()
      .setTitle(`${embedTitle} for ${interaction.guild.name}`)
      .setDescription(newValue)
      .setColor(embedColor)
    await interaction.reply({ embeds: [embed] })
  }
}

async function handleStatusCommand(interaction, commandName, execute, title, color) {
  if (!interaction.isCommand() || interaction.commandName !== commandName) return
  const embed = await execute(interaction)
  embed.setTitle(title).setColor(color)
  await interaction.reply({ embeds: [embed] })
}
//#endregion

//#region ready event
client.on(`ready`, async () => {
  console.log(`Logged in as ${client.user.tag}!`)
  console.log(
    `${myselfDefault.name} has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`
  )
  console.log(`\tVerbose Mode: ${VERBOSE}`)
  // Set own description
  // empty fn
  //#region refresh guilds
  await syncGuildsWithDB(client, myselfDefault)
  //#endregion refresh guilds
})
//#endregion

//#region slash command events (not including the ai response event)
// handleEmbedCommand always expects a string to be returned,
// whereas handleStatusCommand expects an embed to be returned
client.on('interactionCreate', async (interaction) => {
  // Toggle completion mode
  handleEmbedForCommand(
    interaction,
    'togglecompletion',
    async (interaction) => {
      const guildId = interaction.guild.id
      const currentValue = await getCompletionModeForGuild(guildId)
      const newValue = await setCompletionModeForGuild(guildId, !currentValue)
      return `Completion mode is now: ${newValue}`
    },
    'Completion mode toggled',
    '#23ff67'
  )
  // Toggle raw mode
  handleEmbedForCommand(
    interaction,
    'togglerawmode',
    async (interaction) => {
      const guildId = interaction.guild.id
      const currentValue = await getRawModeForGuild(guildId)
      const newValue = await setRawModeForGuild(guildId, !currentValue)
      return `Raw mode is now: ${newValue}`
    },
    'Raw mode toggled',
    '#23ff67'
  )

  // Set chance to respond to a specific value
  handleEmbedForCommand(
    interaction,
    'setchance',
    async (interaction) => {
      const integer = interaction.options.getInteger('integer')
      if (integer >= 0 && integer <= 100) {
        console.log(`Setting chance to ${integer}%`)
        const guildId = interaction.guild.id
        const newValue = await setChanceForGuild(guildId, integer > 0 ? integer / 100 : 0)
        return `Chance to respond is now: ${newValue * 100}%`
      }
    },
    'Chance to respond',
    '#11ffab'
  )

  // Measure response time ping
  handleEmbedForCommand(
    interaction,
    'ping',
    async (interaction) => {
      const ping = Date.now() - interaction.createdTimestamp.valueOf()
      if (VERBOSE) console.log(`Pinged (${ping}ms by: ${interaction.user.tag} at ${interaction.createdAt}.`)
      return `Pong! ${ping}ms`
    },
    'Pong!',
    '#00ff00'
  )

  // Set the chance to respond to 0%
  handleEmbedForCommand(
    interaction,
    'shutup',
    async (interaction) => {
      await setChanceForGuild(interaction.guild.id, 0)
      return `I will not respond to any messages randomly anymore. :(`
    },
    `Chance to respond for ${interaction.guild.name} was set to 0%`,
    '#9fff00'
  )

  // Reset guild settings to default
  handleStatusCommand(
    interaction,
    'reset',
    async (interaction) => {
      await setChanceForGuild(interaction.guild.id, myselfDefault.chanceToRespond)
      await setCompletionModeForGuild(interaction.guild.id, myselfDefault.completionMode)
      await setRawModeForGuild(interaction.guild.id, myselfDefault.rawMode)
      const embed = await getStatusForGuildEmbed(interaction)
      return embed
    },
    'Settings reset',
    '#ff0000'
  )

  // Report current status on variables
  handleStatusCommand(
    interaction,
    'status',
    async (interaction) => {
      const embed = await getStatusForGuildEmbed(interaction)
      return embed
    },
    'Status report',
    '#0000ff'
  )

  handleEmbedForCommand(
    interaction,
    'whitelist',
    async (interaction) => {
      const guildId = interaction.guild.id
      const channelId = interaction.channel.id
      const channelName = interaction.channel.name
      const channel = await addChannelToWhitelist(guildId, channelId)
      return `Added channel #${channelName} to the whitelist. Channel ID: ${channel}`
    },
    'Channel whitelisted',
    '#ffffff'
  )

  // Reply with a list of commands
  handleStatusCommand(
    interaction,
    'help',
    async () => {
      const embed = new MessageEmbed()
        .setTitle('Commands')
        .setDescription(
          `
          **@${client.user.username}**: guaranteed response to your message.
          **/help** - List of commands.
          **/ping** - Measures the response time of the bot.
          **/reset** - Reset the chance to respond to 5%.
          **/shutup** - Sets the chance to respond to 0%.
          **/status** - Reports the current status of global variables like chance to respond and completion mode.
          **/setchance** - Sets the chance to respond to a certain percentage.
          **/togglecompletion** - Toggles the completion mode.
          **/togglerawmode** - Toggles the raw mode. The prompt will be sent as is.
          **/whitelist** - Adds the channel the command was sent in to the whitelist.
          **Written by**: soulwax#7588
          **Github:**: https://github.com/soulwax/Shimizu-GPT-3
          `
        )
        .setThumbnail('https://i.imgur.com/sP8zuGr.png')
      return embed
    },
    'Commands',
    '#01ff77'
  )
})
//#endregion

//#region main message event handler for the ai response
client.on('messageCreate', async (message) => {
  if (message.author.bot) return

  const { guild, channel, author, content, attachments } = message
  const { id: guildID } = guild
  const { id: channelId } = channel
  const { username: authorUsername } = author
  const guildInfo = await getGuildFromDB(guildID, false)

  const {
    name: myName,
    chanceToRespond,
    completionMode: isCompletionMode,
    rawMode: isRawMode,
    whiteList,
    blackList
  } = await getMyselfForGuild(guildID)

  let rawContent = content

  if (attachments.size > 0 && rawContent.length <= 0) {
    const attachmentURL = attachments.first().url
    rawContent = attachmentURL
    if (VERBOSE) console.log(`${authorUsername} sent a message with an attachment: ${rawContent}`)
  }

  if (VERBOSE) console.log(`${authorUsername} said: ${rawContent}`)
  if (rawContent === '') return

  await saveMessage(channelId, rawContent, authorUsername)

  if (shouldReply(message, client, chanceToRespond, whiteList, blackList)) {
    const cleanedText = cleanText(rawContent, isCompletionMode)
    if (cleanedText.length <= 0) return

    message.channel.sendTyping()
    // TODO: Put past messages into the prompt
    const pastMessages = await getConversationMessages(channelId)
    const formattedHistory = formatConversationHistory(pastMessages, myName)
    // Include the past messages as part of the prompt
    const prompt = formattedHistory + `**${authorUsername}** said: ${isRawMode ? rawContent : cleanedText}\n`

    let response = await getPrompt(isRawMode ? rawContent : cleanedText, guildInfo, author, formattedHistory);

    if (response === undefined) {
      response = 'I am sorry, I do not understand.'
    } else if (response.length > 2000) {
      response = response.substring(0, 2000)
    }

    if (response.length === '' || response.length === undefined) return

    await saveMessage(channelId, response, myName)
    await message.reply(response)
  }
})
//#endregion

//#region guild events
// When invited to a guild, join the guild and add the guild to the database
// ! UNTESTED
client.on('guildCreate', async (guild) => {
  await addGuildToDB(guild.id)
  await addMyselfToGuild(guild.id)
  await addChannelWhitelistToGuild(guild.id, myselfDefault.whiteList)
  await addChannelBlacklistToGuild(guild.id, myselfDefault.blackList)
  await addCompletionModeToGuild(guild.id, false)
  await addRawModeToGuild(guild.id, false)
  await addChanceToRespondToGuild(guild.id, 0.05)
  await addConversationToGuild(guild.id, [])
})
//#endregion

//#region shutdown
//On discord bot shutdown
client.on('disconnect', async () => {
  // Write back changes to the database
  await updateGuildVariables(guilds)
  console.log('Disconnected')
})
//#endregion

//#region login
client.login(TOKEN)
//#endregion
