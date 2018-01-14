'use-strict'

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

exports.dbSchema = dbSchema;