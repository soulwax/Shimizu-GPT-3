
require('dotenv').config()
const got = require('got')

const getPrompt = async (prompt, maxTokens) => {
  const url = 'https://api.openai.com/v1/engines/davinci/completions'
  const params = {
    prompt: prompt,
    temperature: 0,
    max_tokens: maxTokens,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0
  }
  const headers = {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
  }

  try {
    const response = await got.post(url, { json: params, headers: headers }).json()
    output = `${response.choices[0].text}`
    return output
  } catch (err) {
    console.log(err)
  }
}

module.exports = { getPrompt }