require('dotenv').config()

const VERBOSE = process.env.VERBOSE === 'true' ? true : false

/*
 * First pattern: /\<@[^>]*>/g
 * 
 * \<@: This matches the literal characters <@.
 * [^>]: This defines a negated character set. Any single character that is NOT the > character will match.
 * *: This indicates that the preceding pattern element should match zero or more times.
 * >: This matches the literal > character.
 * /g: This is a regex flag indicating "global" search, which means the pattern will be applied multiple times throughout the input string.
 * The first pattern will match any text enclosed in <@...> where ... can be any sequence of characters except >.
 * 
 * replacement: ''
 * 
 * The matched pattern will be replaced with an empty string, effectively removing any occurrences of <@...> from the input string.
 * 
 * Second pattern: /\<#[^>]*>/g
 * 
 * The pattern is similar to the first one, but it looks for the literal characters <# instead of <@. It matches any text enclosed in <#...>.
 * 
 * replacement: ''
 * 
 * The matched pattern will be replaced with an empty string, effectively removing any occurrences of <#...> from the input string.
 * 
 * Third pattern: /\<@![^>]*>/g
 * 
 * The pattern is similar to the first one, but it looks for the literal characters <@! instead of <@. It matches any text enclosed in <@!...>.
 * 
 * replacement: ''
 * 
 * The matched pattern will be replaced with an empty string, effectively removing any occurrences of <@!...> from the input string.
 * 
 * Fourth pattern: /\<:[^>]*>/g
 * 
 * The pattern is similar to the first one, but it looks for the literal characters <: instead of <@. It matches any text enclosed in <:...>.
 * 
 * replacement: ''
 * 
 * The matched pattern will be replaced with an empty string, effectively removing any occurrences of <:...> from the input string.
 * 
 * Fifth pattern: /\s+/g
 * 
 * \s: This represents any whitespace character (spaces, tabs, etc.).
 * +: This indicates that the preceding pattern element should match one or more times.
 * /g: This is a regex flag indicating "global" search, which means the pattern will be applied multiple times throughout the input string.
 * The fifth pattern will match any sequence of one or more whitespace characters.
 * 
 * replacement: ' '
 * 
 * The matched pattern will be replaced with a single space character, effectively replacing multiple consecutive whitespace characters with a single space in the input string.
 * 
 * These regex patterns can be used to clean up text input, for example, by removing certain types of markup or formatting and normalizing whitespace.
 */
const promptReplacements = [
  { pattern: /<@[^>]*>/g, replacement: '' },
  { pattern: /<#[^>]*>/g, replacement: '' },
  { pattern: /<@![^>]*>/g, replacement: '' },
  { pattern: /<:[^>]*>/g, replacement: '' },
  { pattern: /\s+/g, replacement: ' ' }
]

/*
 * 1. First pattern: /^[\n\s]+/
 *
 * ^: This asserts the position at the start of the line.
 * [...]: This defines a character set. Any single character from the set will match.
 * \n: This represents a newline character.
 * \s: This represents any whitespace character (spaces, tabs, etc.).
 * +: This indicates that the preceding pattern element should match one or more times.
 * The first pattern will match any sequence of one or more whitespace characters (spaces, tabs, etc.) and/or newline characters at the beginning of a string.
 * 
 * replacement: ''
 * 
 * The matched pattern will be replaced with an empty string, effectively removing any leading whitespace and/or newline characters from the input string.
 * 
 * 2. Second pattern: /^[^a-zA-Z]/
 * 
 * ^: This asserts the position at the start of the line.
 * [^...]: This defines a negated character set. Any single character that is NOT in the set will match.
 * a-zA-Z: This represents the range of all lowercase (a-z) and uppercase (A-Z) English alphabet characters.
 * The second pattern will match any single character at the beginning of a string that is not an English alphabet letter (uppercase or lowercase).
 * 
 * replacement: ''
 * 
 * The matched pattern will be replaced with an empty string, effectively removing any non-alphabetic character at the beginning of the input string.
 * 
 * These regex patterns can be used, for example, to clean up text input by removing unnecessary whitespace and ensuring that the input starts with an English alphabet letter.
 */
const resultReplacements = [
  { pattern: /^[\n\s]+/, replacement: '' },
  { pattern: /^[^a-zA-Z]/, replacement: '' }
]

/*
 * Takes a number between 0 and 1 and returns if Math.random() is less than number
 * @param {number} chance between 0 and 1
 * @returns {Boolean}
 */

const getRandom = (chance) => {
  const result = Math.random() < chance
  if (VERBOSE && result) console.log(`Responded due to Chance: ${chance}`)
  return result
}

/*
 * Function returns true if the message contains a mention
 * @param {String} message a String containing the message
 * @param {object} client a discord.js client
 * @returns {Boolean}
 */

const replyMention = (message, client) => {
  let name = client.user.username.toLowerCase()
  let result = message.content.toLowerCase().includes(name) || message.content.includes(client.user.id)
  if (VERBOSE && result) console.log(`Responded due to mention: ${message.mentions.users.size}`)
  return result
}

/* 
 * Function returns true if the message was sent in a whitelisted channel
 * @param {String} message the message String
 * @param {Array} whitelist an Array of channel ids
 * @returns {Boolean}
 */

const isChannelWhitelisted = (message, whitelist) => {
  const channelWhitelisted = whitelist.includes(message.channel.id)
  if (channelWhitelisted && VERBOSE) console.log(`Responded due to channel whitelist: ${message.channel.id}`)
  return channelWhitelisted
}

/* 
 * Function returns true if the message was sent in a blacklisted channel
 * @param {String} message the message String
 * @param {Array} blacklist an Array of blacklisted channel ids
 * @returns {Boolean} Boolean value
 */

const isChannelBlacklisted = (message, blacklist) => {
  return blacklist.includes(message.channel.id)
}

/*
 * Function that cleans the text and adds punctuation (a period)
 * Step two consists of cleaning the text and getting rid of discord names, emojis and unnecessary whitespaces.
 * @param {String} text the given text to clean or modify
 * @param {Boolean} completionMode set to true if you don't want to add random punctuation at the end of the text
 * @returns {String} the cleaned and/or modified text
 */
const addPeriodIfNecessary = (text, completionMode) => {
  const lastChar = text.slice(-1)
  const isLastCharLetterOrNumber = lastChar.match(/[a-zA-Z0-9]/)
  const isLastCharPunctuation = lastChar.match(/[.,;:!?]/)

  if (!completionMode && !isLastCharPunctuation && isLastCharLetterOrNumber) {
    return text + '.'
  }

  return text
}

/*
 * Function that cleans the text and adds punctuation (a period)
 * Step two consists of cleaning the text and getting rid of discord names, emojis and unnecessary whitespaces.
 * @param {String} text the given text to clean or modify
 * @param {Boolean} completionMode set to true if you don't want to add random punctuation at the end of the text
 * @returns {String} the cleaned and/or modified text
 * @example
 */
const cleanText = (text, completionMode) => {
  let result = text

  result = addPeriodIfNecessary(result, completionMode)

  result = promptReplacements.reduce((acc, { pattern, replacement }) => acc.replace(pattern, replacement), result)

  return result.trim()
}

/*
 * Function that cleanses the output of a typical openAI response
 * Things that get cleaned up:
 * Newlines, whitespaces, punctuation at the start and anything that is concluded by a colon
 * @param {String} text input text to clean
 * @returns {String} cleaned text
 */
const cleanResultText = (text) => {
  return resultReplacements.reduce((acc, { pattern, replacement }) => acc.replace(pattern, replacement), text).trim()
}

module.exports = { getRandom, replyMention, isChannelWhitelisted, isChannelBlacklisted, cleanText, cleanResultText }
