/**
 * Returns a schema for the Guild model
 * @param {Object} mongoose
 * @returns {Object} the Server Guild class
 */
module.exports = (mongoose) => {
  const guildSchema = new mongoose.Schema({
    myself:{
      model: String,
      prompt: String,
      temperature: Number,
      max_tokens: Number,
      top_p: Number,
      frequency_penalty: Number,
      presence_penalty: Number,
      stop: [String],
      
    },
    guild: {
      type: Object,
      id: {
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
    },
    members: [
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
    ],
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
