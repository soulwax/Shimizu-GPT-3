require('dotenv').config()
const TOKEN = process.env.DISCORD_TOKEN
const VERBOSE = process.env.VERBOSE
const { getRandom, replyMention, replyChannelDefined, cleanText } = require('./helper.js')
const { getPrompt } = require('./ai.js')
const { MessageEmbed } = require(`discord.js`)
const { SlashCommandBuilder } = require(`@discordjs/builders`)
const { REST } = require(`@discordjs/rest`)
const { Routes } = require(`discord-api-types/v9`)
const { Client } = require(`discord.js`)
const rest = new REST({ version: `9` }).setToken(TOKEN)

//#region options
// TODO: make guild specific and save in database
let chanceToRespond = 0.05
let completionMode = false
//#endregion

//#region client
const client = new Client({
  intents: [
    `GUILDS`,
    `GUILD_MESSAGES`,
    `GUILD_PRESENCES`,
    `GUILD_MEMBERS`,
    `GUILD_INTEGRATIONS`,
    `GUILD_WEBHOOKS`,
    `GUILD_BANS`,
    `GUILD_INVITES`,
    `GUILD_VOICE_STATES`,
    `GUILD_MESSAGE_REACTIONS`,
    `GUILD_MESSAGE_TYPING`,
    `DIRECT_MESSAGES`,
    `DIRECT_MESSAGE_REACTIONS`,
    `DIRECT_MESSAGE_TYPING`,
    `GUILD_SCHEDULED_EVENTS`
  ]
})
//#endregion

//#region commands
const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Replies with "pong" if the bot is online.'),
  new SlashCommandBuilder().setName('shutup').setDescription('Sets the random response rate to 0%'),
  new SlashCommandBuilder().setName('speak').setDescription('Sets the random response rate to 5%'),
  new SlashCommandBuilder().setName('speakup').setDescription('Increases the chance to respond by 5%.'),
  new SlashCommandBuilder().setName('speakdown').setDescription('Decreases the chance to respond by 5%.'),
  new SlashCommandBuilder().setName('reset').setDescription('Resets the chance to respond to 5%.'),
  new SlashCommandBuilder().setName('status').setDescription('Reports current status on variables.'),
  new SlashCommandBuilder().setName('togglecompletion').setDescription('Toggles the completion mode.'),
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
  new SlashCommandBuilder().setName('help').setDescription('Replies with a list of commands.')
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

//#region ready event
client.on(`ready`, () => {
  console.log(`Logged in as ${client.user.tag}!`)
})
//#endregion

// #region slash command events
// ping
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

// speak = set chance to 0.05
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `speak`) {
    // Set the chance to respond to 5%
    chanceToRespond = 0.05
    const embed = new MessageEmbed()
      .setTitle(`Thank you! I will try to not speak too much.`)
      .setDescription(`Chance to respond set to 5% although I long to dream of speaking more to you.`)
      .setColor(`#11ffab`)
    await interaction.reply({ embeds: [embed] })
  }
})

// shutup = set chance to 0
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `shutup`) {
    // Set the chance to respond to 0%
    chanceToRespond = 0
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond set to 0%`)
      .setDescription(`Chance to respond set to 0%`)
      .setColor(`#9fff00`)
    await interaction.reply({ embeds: [embed] })
  }
})

// speakup = increase chance to respond by 5%
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `speakup`) {
    // Increase the chance to respond by 5%
    chanceToRespond += 0.05
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond increased by 5%`)
      .setDescription(`Chance to respond overall at: ${chanceToRespond * 100}%`)
      .setColor(`#11ffab`)
    await interaction.reply({ embeds: [embed] })
  }
})

// speakdown = decrease chance to respond by 5%
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `speakdown`) {
    // Decrease the chance to respond by 5%
    chanceToRespond -= 0.05
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond decreased by 5%`)
      .setDescription(`Chance to respond overall at: ${chanceToRespond * 100}%`)
      .setColor(`#ab0011`)
    await interaction.reply({ embeds: [embed] })
  }
})

// reset = reset chance to respond to 5%
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `reset`) {
    // Reset the chance to respond to 5%
    chanceToRespond = 0.05
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond reset to 5%`)
      .setDescription(`Chance to respond overall at: ${chanceToRespond * 100}%`)
      .setColor(`#11ffab`)
    await interaction.reply({ embeds: [embed] })
  }
})

// status = report current status on variables
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `status`) {
    // Report current status on variables
    const embed = new MessageEmbed()
      .setTitle(`Current status on variables`)
      .setDescription(`Chance to respond overall at: ${chanceToRespond * 100}%\nCompletion mode: ${completionMode}`)
      .setColor(`#abff33`)
    await interaction.reply({ embeds: [embed] })
  }
})

// toggleCompletion = toggle completion mode
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `togglecompletion`) {
    // Toggle completion mode
    completionMode = !completionMode
    const embed = new MessageEmbed()
      .setTitle(`Completion mode toggled`)
      .setDescription(`Completion mode is now: ${completionMode}`)
      .setColor(`#23ff67`)
    await interaction.reply({ embeds: [embed] })
  }
})

// setchance = set chance to a specific value in %
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `setchance`) {
    // Set the chance to respond to a specific value
    const integer = interaction.options.getInteger('integer')
    chanceToRespond = integer / 100
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond set to ${integer}%`)
      .setDescription(`Chance to respond overall at: ${integer}%`)
      .setColor(`#11ffab`)
    await interaction.reply({ embeds: [embed] })
  }
})

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
      **/ping** - Measures the response time of the bot.
      **/status** - Reports the current status of global variables like chance to respond and completion mode.
      **/speak** - Sets the chance to respond to 5%.
      **/shutup** - Sets the chance to respond to 0%.
      **/speakup** - Increases the chance to respond by 5%.
      **/speakdown** - Decreases the chance to respond by 5%.
      **/speakreset** - Resets the chance to respond to 5%.
      **/setchance** - Sets the chance to respond to a certain percentage.
      **/toggleCompletion** - Toggles the completion mode.
      **Written by**: soulwax#9204
      **Github:**: https://github.com/soulwax/Shimizu-GPT-3
      `
      )
      .setThumbnail('https://i.imgur.com/sP8zuGr.png')
      .setColor(`#01ff77`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion

//#region message event
client.on('messageCreate', async (message) => {
  if (message.author.bot) return

  if (replyMention(message, client) || replyChannelDefined(message) || getRandom(chanceToRespond)) {
    
    // get rid of discord names and emojis
    let cleanedText = cleanText(message.content, completionMode)
    let cleanTextLength = cleanedText.length
    if(cleanTextLength <= 0) return
    message.channel.sendTyping()
    let prompt = `Human: ${cleanedText}`
    if (VERBOSE) {
      console.log(`Original message content created at ${message.createdAt}:`)
      console.log(`${message.author.username}: ${message.content}`) // original message
      console.log(`After trimming: ${prompt}, clean text: ${cleanedText} length: ${cleanedText.length}`) // trimmed message
    }

    let response = await getPrompt(`Human: ${prompt}`, 240)
    if (response === undefined) {
      response = 'I am sorry, I do not understand.'
    } else if (response.length > 2000) {
      //shorten response if it is too long
      response = response.substring(0, 2000)
    }
    // reply with the prompt
    await message.reply(response)
  }
})
//#endregion

client.login(TOKEN)
