module.exports = (mongoose) => {
    const myselfSchema = new mongoose.Schema({
        myId: {
            type: Number,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        apiKey: {
            type: String,
            required: true
        },
        intents: {
            type: [String],
            required: true
        },
        verbose: {
            type: Boolean,
            required: true
        },
        completionMode: {
            type: Boolean,
            required: true
        },
        rawMode: {
            type: Boolean,
            required: true
        },
        chanceToRespond: {
            type: Number,
            required: true
        },
        model: {
            type: String,
            default: 'text-davinci-002'
        },
        temperature: {
            type: Number,
            min: 0,
            max: 1,
            required: true,
            default: 0.5
        },
        tokens: {
            type: Number,
            min: 0,
            max: 2000,
            required: true,
            default: 360
        },
        top_p: {
            type: Number,
            min: 0,
            max: 1,
            required: true,
            default: 0.95
        },
        frequency_penalty: {
            type: Number,
            min: 0,
            max: 1,
            required: true,
            default: 0.0
        },
        presence_penalty: {
            type: Number,
            min: 0,
            max: 1,
            required: true,
            default: 0.0
        },
        stop: {
            type: [String],
            required: true,
            default: ['Shimizu', '\n']
        },
        premise: {
            type: String,
            required: true,
            default: 'I am a robot.'
        },
        whiteList: {
            type: [String],
            required: true
        },
        blackList: {
            type: [String],
            required: true
        },
        image: {
            type: [Binary_Data],
        }
    });
    return mongoose.model('Myself', myselfSchema);
}