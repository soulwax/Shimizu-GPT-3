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
  getCompletionModeForGuild
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
  id: process.env.MY_ID,
  name: process.env.MY_NAME,
  premise: process.env.MY_PREMISE,
  intents: process.env.MY_INTENTS.split(','),
  key: process.env.OPENAI_API_KEY,
  verbose: process.env.VERBOSE,
  tokens: parseInt(process.env.MY_MAX_TOKENS),
  options: {
    completionMode: false,
    chanceToRespond: 0.05,
    raw: process.env.MYSELF_RAW === 'true' || false
  },
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
  new SlashCommandBuilder().setName('speak').setDescription('Sets the random response rate to 5%'),
  new SlashCommandBuilder().setName('speakup').setDescription('Increases the chance to respond by 5%.'),
  new SlashCommandBuilder().setName('speakdown').setDescription('Decreases the chance to respond by 5%.'),
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

//#region experiment command
//TODO: this is a placeholder command for things to come
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `status`) {
    // Report current status on variables
    const embed = new MessageEmbed()
      .setTitle(`Current status on variables`)
      .setDescription(
        `Chance to respond overall at: ${myselfDefault.options.chanceToRespond * 100}%\nCompletion mode: ${
          myselfDefault.options.completionMode
        }`
      )
      .setColor(`#abff33`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion experiment command

//#region slash command events
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
//#endregion slash command events

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

//#region speak command
// speak = set chance to 0.05
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `speak`) {
    // Set the chance to respond to 5%
    myselfDefault.options.chanceToRespond = 0.05
    const embed = new MessageEmbed()
      .setTitle(`Thank you! I will try to not speak too much.`)
      .setDescription(`Chance to respond set to 5% although I long to dream of speaking more to you.`)
      .setColor(`#11ffab`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion speak command

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

//#region speakup command
// speakup = increase chance to respond by 5%
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `speakup`) {
    // Increase the chance to respond by 5%
    myselfDefault.options.chanceToRespond += 0.05
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond increased by 5%`)
      .setDescription(`Chance to respond overall at: ${myselfDefault.options.chanceToRespond * 100}%`)
      .setColor(`#11ffab`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion speakup command

//#region speakdown command
// speakdown = decrease chance to respond by 5%
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `speakdown`) {
    // Decrease the chance to respond by 5%
    myselfDefault.options.chanceToRespond -= 0.05
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond decreased by 5%`)
      .setDescription(`Chance to respond overall at: ${myselfDefault.options.chanceToRespond * 100}%`)
      .setColor(`#ab0011`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion speakdown command

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
      **/ping** - Measures the response time of the bot.
      **/status** - Reports the current status of global variables like chance to respond and completion mode.
      **/speak** - Sets the chance to respond to 5%.
      **/shutup** - Sets the chance to respond to 0%.
      **/speakup** - Increases the chance to respond by 5%.
      **/speakdown** - Decreases the chance to respond by 5%.
      **/speakreset** - Resets the chance to respond to 5%.
      **/setchance** - Sets the chance to respond to a certain percentage.
      **/togglecompletion** - Toggles the completion mode.
      **/togglerawmode** - Toggles the raw mode. The prompt will be sent as is.
      **Written by**: soulwax#9204
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

//#region main message event
client.on('messageCreate', async (message) => {
  if (message.author.bot) return

  if (
    replyMention(message, client) ||
    isChannelWhitelisted(message, WHITELIST) ||
    (getRandom(myselfDefault.options.chanceToRespond) && !isChannelBlacklisted(message, BLACKLIST))
  ) {
    // get rid of discord names and emojis
    let cleanedText = cleanText(message.content, myselfDefault.options.completionMode)
    let cleanTextLength = cleanedText.length
    if (cleanTextLength <= 0) return
    message.channel.sendTyping()
    let prompt = cleanedText

    if (VERBOSE) {
      console.log(`Original message content created at ${message.createdAt}:`)
      console.log(`${message.author.username}: ${message.content}`) // original message
      console.log(`After trimming: ${prompt}, clean text: ${cleanedText} length: ${cleanedText.length}`) // trimmed message
    }

    let response = await getPrompt(prompt, myselfDefault, 'Human')
    if (response === undefined) {
      response = 'I am sorry, I do not understand.'
    } else if (response.length > 2000) {
      //shorten response if it is too long
      response = response.substring(0, 2000)
    }
    //check if response is an empty string
    if (response.length == '' || response.length == undefined) return
    // reply with the prompt
    await message.reply(response)
  }
})
//#endregion main message event

client.login(TOKEN)
