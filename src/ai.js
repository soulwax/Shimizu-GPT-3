require('dotenv').config({ path: __dirname + '../.env' })
const { cleanResultText } = require('./helper')
const got = require('got')
const VERBOSE = process.env.VERBOSE === 'true'

const myselfDefault = {
  id: parseInt(process.env.MY_ID),
  name: process.env.MY_NAME,
  key: process.env.OPENAI_API_KEY,
  intents: process.env.MY_INTENTS.split(','),
  verbose: process.env.VERBOSE === 'true' ? true : false,
  completionMode: process.env.COMPLETION_MODE === 'true' ? true : false,
  rawMode: process.env.RAW_MODE === 'true' ? true : false,
  chanceToRespond: parseFloat(process.env.CHANCE_TO_RESPOND),
  model: process.env.AI_MODEL,
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE),
  tokens: parseInt(process.env.MY_MAX_TOKENS),
  top_p: parseFloat(process.env.TOP_P),
  frequency_penalty: parseFloat(process.env.FREQUENCY_PENALTY),
  presence_penalty: parseFloat(process.env.PRESENCE_PENALTY),
  stop: process.env.MY_STOP.split(','),
  premise: process.env.MY_PREMISE,
  whiteList: process.env.WHITELIST.split(','),
  blackList: process.env.BLACKLIST.split(',')
}

/**
 * A function that generates an AI response to a prompt by generating a RESTful API call to OpenAI
 * At this point, the function uses the 'davinci' engine.
 * @param {String} prompt The prompt is a String that represents user input
 * for the openAI engine to understand, interpret and generate a response.
 * A typical prompt looks like this: "Human: What is your name?"
 * @param {Object} guild An Object that contains openAI credentials,
 * identity in the form of a premise, tokens,
 * a verbose flag for debugging and the name of the AI.
 * The purpose of 'myself' is to summarise everything that the AI needs to know about herself to generate a response.
 * @returns {String} The response is a String that the openAI engine generated.
 * It is outputted as a reply to the user who posed the prompt.
 */

const getPrompt = async (inputText, guild, callerName, formattedHistory = '') => {
  const rawMode = guild.myself.rawMode
  const name = guild.myself.name
  const url = 'https://api.openai.com/v1/engines/davinci/completions'
  const intro = `${guild.myself.name} ${guild.premise}.`

  let fullPrompt = rawMode ? inputText : `${intro}\n\n${formattedHistory}${callerName}: ${inputText}\n${name}:`

  if (VERBOSE) {
    console.log(`Sending ${rawMode ? 'RAW' : 'full'} prompt...\n${fullPrompt}`)
  }

  // For now, the API call uses myselfDefault parameters.
  const params = {
    prompt: fullPrompt,
    temperature: myselfDefault.temperature,
    max_tokens: myselfDefault.tokens,
    top_p: myselfDefault.top_p,
    frequency_penalty: myselfDefault.frequency_penalty,
    presence_penalty: myselfDefault.presence_penalty,
    stop: [`${callerName}:`, `${name}:`, '\n\n', 'You:']
  }

  const headers = {
    Authorization: `Bearer ${myselfDefault.key}`
  }

  try {
    const response = await got.post(url, { json: params, headers: headers }).json()
    const output = `${response.choices[0].text}`
    const cleanedResultText = cleanResultText(output)

    if (VERBOSE) {
      console.log(`Cleaned Response:\n${cleanedResultText}`)
    }

    return rawMode ? output : cleanedResultText
  } catch (err) {
    console.log(err)
  }
}

module.exports = { getPrompt, myselfDefault }
