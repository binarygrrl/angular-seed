'use-strict'

/**
 * TEAMS Schema
 * @type {Schema}
 */

var teamSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    type: String,
    shot_charts: Boolean,
    year: String,
    season: {
        type: String,
        required: false,
        validate: {
            validator: seasonStr => {
                return /[0-9]{2}\/[0-9]{2}/.test(seasonStr);
            },
            message: '{VALUE} is not valid season (YY/YY)'
        }
    },
    players: {
        type: [String],
        default: [],
    },
    games: {
        type: [String],
        default: [],
    },
    lineupKeys: [String],
    teamId: {
        league: String,
        conference: String,
        division: String,
    },
    manualSettings: {
        periodsCount: Number,
        periodLength: Number,
    },
    logo: Buffer,
});

exports.teamSchema = teamSchema;