const VERBOSE = process.env.VERBOSE
// add as many channels manually as you want
// this is messy because dotenv doesn't allow arrays 
// ? Switch to config.json?

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

const isChannelWhitelisted = (message, whitelist) => {
  const channelWhitelisted = whitelist.includes(message.channel.id)
  if (channelWhitelisted && VERBOSE) console.log(`Responded due to channel whitelist: ${message.channel.id}`)
  return channelWhitelisted
}

const isChannelBlacklisted = (message, blacklist) => {
  return blacklist.includes(message.channel.id)
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
      .replace(/\s*cleverbot:\s*/gi, '')
      // cleanup 'bot' occurrences
      .replace(/\s*bot:\s*/gi, '')
      // cleanup 'A.I.' occurrences
      .replace(/\s*A\.I\.\s*/gi, '')
      // cleanup 'computer' occurrences
      .replace(/\s*Computer:\s*/gi, '')
      // return text
      .trim()
  )
}

module.exports = { getRandom, replyMention, isChannelWhitelisted, isChannelBlacklisted, cleanText, cleanResultText }
