/**
 * Returns a schema for the Guild model
 * @param {Object} mongoose
 * @returns {Object} the Server Guild class
 */
module.exports = (mongoose) => {
  const guildSchema = new mongoose.Schema({
    guildId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    joinedAt: {
      type: Date,
      required: true
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
    premise: {
      type: String,
      required: true,
      default: 'is a chat bot that pretends to be a real discord member'
    },
    whitelistedChannels: {
      type: [String],
      required: false
    },
    blacklistedChannels: {
      type: [String],
      required: false
    },
    myself: {
      myId: {type: Number, required: true},
      name: {type: String, required: true},
      model: {type: String, default: 'text-davinci-002'},
      apiKey: {type: String, required: true},
      temperature: {type: Number, min: 0, max: 1, required: true, default: 0.5},
      top_p: {type: Number, min: 0, max: 1, required: true, default: 0.95},
      frequency_penalty: {type: Number, min: 0, max: 1, required: true, default: 0.0},
      presence_penalty: {type: Number, min: 0, max: 1, required: true, default: 0.0},
      stop: {type: [String], required: true, default: ['Shimizu', '\n']}
    }
    // methods: {
    //   getGuildByID(id) {
    //     return this.model('Guild').findOne({ id: id })
    //   },
    //   getGuildIDByName(name) {
    //     return this.model('Guild').findOne({ name: name })
    //   },
    //   getGuildByName(name) {
    //     return this.model('Guild').findOne({ name: name })
    //   },
    //   getMemberInGuild(memberID) {
    //     return this.guildMembers.find(member => member.memberID === memberID)
    //   },
    //   getMostRecentMessageOfMemberInGuild(guild, member) {
    //     return this.model('Message').findOne({
    //       guild: guild,
    //       member: member
    //     }).sort({
    //       createdAt: -1
    //     })
    //   }
    // }
  })

  const Guild = mongoose.model('Guild', guildSchema)

  
  return mongoose.model('Guild', guildSchema)
}
