/**
 * Application lifecycle:
 * - initialize environment variables and required modules
 * - - among them being two schemas for guilds and conversations
 * - connect to mongoDB database using a raw connection string
 * - initialize the myselfDefault object
 * - initialize the commands we want to use
 * - initialize the discord client and event loop
 * - define event handlers for the client
 * - connect to discord and go online listening for events and slash commands
 */

//#region enviroment variables
require('dotenv').config({ path: __dirname + '/.env' })
const TOKEN = process.env.DISCORD_TOKEN
const VERBOSE = process.env.VERBOSE === 'true' ? true : false
const WHITELIST = process.env.WHITELIST.split(',')
const BLACKLIST = process.env.BLACKLIST.split(',')
const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING
//#endregion enviroment variables

//#region requires
const mongoose = require(`mongoose`)
const { MessageEmbed } = require(`discord.js`)
const { SlashCommandBuilder } = require(`@discordjs/builders`)
const { REST } = require(`@discordjs/rest`)
const { Routes } = require(`discord-api-types/v9`)
const { Client } = require(`discord.js`)
const rest = new REST({ version: `9` }).setToken(TOKEN)
//#region custom requires
const { getRandom, replyMention, isChannelWhitelisted, isChannelBlacklisted, cleanText } = require('./helper.js')
const { getPrompt } = require('./ai.js')
// db requires
const {
  syncGuildsWithDB,
  getGuild,
  getConversation,
  setChanceForGuild,
  setCompletionModeForGuild,
  getChanceForGuild,
  getCompletionModeForGuild,
  createConversation,
  addMessageToConversation
} = require('./db.js')
//#endregion custom requires
//#endregion requires

//#region mongoose
mongoose.connect(DB_CONNECTION_STRING, { useNewUrlParser: true })
const db = mongoose.connection
db.on(`error`, console.error.bind(console, `connection error:`))
db.once(`open`, () => {
  console.log(`Connected to MongoDB`)
})
//#endregion mongoose

//#region myselfDefault
const myselfDefault = {
  id: parseInt(process.env.MY_ID),
  name: process.env.MY_NAME,
  key: process.env.OPENAI_API_KEY,
  intents: process.env.MY_INTENTS.split(','),
  verbose: process.env.VERBOSE === 'true' ? true : false,
  options: {
    completionMode: process.env.COMPLETION_MODE === 'true' ? true : false,
    rawMode: process.env.MYSELF_RAW === 'true' ? true : false,
    chanceToRespond: parseFloat(process.env.CHANCE_TO_RESPOND),
    openai: {
      model: process.env.AI_MODEL,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE),
      tokens: parseInt(process.env.MY_MAX_TOKENS),
      top_p: parseFloat(process.env.TOP_P),
      frequency_penalty: parseFloat(process.env.FREQUENCY_PENALTY),
      presence_penalty: parseFloat(process.env.PRESENCE_PENALTY),
      stop: process.env.MY_STOP.split(',')
    }
  },
  premise: process.env.MY_PREMISE,
  whiteList: WHITELIST,
  blackList: BLACKLIST
}
//#endregion myselfDefault

//#region client
const client = new Client({
  intents: myselfDefault.intents
}).setMaxListeners(15)
//#endregion client

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
  new SlashCommandBuilder().setName('togglecompletion').setDescription('Toggles the completion mode.'),
  new SlashCommandBuilder()
    .setName('togglerawmode')
    .setDescription('Toggles the raw mode. This mode will disable the initial prompt and send the raw text instead.')
]
//#endregion commands

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
//#endregion REFRESH

//#region ready event
client.on(`ready`, () => {
  console.log(`Logged in as ${client.user.tag}!`)
  console.log(
    `${myselfDefault.name} has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`
  )
  console.log(`\tVerbose Mode: ${VERBOSE}`)
  //#region refresh guilds
  syncGuildsWithDB(client, myselfDefault)
  //#endregion refresh guilds
})
//#endregion ready event

//#region slash command events
//#region experiment command
//TODO: this is a placeholder command for things to come
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `experiment`) {
    // Start an experiment
    const embed = new MessageEmbed()
      .setTitle(`Start an experiment`)
      .setDescription(`Start an experiment in this channel.`)
      .setColor(`#abff33`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion experiment command

//#region ping command
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `ping`) {
    // Measure response time ping
    const ping = Date.now() - interaction.createdTimestamp.valueOf()
    const embed = new MessageEmbed().setTitle(`Pong!`).setDescription(`${ping}ms`).setColor(`#00ff00`)
    if (VERBOSE) console.log(`Pinged (${ping}ms by: ${interaction.author.tag} at ${interaction.createdAt}.`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion ping command



//#region shutup command
// shutup = set chance to 0
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `shutup`) {
    // Set the chance to respond to 0%
    myselfDefault.options.chanceToRespond = 0
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond set to 0%`)
      .setDescription(`Chance to respond set to 0%`)
      .setColor(`#9fff00`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion shutup command


//#region reset command
// reset = reset chance to respond to 5%
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `reset`) {
    // Reset the chance to respond to 5%
    myselfDefault.options.chanceToRespond = 0.05
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond reset to 5%`)
      .setDescription(`Chance to respond overall at: ${myselfDefault.options.chanceToRespond * 100}%`)
      .setColor(`#11ffab`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion reset command

//#region status command
// status = report current status on variables
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `status`) {
    // Report current status on variables
    const embed = new MessageEmbed()
      .setTitle(`Current status on variables`)
      .setDescription(
        `Chance to respond overall at: ${myselfDefault.options.chanceToRespond * 100}%\n
         Completion mode: ${myselfDefault.options.completionMode}\n
         Raw mode: ${myselfDefault.options.rawMode}`
      )
      .setColor(`#abff33`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion status command

//#region togglecompletion command
// toggleCompletion = toggle completion mode
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `togglecompletion`) {
    // Toggle completion mode
    myselfDefault.options.completionMode = !myselfDefault.options.completionMode
    const embed = new MessageEmbed()
      .setTitle(`Completion mode toggled`)
      .setDescription(`Completion mode is now: ${myselfDefault.options.completionMode}`)
      .setColor(`#23ff67`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion togglecompletion command

//#region setchance command
// setchance = set chance to a specific value in %
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `setchance`) {
    // Set the chance to respond to a specific value
    const integer = interaction.options.getInteger('integer')
    //myselfDefault.options.chanceToRespond = integer / 100

    const embed = new MessageEmbed()
      .setTitle(`Chance to respond set to ${integer}%`)
      .setDescription(`Chance to respond overall at: ${integer}%`)
      .setColor(`#11ffab`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion setchance command

//#region help command
// help = list of commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `help`) {
    // Reply with a list of commands
    const embed = new MessageEmbed()
      .setTitle(`Commands`)
      .setDescription(
        `
      **@${client.user.username}** guaranteed response to your message.
      **/experiment** - Start an experiment.
      **/help** - List of commands.
      **/ping** - Measures the response time of the bot.
      **/reset** - Reset the chance to respond to 5%.
      **/shutup** - Sets the chance to respond to 0%.
      **/status** - Reports the current status of global variables like chance to respond and completion mode.
      **/setchance** - Sets the chance to respond to a certain percentage.
      **/togglecompletion** - Toggles the completion mode.
      **/togglerawmode** - Toggles the raw mode. The prompt will be sent as is.
      **Written by**: soulwax#5358
      **Github:**: https://github.com/soulwax/Shimizu-GPT-3
      `
      )
      .setThumbnail('https://i.imgur.com/sP8zuGr.png')
      .setColor(`#01ff77`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion help command
//#endregion commands

//#region command raw mode
// togglerawmode = toggle raw mode
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `togglerawmode`) {
    // Toggle raw mode
    myselfDefault.options.rawMode = !myselfDefault.options.rawMode
    const embed = new MessageEmbed()
      .setTitle(`Raw mode toggled`)
      .setDescription(`Raw mode is now: ${myselfDefault.options.rawMode}`)
      .setColor(`#23ff67`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion command raw mode
//#endregion slash command events

//#region main message event
client.on('messageCreate', async (message) => {
  if (message.author.bot) return
  const author = message.author.username
  const rawMessage = message.content
  // Find out if conversation exists in the database and create it if not
  await createConversation(message)
  await addMessageToConversation(message, rawMessage)
  // The bot will reply under the following conditions:
  // case 1: the bot is mentioned
  // case 2: the message was received in a whitelisted channel
  // case 3: the message received was not in a blacklisted channel and
  //         the random chance to respond was successful
  if (
    replyMention(message, client) ||
    isChannelWhitelisted(message, WHITELIST) ||
    (getRandom(myselfDefault.options.chanceToRespond) && !isChannelBlacklisted(message, BLACKLIST))
  ) {
    // to work with the message, we need to clean it from discord's markdown
    // get rid of discord names and emojis
    // ? is this really necessary?
    const cleanedText = cleanText(rawMessage, myselfDefault.options.completionMode)
    if (cleanedText.length <= 0) return // if the cleaned text is empty, don't do anything

    message.channel.sendTyping() // otherwise, start typing

    if (VERBOSE) {
      console.log(`Original message content created at ${message.createdAt}:`)
      console.log(`${message.author.username}: ${rawMessage}`) // original message
      console.log(`Clean text: ${cleanedText} length: ${cleanedText.length}`) // trimmed message
    }

    let response = await getPrompt(myselfDefault.options.rawMode ? rawMessage : cleanedText, myselfDefault, author)
    await addMessageToConversation(message, response)
    if (response === undefined) {
      // This case should technically never trigger
      // unless we send a faulty prompt
      response = 'I am sorry, I do not understand.'
    } else if (response.length > 2000) {
      //shorten response if it is too long
      //the discord API has a limit of 2000 characters
      response = response.substring(0, 2000)
    }

    // don't do anything if the response is empty or undefined
    if (response.length == '' || response.length == undefined) return
    // reply with the prompt
    await message.reply(response)
  }
})
//#endregion main message event

client.login(TOKEN)
