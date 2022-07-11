
require('dotenv').config()
const VERBOSE = process.env.VERBOSE
const { cleanResultText } = require('./helper')
const got = require('got')

const botName = 'Shimizu'
const botAttributes = 'friendly and conservative Japanese woman in her early twenties living and studying in Tokyo'
const botAdditionalAttributes = 'nerdy and very knowledgeable about songs, literature, science, metaphysics and philosophy.'
//const premiseJPFemale = 'Shimizu is a lively female japanese teenager living in Tokyo who is very knowledgeable about many things, especially song lyrics and literature'
// ... add more premises
const premises = [botName, botAttributes, botAdditionalAttributes]


const getPrompt = async (prompt, maxTokens) => {
  const url = 'https://api.openai.com/v1/engines/davinci/completions'
  const params = {
    prompt: `${botName} is a ${botAttributes} who is ${botAdditionalAttributes}:\n\n${prompt}`,
    temperature: 0.6,
    max_tokens: maxTokens,
    top_p: 0.3,
    frequency_penalty: 0.5,
    presence_penalty: 0.0,
    stop: 'Human:'
  }
  const headers = {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
  }

  try {
    const response = await got.post(url, { json: params, headers: headers }).json()
    output = `${response.choices[0].text}`
    if(VERBOSE) console.log(`Response: ${output}`)
    const cleanedResultText = cleanResultText(output)
    if(VERBOSE) console.log(`Cleaned Response: ${cleanedResultText}`)
    return cleanedResultText
  } catch (err) {
    console.log(err)
  }
}

module.exports = { getPrompt }