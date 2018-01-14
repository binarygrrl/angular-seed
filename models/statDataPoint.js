'use strict'

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

exports.statDbSchema = statDbSchema;