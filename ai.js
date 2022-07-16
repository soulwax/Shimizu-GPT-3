
require('dotenv').config({ path: __dirname + '/.env' })
const { cleanResultText } = require('./helper')
const got = require('got')


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