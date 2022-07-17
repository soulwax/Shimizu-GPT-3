# Shimizu-GPT-3

  ![Badge for GitHub repo top language](https://img.shields.io/github/languages/top/soulwax/Shimizu-GPT-3?style=flat&logo=appveyor) ![Badge for GitHub last commit](https://img.shields.io/github/last-commit/soulwax/Shimizu-GPT-3?style=flat&logo=appveyor)
  [![](https://dcbadge.vercel.app/api/server/bjWkUsDchk?style=flat)](https://discord.gg/bjWkUsDchk)


  ## Rules for collaboration:
  - Provide documentation for functions and classes.
  - If possible provide unit testing
  - If possible provide integration testing
  - Pull requests are welcome!

  
  ## Description 
  
  *The what, why, and how:* 
  
  A discord bot using GPT-3 for different purposes.

  ## Table of Contents
  * [Installation](#installation)
  * [Usage](#usage)
  * [Contributing](#contributing)
  * [License](#license)
  
  ## Installation
  
  *Steps required to install project and how to get the development environment running:*
  
  1. Create an .env file inside the project root from .env-example and fill in the fields. 
  2. Execute using npm run debug for debugging (nodemon required) or execute npm run pm2 for production (pm2 required). You can also use old fashioned node to start the app.js.
  
  ## Usage 
  
  *Instructions and examples for use:*
  
  Invite the bot into your guild and type /help for a list of commands.
  Following commands have been implemented thus far:
  - /help: Lists all commands.
  - /ping: Returns a pong with ms response time.
  - /status: Returns the current status of global variables like chance to respond and completion mode.
  - /shutup: Reduces chance to respond to 0
  - /speak: Sets the chance to respond randomly to 5%
  - /reset: Resets the chance to respond to 5%
  - /toggleCompletion: Toggles whether she should see your text as complete or not. If not, she will try to complete your text herself, then respond.
  - /speakup: Increases the chance to respond randomly by 5%
  - /speakdown: Reduces the chance to respond randomly by 5%
  - /setchance <value in %>: Sets the chance to the set value in %. 

  
  ## Contributing
  
  *If you would like to contribute it, you can follow these guidelines for how to do so.*
  
  I'll be thankful for any contributions on how to fine tune the api requests.
  For that, take a look inside the ai.js file.
  
  ## License
  
  Boost Software License 1.0
  
  ---
  
  ## Questions?

  <img src="https://i.imgur.com/sP8zuGr.png" alt="soulwax" width="40%" />
  
  For any questions, please contact me with the information below:
 
  GitHub: [@soulwax](https://api.github.com/users/soulwax)
  Discord: [Soulwax#5358](https://discord.gg/)
  Discord Server: [@madtec.org discord](https://discord.gg/bjWkUsDchk)
  