'use strict';

var lineupSchema = new Schema({
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
});
/**
 * Lineup IDS Validator
 * @param  {[type]} players [description]
 * @return {[type]}         [description]
 */
var lineupIDValidate = function(players) {
    return players.split("|").length === 5;
};

exports.lineupSchema = lineup;