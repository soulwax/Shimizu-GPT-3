
require('dotenv').config()
const got = require('got')
const premiseJPFemale = 'Shimizu is a lively female japanese teenager living in Tokyo who is very knowledgeable about many things, especially song lyrics and literature'
// ... add more premises
const premises = []


const getPrompt = async (prompt, maxTokens) => {
  const url = 'https://api.openai.com/v1/engines/davinci/completions'
  const params = {
    prompt: `${premiseJPFemale}:\n\n${prompt}`,
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
    return output.replace(/Shimizu: /g, '')
  } catch (err) {
    console.log(err)
  }
}

module.exports = { getPrompt }