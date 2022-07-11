require('dotenv').config()
const VERBOSE = process.env.VERBOSE
// add as many channels manually as you want
const ALLOWED_CHANNELS_WLIST = [
  process.env.ALLOWED_CHANNEL_0,
  process.env.ALLOWED_CHANNEL_1,
  process.env.ALLOWED_CHANNEL_2
]
const BLACKLIST = [
  process.env.BLACKLIST_0,
  process.env.BLACKLIST_1,
  process.env.BLACKLIST_2,
  process.env.BLACKLIST_3,
  process.env.BLACKLIST_4,
  process.env.BLACKLIST_5,
  process.env.BLACKLIST_6,
  process.env.BLACKLIST_7,
  process.env.BLACKLIST_8,
  process.env.BLACKLIST_9
]

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
  let result = ALLOWED_CHANNELS_WLIST.includes(message.channel.id) && !BLACKLIST.includes(message.channel.id)
  if (VERBOSE && result) console.log(`Responded due to channel defined: ${message.channel.name}`)
  return result
}

const cleanText = (text, completionMode) => {
  // find out if prompt ends with a letter or number:
  let result = text
  const lastChar = result.slice(-1)
  const isLastCharLetter = lastChar.match(/[a-zA-Z]/)
  const isLastCharNumber = lastChar.match(/[0-9]/)
  const isLastCharPunctuation = lastChar.match(/[.,;:!?]/)

  // if last character is a letter or number, add a period
  if (!completionMode && !isLastCharPunctuation && (isLastCharLetter || isLastCharNumber)) {
    // add a random punctuation
    if (getRandom(0.2)) {
      result += '.'
    } else if (getRandom(0.4)) {
      result += '!'
    } else if (getRandom(0.6)) {
      result += '?'
    } else if (getRandom(0.8)) {
      result += ':'
    } else {
      result += '...'
    }
  }

  return (
    result
      //clean up discord names and emojis
      .replace(/<@[^>]*>/g, '') // removes discord name tag (id)
      .replace(/<#[^>]*>/g, '')
      .replace(/<@![^>]*>/g, '')
      .replace(/<:[^>]*>/g, '')
      // remove unncessary spaces
      .replace(/\s+/g, ' ')
      // return text
      .trim()
  )
}

// make her seem more human and reduce some weird artifacts of responses
const cleanResultText = (text) => {
  return (
    text
      //clean up 'Shimizu:' prefix
      .replace(/Shimizu: /g, '')
      // remove new line at the very beginning
      .replace(/^\n/, '')
      //clean up punctuation at the start of the sentence
      .replace(/^[^a-zA-Z]/, '')
      // cleanup 'cleverbot' occurrences
      .replace(/\s*cleverbot\s*/gi, '')
      // cleanup 'bot' occurrences
      .replace(/\s*bot\s*/gi, '')
      // cleanup 'A.I.' occurrences
      .replace(/\s*A\.I\.\s*/gi, '')
      // cleanup 'computer' occurrences
      .replace(/\s*Computer:\s*/gi, '')
      // return text
      .trim()
  )
}

module.exports = { getRandom, replyMention, replyChannelDefined, cleanText, cleanResultText }
