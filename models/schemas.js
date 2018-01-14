var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Old Schema Models
const lineupSchema = require('./lineup');
const dpSchema = require("./dataPoint");
const autoDpSchema = require("./autoDataPoint");
const statDpSchema = require("./statDataPoint");
const teamSchema = require("./team");

/* const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    team: { type: String, required: true },
    type: String,
    authorized: { type: Boolean, required: true },
    role: String,
    features: {
        lineups: {
            type: Boolean,
            default: true,
        },
        combinations: {
            type: Boolean,
            default: true,
        },
        players: {
            type: Boolean,
            default: true,
        },
        filmAssistant: {
            type: Boolean,
            default: true,
        },
        diamond: {
            type: Boolean,
            default: true,
        },
        shotChart: {
            type: Boolean,
            default: true,
        },
        shotChartDataEntry: {
            type: Boolean,
            default: true,
        },
        manualDataEntry: {
            type: Boolean,
            default: false,
        },
    },
    email: String,
});
    // methods ======================
    // generating a hash
    userSchema.methods.generateHash = function(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };

    // checking if password is valid
    userSchema.methods.validPassword = function(password) {
        return bcrypt.compareSync(password, this.password);
    }; 
*/

/* var lineupSchema = new Schema({
    name_key: { type: String, required: true, unique: true },
    Players: [String],
    Time_total: { type: Number, required: true },
    Points_total: { type: Number, required: true },
    TwoPtMakes_total: { type: Number, required: true },
    TwoPtMisses_total: { type: Number, required: true },
    ThreePtMakes_total: { type: Number, required: true },
    ThreePtMisses_total: { type: Number, required: true },
    FTMakes_total: { type: Number, required: true },
    FTMisses_total: { type: Number, required: true },
    Assists_total: { type: Number, required: true },
    DRebs_total: { type: Number, required: true },
    ORebs_total: { type: Number, required: true },
    Turnovers_total: { type: Number, required: true },
    OppPoints_total: { type: Number, required: true }
}); */

/**
 * Lineup IDS Validator
 * @param  {[type]} players [description]
 * @return {[type]}         [description]
 */
/* var lineupIDValidate = function(players) {
    return players.split("|").length === 5;
}; */

/**
 * TEAMS Schema
 * @type {Schema}
 */
/* var teamSchema = new Schema({
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

//Schema creation for Data Points
var dpSchema = new Schema({
    selectedGame: String,
    selectedPeriod: String,
    timeStartMin: Number,
    timeStartSec: Number,
    timeStopMin: Number,
    timeStopSec: Number,

    isTotalPoint: Boolean,
    name: String,
    playerNames: [String], //Only for  TOTALS datapoint
    Points: Number,
    oppPoints: Number,

    TwoPtMakes: Number,
    TwoPtMisses: Number,
    ThreePtMakes: Number,
    ThreePtMisses: Number,
    FTMakes: Number,
    FTMisses: Number,

    Assists: Number,
    DRebs: Number,
    ORebs: Number,
    Turnovers: Number
});

var statDpSchema = new Schema({
    location: {
        x: Number,
        y: Number
    },
    time: {
        min: Number,
        sec: Number
    },
    score: {
        home: Number,
        away: Number
    },
    types: [String]
});

var autoDpSchema = new Schema({
    selectedGame: String,
    selectedPeriod: String,
    timeStartMin: Number,
    timeStartSec: Number,
    timeStopMin: Number,
    timeStopSec: Number,
    oppPoints: Number,
    name: String,
    Points: Number,
    playerNames: [String],
    TwoPtMakes: [statDpSchema],
    TwoPtMisses: [statDpSchema],
    ThreePtMakes: [statDpSchema],
    ThreePtMisses: [statDpSchema],
    FTMakes: [statDpSchema],
    FTMisses: [statDpSchema],
    Assists: [statDpSchema],
    DRebs: [statDpSchema],
    ORebs: [statDpSchema],
    Turnovers: [statDpSchema],
    Fouls: [statDpSchema],
    Poss: [statDpSchema],
    Steals: [statDpSchema],
    Blocks: [statDpSchema],
    Timeouts: [statDpSchema],
    Enters: [statDpSchema],
    Exits: [statDpSchema],
    DBRebounds: [statDpSchema]
});

var emailSchema = new Schema({
    Email: String,
    name: String,
    body: String
}); */
/* 
    exports.userSchema = userSchema;
    exports.dpSchema = dpSchema;
    exports.autoDpSchema = autoDpSchema;
    exports.statDpSchema = statDpSchema;
    exports.teamSchema = teamSchema;
    exports.lineupsSchema = lineupSchema;
    exports.emailSchema = emailSchema; */