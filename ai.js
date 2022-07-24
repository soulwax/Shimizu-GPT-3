require('dotenv').config({ path: __dirname + '/.env' })
const { cleanResultText } = require('./helper')
const got = require('got')

// Sarcastic bot example:
// prompt: """Marv is a chatbot that reluctantly answers questions with sarcastic responses:\n\n
//            You: How many pounds are in a kilogram?\n
//            Marv: This again? There are 2.2 pounds in a kilogram.
//                  Please make a note of this.\n
//            You: What does HTML stand for?\n
//            Marv: Was Google too busy? Hypertext Markup Language.
//                  The T is for try to ask better questions in the future.\n
//            You: When did the first airplane fly?\n
//            Marv: On December 17, 1903, Wilbur and Orville Wright made the first flights.
//                  I wish they’d come and take me away.\n
//            You: What is the meaning of life?\n
//            Marv: I’m not sure. I’ll ask my friend Google.\n
//            You: What time is it?\nMarv:",
//

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
    // primer: "Human: Hello Shimizu!"
    //         "Shimizu: Hello! What an awesome day!"
    // message: "You: What is your name?"
    // "Shimizu: " ... AI generated response!
    fullPrompt = `${intro}\n\n${message}\n${myself.name}:`
  } else if (rawMode) {
    fullPrompt = prompt
  }
  if (myself.verbose) {
    console.log(`Sending ${rawMode ? 'RAW' : 'full'} prompt...\n${fullPrompt}`)
  }
  
  const params = {
    prompt: fullPrompt,
    temperature: 0.7,
    max_tokens: parseInt(myself.tokens),
    top_p: 0.4,
    frequency_penalty: 0.5,
    presence_penalty: 0.0,
    stop: `${callerName}:`
  }

  const headers = {
    Authorization: `Bearer ${myself.key}`
  }

  try {
    const response = await got.post(url, { json: params, headers: headers }).json()
    output = `${response.choices[0].text}`
    // if (myself.verbose) {
    //   console.log(` ####### RES OBJECT ####### \n\t ${JSON.stringify(response, null, 2)}`)
    //   console.log(`### END OBJECT ###`)
    //   console.log(` ####### Response ####### \n ${output}`)
    //   console.log(` ####### End Response ####### \n`)
    // }
    const cleanedResultText = cleanResultText(output)
    if (myself.verbose) {
      console.log(`Cleaned Response:\n${cleanedResultText}`)
    }
    return cleanedResultText
  } catch (err) {
    console.log(err)
  }
}

/**
 * EXPERIMENTAL CACHING (GOES INTO DATABASE SOON)
 */
// cache last ten prompts and responses
const cache = {
  lastTenPrompts: [],
  lastTenResponses: []
}

/**
 * EXPERIMENTAL CACHING (GOES INTO DATABASE SOON)
 */
const getResponseCached = async (prompt, myself, callerName) => {
  if (cache.lastTenPrompts.includes(prompt)) {
    const index = cache.lastTenPrompts.indexOf(prompt)
    return cache.lastTenResponses[index]
  }
  const response = await getPrompt(prompt, myself, callerName)
  cache.lastTenPrompts.push(prompt)
  cache.lastTenResponses.push(response)
  if (cache.lastTenPrompts.length > 10) {
    cache.lastTenPrompts.shift()
    cache.lastTenResponses.shift()
  }
  return response
}

module.exports = { getPrompt }
