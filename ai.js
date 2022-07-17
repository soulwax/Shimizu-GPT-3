
require('dotenv').config({ path: __dirname + '/.env' })
const { cleanResultText } = require('./helper')
const got = require('got')


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

const getPrompt = async (prompt, myself) => {
  const url = 'https://api.openai.com/v1/engines/davinci/completions'
  const params = {
    prompt: `${myself.name} ${myself.premise}\n\n${prompt}\n${myself.name}`, /*history aus der datenbank*/
    temperature: 0.7,
    max_tokens: parseInt(myself.tokens),
    top_p: 0.3,
    frequency_penalty: 0.5,
    presence_penalty: 0.0,
    stop: 'Human:'
  }

  const headers = {
    Authorization: `Bearer ${myself.key}`
  }

  try {
    const response = await got.post(url, { json: params, headers: headers }).json()
    console.dir(response)
    output = `${response.choices[0].text}`
    if(myself.verbose) console.log(`Response: ${output}`)
    const cleanedResultText = cleanResultText(output)
    if (myself.verbose) console.log(`Cleaned Response: ${cleanedResultText}`)
    return cleanedResultText
  } catch (err) {
    console.log(err)
  }
}

module.exports = { getPrompt }