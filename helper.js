require('dotenv').config()
const VERBOSE = process.env.VERBOSE
// add as many channels manually as you want
const ALLOWED_CHANNELS_WLIST = [process.env.ALLOWED_CHANNEL_0, process.env.ALLOWED_CHANNEL_1]

const getRandom = (chance) => {
  const result = Math.random() < chance
  if (VERBOSE && result) console.log(`Responded due to Chance: ${chance}`)
  return result
}

const replyMention = (message, client) => {
  let name = client.user.username.toLowerCase()
  let result = message.content.toLowerCase().includes(name) || message.content.includes(client.user.id)
  if (VERBOSE && result) console.log(`Responded due to mention: ${message.mentions.users.size}`)
  return result
}

const replyChannelDefined = (message) => {
  /* TODO: implement guild specific channel + make option to allow more 
    than one channel for independent 100% discussion with bot
  */
  // is the current channel in the allowed list?
  let result = ALLOWED_CHANNELS_WLIST.includes(message.channel.id)
  if (VERBOSE && result) console.log(`Responded due to channel defined: ${message.channel.name}`)
  return result
}

const cleanText = (text) => {
  return (
    text
      //clean up discord names and emojis
      .replace(/<@[^>]*>/g, '') // removes discord name tag (id)
      .replace(/<#[^>]*>/g, '')
      .replace(/<@![^>]*>/g, '')
      .replace(/<:[^>]*>/g, '')
  )
}

module.exports = { getRandom, replyMention, replyChannelDefined, cleanText }
