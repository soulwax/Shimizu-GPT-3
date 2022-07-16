const VERBOSE = process.env.VERBOSE

/**
 * Takes a number between 0 and 1 and returns if Math.random() is less than number
 * @param {number} chance between 0 and 1 
 * @returns {boolean}
 */

const getRandom = (chance) => {
  const result = Math.random() < chance
  if (VERBOSE && result) console.log(`Responded due to Chance: ${chance}`)
  return result
}

/**
 * Function returns true if the message contains a mention
 * @param {string} message a string containing the message
 * @param {object} client a discord.js client
 * @returns {boolean}
 */


const replyMention = (message, client) => {
  let name = client.user.username.toLowerCase()
  let result = message.content.toLowerCase().includes(name) || message.content.includes(client.user.id)
  if (VERBOSE && result) console.log(`Responded due to mention: ${message.mentions.users.size}`)
  return result
}

/**Function returns true if the message was sent in a whitelisted channel
 * @param {string} message the message string
 * @param {array} whitelist an array of channel ids 
 * @returns {boolean}
 */

const isChannelWhitelisted = (message, whitelist) => {
  const channelWhitelisted = whitelist.includes(message.channel.id)
  if (channelWhitelisted && VERBOSE) console.log(`Responded due to channel whitelist: ${message.channel.id}`)
  return channelWhitelisted
}

/**Function returns true if the message was sent in a blacklisted channel
 * @param {string} message the message string
 * @param {array} blacklist an array of blacklisted channel ids 
 * @returns {boolean} boolean value
 */

const isChannelBlacklisted = (message, blacklist) => {
  return blacklist.includes(message.channel.id)
}

/**
 * Function that cleans the text and adds punctuation (a period)
 * Step two consists of cleaning the text and getting rid of discord names, emojis and unnecessary whitespaces.
 * @param {string} text the given text to clean or modify
 * @param {boolean} completionMode set to true if you don't want to add random punctuation at the end of the text 
 * @returns {string} the cleaned and/or modified text
 */

const cleanText = (text, completionMode) => {
  // find out if prompt ends with a letter or number:
  let result = text
  const lastChar = result.slice(-1)
  const isLastCharLetter = lastChar.match(/[a-zA-Z]/)
  const isLastCharNumber = lastChar.match(/[0-9]/)
  const isLastCharPunctuation = lastChar.match(/[.,;:!?]/)

  // if last character is a letter or number, add a period
  if (!completionMode && !isLastCharPunctuation && (isLastCharLetter || isLastCharNumber)) {
    result += '.'
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

/**
 * Function that cleanses the output of a typical openAI response
 * Things that get cleaned up: 
 * Newlines, whitespaces, punctuation at the start and anything that is concluded by a colon
 * @param {string} text input text to clean
 * @returns {string} cleaned text
 */
const cleanResultText = (text) => {
  return (
    text
      // remove new line at the very beginning
      .replace(/^\n/, '')
      //clean up punctuation at the start of the sentence
      .replace(/^[^a-zA-Z]/, '')
      //clean up any whitespace at the beginning of the sentence and remove it
      .replace(/^\s+/, '')
      //clean up anything until ':'
      .replace(/.+?(?=:)/, '')
      // return text
      .trim()
  )
}

module.exports = { getRandom, replyMention, isChannelWhitelisted, isChannelBlacklisted, cleanText, cleanResultText }
