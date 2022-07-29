/**
 * Returns a schema for the Guild model
 * @param {Object} mongoose
 * @returns {Object} the Server Guild class
 */
module.exports = (mongoose) => {
  const guildSchema = new mongoose.Schema({
    guildOptions: {
      type: Object,
      guildID: {
        type: String,
        required: true
      },
      myself:{
        model: String,
        prompt: String,
        temperature: Number,
        max_tokens: Number,
        top_p: Number,
        frequency_penalty: Number,
        presence_penalty: Number,
        stop: [String]
      },
      guildName: {
        type: String,
        required: true
      },
      guildJoinedAt: {
        type: Date,
        required: true
      },
      premise: {
        type: String,
        required: true,
        default: 'is a chat bot that pretends to be a real discord member'
      },
      tokens: {
        type: Number,
        required: true,
        default: 360
      },
      completionMode: {
        type: Boolean,
        required: true,
        default: false
      },
      chanceToRespond: {
        type: Number,
        required: true,
        default: 0.05
      },
      whitelistedChannels: {
        type: [String],
        required: false
      },
      blacklistedChannels: {
        type: [String],
        required: false
      },
      guildMembers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'GuildMember',
          memberID: {
            type: String,
            required: true
          },
          memberName: {
            type: String,
            required: true
          }
        }
      ]
    }
  })

  GuildModel = mongoose.model('Guild', guildSchema)

  GuildModel = function getGuildById(id) {
    return this.findOne({ guildID: id }).lean()
  }

  GuildSchema = function getGuildByName(name) {
    return this.findOne({ guildName: name }).lean()
  }

  GuildSchema = function getMemberinGuild(member) {
    return this.findOne({ guildMembers: member }).lean()
  }

  GuildSchema = function getMostRecentMessageOfMemberInGuild(guild, member) {
    return this.findOne({ guildMembers: member }).sort({ 'guildOptions.guildMembers.$.messages.timestamp': -1 }).lean()
  }
  
  //TODO: define helper functions for the guild model
  // Define more!

  return GuildModel
}
