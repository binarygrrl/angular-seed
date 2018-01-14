'use strict'

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

exports.autoDpSchema = autoDbSchema;