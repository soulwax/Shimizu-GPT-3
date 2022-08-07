require('dotenv').config({ path: __dirname + '/.env' })
const { cleanResultText } = require('./helper')
const got = require('got')


const myselfDefault = {
  id: parseInt(process.env.MY_ID),
  name: process.env.MY_NAME,
  key: process.env.OPENAI_API_KEY,
  intents: process.env.MY_INTENTS.split(','),
  verbose: process.env.VERBOSE === 'true' ? true : false,
  options: {
    completionMode: process.env.COMPLETION_MODE === 'true' ? true : false,
    rawMode: process.env.RAW_MODE === 'true' ? true : false,
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
  whiteList: process.env.WHITELIST.split(','),
  blackList: process.env.BLACKLIST.split(',')
}

/**
 * A function that generates an AI response to a prompt by generating a RESTful API call to OpenAI
 * At this point, the function uses the 'davinci' engine.
 * @param {String} prompt The prompt is a String that represents user input
 * for the openAI engine to understand, interpret and generate a response.
 * A typical prompt looks like this: "Human: What is your name?"
 * @param {Object} myself An Object that contains openAI credentials,
 * identity in the form of a premise, tokens,
 * a verbose flag for debugging and the name of the AI.
 * The purpose of 'myself' is to summarise everything that the AI needs to know about herself to generate a response.
 * @returns {String} The response is a String that the openAI engine generated.
 * It is outputted as a reply to the user who posed the prompt.
 */

const getPrompt = async (prompt, myself, callerName) => {
  
  const rawMode = myself.options.rawMode
  const url = 'https://api.openai.com/v1/engines/davinci/completions'
  const intro = `${myself.name} ${myself.premise}.`
  //const primer = `${callerName}: Hello ${myself.name}!\n${myself.name}: Hello! What an awesome day!`
  const message = `${callerName}: ${prompt}`
  let fullPrompt = ''
  if (!rawMode) {
    // The full prompt has the following structure as an example:
    // intro:  "Shimizu is a chatbot who does things."
    // (optional) primer: "Human: Hello Shimizu!"
    //         "Shimizu: Hello! What an awesome day!"
    // message: "You: What is your name?"
    // "Shimizu: " ... AI generated response!
    fullPrompt = `${intro}\n\n${message}\n${myself.name}:`
  } else if (rawMode) {
    fullPrompt = prompt
  }
  if (myself.verbose) {
    console.log(`Sending ${rawMode ? 'RAW' : 'full'} prompt...\n${fullPrompt} `)
  }
  
  const params = {
    prompt: fullPrompt,
    temperature: myself.options.openai.temperature,
    max_tokens: myself.options.openai.tokens,
    top_p: myself.options.openai.top_p,
    frequency_penalty: myself.options.openai.frequency_penalty,
    presence_penalty: myself.options.openai.presence_penalty,
    stop: [`${callerName}:`, `${myself.name}:`, '\n\n', 'You:']
  }

  const headers = {
    Authorization: `Bearer ${myself.key}`
  }

  try {
    const response = await got.post(url, { json: params, headers: headers }).json()
    output = `${response.choices[0].text}`
    const cleanedResultText = cleanResultText(output)
    if (myself.verbose) {
      console.log(`Cleaned Response:\n${cleanedResultText}`)
    }
    if(rawMode) return output
    else return cleanedResultText
  } catch (err) {
    console.log(err)
  }
}

module.exports = { getPrompt, myselfDefault }
