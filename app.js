require('dotenv').config()
const TOKEN = process.env.DISCORD_TOKEN 

const { getRandom, replyMention, replyChannelDefined, cleanText } = require('./helper.js')
const { getPrompt } = require('./ai.js')
const { MessageEmbed } = require(`discord.js`)
const { SlashCommandBuilder } = require(`@discordjs/builders`)
const { REST } = require(`@discordjs/rest`)
const { Routes } = require(`discord-api-types/v9`)
const { Client } = require(`discord.js`)
const rest = new REST({ version: `9` }).setToken(TOKEN)

//#region options
let chanceToRespond = 0.05
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
  new SlashCommandBuilder().setName('speakreset').setDescription('Resets the chance to respond to 5%.'),
  // SlashCommandBuild for setting an integer value for chanceToRespond
  new SlashCommandBuilder()
    .setName('setchance')
    .setDescription('Sets the chance to respond to a specific value.')
    .addIntegerOption(option=> {
      return option.setName('integer')
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
    console.log(`Started refreshing application (/) commands.`)

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands
    })

    console.log(`Successfully reloaded application (/) commands.`)
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

//#region slash command events
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `ping`) {
    // Measure response time ping
    const ping = Date.now() - interaction.createdTimestamp.valueOf()
    const embed = new MessageEmbed().setTitle(`Pong!`).setDescription(`${ping}ms`).setColor(`#00ff00`)
    await interaction.reply({ embeds: [embed] })
  }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `speak`) {
    // Set the chance to respond to 5%
    chanceToRespond = 0.05
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond set to 5%`)
      .setDescription(`Chance to respond set to 5%`)
      .setColor(`#11ffab`)
    await interaction.reply({ embeds: [embed] })
  }
})

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

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `speakup`) {
    // Increase the chance to respond by 5%
    chanceToRespond += 0.05
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond increased by 5%`)
      .setDescription(`Chance to respond increased by 5%`)
      .setColor(`#11ffab`)
    await interaction.reply({ embeds: [embed] })
  }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `speakdown`) {
    // Decrease the chance to respond by 5%
    chanceToRespond -= 0.05
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond decreased by 5%`)
      .setDescription(`Chance to respond decreased by 5%`)
      .setColor(`#ab0011`)
    await interaction.reply({ embeds: [embed] })
  }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `speakreset`) {
    // Reset the chance to respond to 5%
    chanceToRespond = 0.05
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond reset to 5%`)
      .setDescription(`Chance to respond reset to 5%`)
      .setColor(`#11ffab`)
    await interaction.reply({ embeds: [embed] })
  }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `setchance`) {
    // Set the chance to respond to a specific value
    const integer = interaction.options.getInteger('integer')
    chanceToRespond = integer / 100
    const embed = new MessageEmbed()
      .setTitle(`Chance to respond set to ${chanceToRespond}%`)
      .setDescription(`Chance to respond set to ${chanceToRespond}%`)
      .setColor(`#11ffab`)
    await interaction.reply({ embeds: [embed] })
  }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `help`) {
    // Reply with a list of commands
    const embed = new MessageEmbed()
      .setTitle(`Commands`)
      .setDescription(
        `
      **/ping** - Measures the response time of the bot.
      **/speak** - Sets the chance to respond to 5%.
      **/shutup** - Sets the chance to respond to 0%.
      **/speakup** - Increases the chance to respond by 5%.
      **/speakdown** - Decreases the chance to respond by 5%.
      **/speakreset** - Resets the chance to respond to 5%.
      **/setchance** - Sets the chance to respond to a certain percentage.
      `
      )
      .setColor(`#11ffab`)
    await interaction.reply({ embeds: [embed] })
  }
})
//#endregion


//#region message event
client.on('messageCreate', async (message) => {
  if (message.author.bot) return

  if (replyMention(message, client) || replyChannelDefined(message) || getRandom(chanceToRespond)) {
    message.channel.sendTyping()
    // get rid of discord names and emojis
    let prompt = cleanText(message.content)

    let response = await getPrompt(prompt, 60)
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
