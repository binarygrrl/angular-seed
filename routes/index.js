'use-strict'

//Data Scraper - Updated
var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');

var dataModels = require('../database/database.js');
const dic = require('./partials/dictionary.js');
//var getGameStats = require('../scraper/final/getGameStats.js');

var gameSchemas = require('../database/models/gameSchema.js');

var GameSchema = gameSchemas.GameSchema;
var StatSchema = gameSchemas.StatSchema;
var SegmentSchema = gameSchemas.SegmentSchema;

var AutoDataSchema = dataModels.AutoDataSchema;
var DataSchema = dataModels.DataSchema;
var StatDataSchema = dataModels.StatDataModel;

var ourTeam = 2;
var ourTeamName = '';
var topDatas = [];
var errors = [];
var team_players = [];
var reg_ex_players = {};
var oppScore = 0;
var oppScores = [];
var errorBase = {
    'description': '',
    'time': {},
    'segment': 0
};
var teama = 0;

let female = false;

let genderConditions = {};

if (female) {
    genderConditions = {
        min: 10
    }
} else {
    genderConditions = {
        min: 20
    }
}

router.post('/scrape', function(req, res) {
    errors = [];
    topDatas = [];
    ourTeamName = req.body.team_name;
    team_players = req.body.players;
    for (var i = 0; i < req.body.players.length; i++) {
        reg_ex_players[format_database_name(req.body.players[i])] = req.body.players[i];
    }
    getGameStats(req.body.url, req.body.team, req.body.game, res, getSegments, get_topDatas, send);
});

router.post('/scrape_women', function(req, res) {
    female = true;
    errors = [];
    topDatas = [];
    ourTeamName = req.body.team_name;
    team_players = req.body.players;
    for (var i = 0; i < req.body.players.length; i++) {
        reg_ex_players[format_database_name(req.body.players[i])] = req.body.players[i];
    }
    getGameStats(req.body.url, req.body.team, req.body.game, res, getSegments, get_topDatas, send);

    //getGameStatsWomen(req.body.url, req.body.team, req.body.game, res, getSegments_women, get_topDatas_women, send);
});

function format_database_name(name) {
    name = name.trim();
    //Split first because ", " is the delimeter
    var split_names = name.split(", ");
    split_names[0] = split_names[0].replace(/[^a-zA-Z]/g, "").toLowerCase();
    split_names[1] = split_names[1].replace(/[^a-zA-Z]/g, "").toLowerCase();
    return split_names[0] + split_names[1];
}

function format_scrape_name(name) {
    console.log('Name: ' + name);
    if (!name) { console.log('No Name'); return; }
    //Split first because ", " is the delimeter
    name = name.trim();
    var split_names = name.split(",");
    split_names[0] = split_names[0].replace(/[^a-zA-Z]/g, "").toLowerCase();
    split_names[1] = split_names[1].replace(/[^a-zA-Z]/g, "").toLowerCase();
    return split_names[0] + split_names[1];
}

function send(res) {
    console.log("errors:" + errors);
    res.send({
        'teamName': ourTeamName,
        'datas': topDatas,
        'errors': errors
    });
}

function getGameStats(url, team, game, res, callback1, callback2, callback3) {
    teama = team;
    console.log("getGameStats");
    var gameStats = {
        game: "",
        stats: []
    };

    request(url, function(err, resp, body) {
        console.log("getGameStats.request");
        if (err) {
            console.log("Error in getGameStats");
            throw err;
        }

        $ = cheerio.load(body);
        var count = 0;
        var period = 1;

        $(".mytable tr").each(function() {
            gameStats.game = game;
            if (count > 3) {
                //all data starts here
                var r = $(this)
                    .text()
                    .split("\n");
                if (
                    female &&
                    (r[1].indexOf("End of 1st") > -1 ||
                        r[1].indexOf("End of 2nd") > -1 ||
                        r[1].indexOf("End of 3rd") > -1 ||
                        r[1].indexOf("End of 4th") > -1 ||
                        (r[1].indexOf("End of") > -1 &&
                            r[1].indexOf("OT") > -1 &&
                            period == 3))
                ) {
                    console.log("End of XXX");
                    period++;
                    gameStats.stats.push("period_end");
                    oppScores.push(oppScore);
                } else if (!female && r[1].indexOf("End of 1st Half") > -1) {
                    console.log("End of Half");
                    period++;
                    gameStats.stats.push("period_end");
                    oppScores.push(oppScore);
                } else if (
                    female &&
                    r[1].indexOf("End of") > -1 &&
                    r[1].indexOf("OT") > -1
                ) {
                    console.log("end OT");
                    period++;
                    gameStats.stats.push("ot_start_end");
                    oppScores.push(oppScore);
                    console.log(oppScore);
                } else if (!female &&
                    (r[1].indexOf("End of 2nd Half") > -1 ||
                        r[1].indexOf("End of OT") > -1 ||
                        (r[1].indexOf("End of") > -1 && r[1].indexOf("OT") > -1))
                ) {
                    period++;
                    gameStats.stats.push("ot_start_end");
                    oppScores.push(oppScore);
                } else if (r[team] == "\t   ") {
                    var score_ind = r[3].indexOf("-");
                    //grab opponent score
                    if (team == 4) {
                        //home
                        oppScore = parseInt(r[3].substr(2, score_ind - 2).trim()); //away score
                    } else {
                        oppScore = parseInt(r[3].substr(score_ind + 1).trim()); //home score
                    }
                } else if (r[team] != "\t   ") {
                    //var player_ind = r[2].indexOf(" ", 4);
                    var score_ind = r[3].indexOf("-");
                    //grab opponent score
                    var a = r[team];
                    var aa = a.split(/[a-z0-9]/);
                    var player_ind = aa[0].length;

                    var time_ind = r[1].indexOf(":");
                    var playr = r[team].substr(4, player_ind - 5).trim();
                    var play = "";
                    if (playr != "TEAM") {
                        console.log("Getting player");
                        play = reg_ex_players[format_scrape_name(playr)];
                    } else {
                        play = "TEAM";
                        //begin check for new weird case need to find if the next word is "for"
                        if (aa[2].indexOf(" CU:") >= 0) {
                            //contained in here
                            players = true;
                            stat2 = "Exits";
                        }
                    }
                    if (play == null) {
                        console.log("Player not in database error");
                        console.log("play: " + playr);
                        var error = JSON.parse(JSON.stringify(errorBase));
                        error.description =
                            "Player ( " + playr + " ) does not match player in database";
                        error.time = {
                            min: parseInt(r[1].substr(2, time_ind - 2).trim()),
                            sec: parseInt(r[1].substr(time_ind + 1).trim()),
                            period: period
                        };
                        error.segment = -1;
                        console.log(error);
                        errors.push(error);
                        play = playr;
                    }

                    var stat = {
                        player: play,
                        stat: r[team] //assuming team is away right now
                            .substr(player_ind - 1)
                            .trim(),
                        stat2: dic[r[team].substr(player_ind - 1).trim()],
                        type: dic[r[team].substr(player_ind - 1).trim()],
                        time: {
                            min: parseInt(r[1].substr(2, time_ind - 2).trim()),
                            sec: parseInt(r[1].substr(time_ind + 1).trim())
                        },
                        period: period,
                        score: {
                            away: parseInt(r[3].substr(2, score_ind - 2).trim()),
                            home: parseInt(r[3].substr(score_ind + 1).trim())
                        },
                        loc: { x: -1, y: -1 },
                        //Only Female
                        players: female === true ? players : null
                    };
                    console.log("~~~~~~~~~~~~~");
                    console.log(stat);
                    console.log("~~~~~~~~~~~~~");

                    //This gives each piece of data in the scrape

                    if (stat.stat2 == undefined) {
                        console.log("Error Stat Undefined");
                        console.log("player: " + stat.player);
                        console.log("stat: " + stat.stat);
                        console.log("stat2: " + stat.stat2);
                        var error = JSON.parse(JSON.stringify(errorBase));
                        error.description = "Stat (" + stat.stat + ") never seen before!";
                        error.time = {
                            min: parseInt(r[1].substr(2, time_ind - 2).trim()),
                            sec: parseInt(r[1].substr(time_ind + 1).trim()),
                            period: period
                        };
                        error.segment = -1;
                        errors.push(error);
                    }
                    gameStats.stats.push(stat);
                }
            }
            count++;
        });
        console.log("oppScore");
        console.log(oppScore);
        //View All Times Recorded in Console
        /* for (var k in gameStats.stats) {
                console.log("~~~~~~time~~~~~~~~~");
                console.log(gameStats.stats[k].time);
            } */
        //console.log(gameStats);

        console.log("oppScores");
        console.log(oppScores);

        callback2(callback1(gameStats));
        callback3(res);
    });
}
/* function getGameStats(url, team, game, res, callback1, callback2, callback3) {
    teama = team;
    console.log("getGameStats");
    var gameStats = {
        'game': "",
        'stats': []
    };

    request(url, function(err, resp, body) {
        console.log("getGameStats.request");
        if (err) {
            console.log("Error in getGameStats");
            throw err;
        }

        $ = cheerio.load(body);
        var count = 0;
        var period = 1;

        $('.mytable tr').each(function() {
            //console.log('inside table: ', count);
            gameStats.game = game;

            //let output = 'raw scraper row: ' + $(this).text();
            //console.log(output);

            //THIS.TEXT CONTAINS THE RAW LINE/STAT
            //console.log($(this).text());

            if (count > 3) {
                //all data starts here
                var r = $(this).text().split('\n');
                if (r[1].indexOf('End of 1st Half') > -1) {
                    console.log("End of Half");
                    period++;
                    gameStats.stats.push("period_end");
                    oppScores.push(oppScore);
                } else if (r[1].indexOf('End of 2nd Half') > -1 || r[1].indexOf('End of OT') > -1 || (r[1].indexOf('End of') > -1 && r[1].indexOf('OT') > -1)) {
                    period++;
                    gameStats.stats.push("ot_start_end");
                    oppScores.push(oppScore);
                } else if (r[1].indexOf('Time') > -1) {
                    //TODO: Remove unused condition
                } else if (r[team] == '\t   ') {
                    //console.log()
                    var score_ind = r[3].indexOf('-');
                    //grab opponent score
                    if (team == 4) { //home
                        oppScore = parseInt(r[3].substr(2, score_ind - 2).trim()); //away score
                    } else {
                        oppScore = parseInt(r[3].substr(score_ind + 1).trim()); //home score
                    }
                } else if (r[team] != '\t   ') {
                    var player_ind = r[2].indexOf(' ', 4);
                    var score_ind = r[3].indexOf('-');
                    //grab opponent score
                    var a = r[team];
                    var aa = a.split(/[a-z0-9]/);
                    var player_ind = aa[0].length;

                    var time_ind = r[1].indexOf(':');
                    var playr = r[team].substr(4, player_ind - 5).trim();
                    var play = '';
                    if (playr != "TEAM") {
                        console.log("Getting player");
                        play = reg_ex_players[format_scrape_name(playr)];
                    } else {
                        play = 'TEAM';
                        //begin check for new weird case need to find if the next word is "for"
                        //a is array of the line based on team
                        //console.log("Here is a: ");
                        //console.log(a);
                        //return;
                    }
                    if (play == null) {
                        console.log("Player not in database error");
                        console.log("play: " + playr);
                        var error = JSON.parse(JSON.stringify(errorBase));
                        error.description = 'Player ( ' + playr + ' ) does not match player in database';
                        error.time = {
                            'min': parseInt(r[1].substr(2, time_ind - 2).trim()),
                            'sec': parseInt(r[1].substr(time_ind + 1).trim()),
                            'period': period
                        };
                        error.segment = -1;
                        console.log(error);
                        errors.push(error);
                        play = playr;
                    }

                    var stat = {
                        'player': play, //assuming team is away right now
                        'stat': r[team].substr(player_ind - 1).trim(),
                        'stat2': dic[r[team].substr(player_ind - 1).trim()],
                        'type': dic[r[team].substr(player_ind - 1).trim()],
                        'time': {
                            'min': parseInt(r[1].substr(2, time_ind - 2).trim()),
                            'sec': parseInt(r[1].substr(time_ind + 1).trim())
                        },
                        'period': period,
                        'score': {
                            'away': parseInt(r[3].substr(2, score_ind - 2).trim()),
                            'home': parseInt(r[3].substr(score_ind + 1).trim())
                        },
                        'loc': {
                            'x': -1,
                            'y': -1
                        }
                    };
                    console.log("~~~~~~~~~~~~~");
                    console.log(stat);
                    console.log("~~~~~~~~~~~~~");

                    //This gives each piece of data in the scrape


                    if (stat.stat2 == undefined) {
                        console.log('Error Stat Undefined');
                        console.log("player: " + stat.player);
                        console.log("stat: " + stat.stat);
                        console.log("stat2: " + stat.stat2);
                        var error = JSON.parse(JSON.stringify(errorBase));
                        error.description = 'Stat (' + stat.stat + ') never seen before!';
                        error.time = {
                            'min': parseInt(r[1].substr(2, time_ind - 2).trim()),
                            'sec': parseInt(r[1].substr(time_ind + 1).trim()),
                            'period': period
                        };
                        error.segment = -1;
                        errors.push(error);
                    }
                    gameStats.stats.push(stat);
                }
            }
            count++;
        });
        console.log("oppScore");
        console.log(oppScore);
        //View All Times Recorded in Console
        /* for (var k in gameStats.stats) {
            console.log("~~~~~~time~~~~~~~~~");
            console.log(gameStats.stats[k].time);
        } */
/*
        //console.log(gameStats);

        console.log("oppScores");
        console.log(oppScores);

        callback2(callback1(gameStats));
        callback3(res);
    });
}
 */

//Contains Gender Neutral Code

function getSegments(gameStats) {
    console.log("getSegments");
    var segments = {
        'game': gameStats.game,
        'segs': []
    };

    var timeStart = {
        'min': genderConditions.min,
        'sec': 0
    };

    var stats = [];
    var enters = [];
    var exits = [];
    var others = [];
    var entered = false;
    var poss = 0;
    var players = [];
    var exitedPlayers = [];
    var enteredPlayers = [];
    var i = 0;

    //Only For Female Teams
    var weirdplayerstat = false;

    while (i < gameStats.stats.length) {
        enters = [];
        enteredPlayers = [];
        exitedPlayers = [];
        exits = [];
        others = [];
        entered = false;

        //Only For Female Teams
        weirdplayerstat = false;

        //loop through time
        var time = gameStats.stats[i].time;
        var freeThrow = false;
        var shot = false;

        while (i < gameStats.stats.length && gameStats.stats[i] != "period_end" && gameStats.stats[i] != "ot_start_end" && JSON.stringify(gameStats.stats[i].time) === JSON.stringify(time)) {
            if (players.indexOf(gameStats.stats[i].player) < 0) {
                players.push(gameStats.stats[i].player);
            }
            if (female && gameStats.stats[i].players) {
                weirdplayerstat = true;
            }
            if (gameStats.stats[i].stat2 == "Enters") {
                enters.push(i);
                entered = true;
                enteredPlayers.push(gameStats.stats[i].player);
            } else if (gameStats.stats[i].stat2 == "Exits") {
                exitedPlayers.push(gameStats.stats[i].player);
                if (female) { entered = true; }
                exits.push(i);
            } else {
                others.push(i);
            }

            //possessions!
            var stat2 = gameStats.stats[i].stat2;
            if (!freeThrow && (stat2 == "FTMakes" || stat2 == "FTMisses")) {
                poss++;
                freeThrow = true;
            }
            if (stat2 == "TwoPtMakes" || stat2 == "TwoPtMisses" || stat2 == "ThreePtMakes" || stat2 == "ThreePtMisses") {
                shot = true;
            }
            if (stat2 == "TwoPtMakes" || stat2 == "TwoPtMisses" || stat2 == "ThreePtMakes" || stat2 == "ThreePtMisses" || stat2 == "Turnovers") {
                poss++;
            } else if (stat2 == "ORebs") {
                poss--;
            }
            //end possessions
            i++;
        }
        //possesions
        if (shot && freeThrow) {
            poss--;
        }
        //end possessions

        //if someone entered during this time segment, pack away current lineup
        //else, just add all the stats



        if (entered || gameStats.stats[i] == "period_end" || gameStats.stats[i] == "ot_start_end" || (female && weirdplayerstat)) {
            //push enters and exits last so they are the last thing in a segment
            //move to end so first thing in next segment????
            for (var j = 0; j < others.length; j++) {
                console.log(gameStats.stats[others[j]]);
                //if the player exited this time frame, append their stats to the last segment
                //this is because they did things then left
                if (enteredPlayers.indexOf(gameStats.stats[others[j]].player) < 0) {
                    //player exited game - need to include stats
                    console.log("pushing this stat to stats: ");
                    console.log(gameStats.stats[others[j]]);
                    stats.push(gameStats.stats[others[j]]);
                }
            }

            if (enters.length != exits.length) {
                console.log("error in exit enters");
                var error = JSON.parse(JSON.stringify(errorBase));
                error.description = "Exits ( " + exits.length + " ) do not match entrance ( " + enters.length + " )";
                error.segment = -1;
                error.time = {
                    min: gameStats.stats[i - 1].time.min,
                    sec: gameStats.stats[i - 1].time.sec,
                    period: gameStats.stats[i - 1].period
                };

                console.log(error);
                errors.push(error);
                console.log("~~~~~~");
            }

            //pack away stats
            var seg = {
                stats: stats,
                time: {
                    timeStart: timeStart,
                    timeStop: gameStats.stats[i - 1].time,
                    selectedPeriod: gameStats.stats[i - 1].period,
                    poss: poss
                },
                score: gameStats.stats[i - 1].score
            };
            segments.segs.push(seg);

            console.log("Segment");
            console.log(seg);

            //reset
            timeStart = gameStats.stats[i - 1].time;
            poss = 0;
            stats = [];

            //append enters and exits
            for (var j = 0; j < enters.length; j++) {
                stats.push(gameStats.stats[enters[j]]);
            }
            for (var j = 0; j < exits.length; j++) {
                stats.push(gameStats.stats[exits[j]]);
            }
            for (var j = 0; j < others.length; j++) {
                //if the player entered this time frame, append their stats to this new segment
                //this is because they should not have done anything yet
                if (enteredPlayers.indexOf(gameStats.stats[others[j]].player) >= 0) {
                    //if player entered, include down here
                    stats.push(gameStats.stats[others[j]]);
                }
            }
        } else {
            //if no one entered, just append all the others stats
            for (var j = 0; j < others.length; j++) {
                stats.push(gameStats.stats[others[j]]);
            }
        }
        if (gameStats.stats[i] === 'period_end') {
            console.log("?????");
            console.log(gameStats.stats[i - 1]);
            console.log(gameStats.stats[i]);
            console.log(gameStats.stats[i + 1]);

            console.log("~~~~period end~~~~");
            console.log(segments.segs.length);
            console.log(segments.segs[segments.segs.length - 1]);
            console.log("~~~~~~~~~~");
            segments.segs[segments.segs.length - 1].time.timeStop.min = 0;
            segments.segs[segments.segs.length - 1].time.timeStop.sec = 0;
            i++;
            timeStart = {
                'min': genderConditions.min,
                'sec': 0
            };
        } else if (gameStats.stats[i] === 'ot_start_end') {
            console.log("?????");
            console.log(gameStats.stats[i - 1]);
            console.log(gameStats.stats[i]);
            console.log(gameStats.stats[i + 1]);
            console.log("~~~~ot_start_end~~~~");
            console.log(segments.segs.length);
            console.log(segments.segs[segments.segs.length - 1]);
            console.log("qqqqTIMESTOPMINqqqq");
            console.log(segments.segs[segments.segs.length - 1].time.timeStart.min);
            console.log(segments.segs[segments.segs.length - 1].time.timeStop.min);
            console.log("~~~~~~~~~~");
            segments.segs[segments.segs.length - 1].time.timeStop.min = 0;
            segments.segs[segments.segs.length - 1].time.timeStop.sec = 0;
            i++;
            timeStart = {
                'min': 5,
                'sec': 0
            };
        }

        //enters = [];
        //enteredPlayers = [];
        //exitedPlayers = [];
        //exits = [];
        //others = [];
        //entered = false;
    }
    /* 
        console.log("\n\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        for (var k = 0; k < segments.segs.length; k++) {
            console.log(segments.segs[k]);
        }
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n\n"); */
    return segments;
}

//Contains Gender Neutral Code
function get_topDatas(segments) {
    console.log("get_topDatas");

    var datas = {};

    //Only Male!
    var oldDatas = {};
    var oldDataBase = {};

    if (!female) {
        oldDataBase = {
            selectedGame: segments.game,
            selectedPeriod: "",
            timeStartMin: 0,
            timeStartSec: 0,
            timeStopMin: 0,
            timeStopSec: 0,
            oppPoints: 0,
            name: "",
            Points: 0,
            TwoPtMakes: 0,
            TwoPtMisses: 0,
            ThreePtMakes: 0,
            ThreePtMisses: 0,
            FTMakes: 0,
            FTMisses: 0,
            Assists: 0,
            DRebs: 0,
            ORebs: 0,
            Turnovers: 0,
            playerNames: []
        };
    }

    var statBase = {
        location: {
            x: -1,
            y: -1
        },
        time: {
            min: 0,
            sec: 0
        },
        score: {
            home: 0,
            away: 0
        },
        type: []
    };

    var dataBase = {
        selectedGame: segments.game,
        selectedPeriod: "",
        timeStartMin: 0,
        timeStartSec: 0,
        timeStopMin: 0,
        timeStopSec: 0,
        oppPoints: 0,
        name: "",
        Points: 0,
        playerNames: [],

        TwoPtMakes: [],
        TwoPtMisses: [],
        ThreePtMakes: [],
        ThreePtMisses: [],
        FTMakes: [],
        FTMisses: [],
        Assists: [],
        DRebs: [],
        ORebs: [],
        Turnovers: [],
        Fouls: [],
        Poss: [],
        Steals: [],
        Blocks: [],
        Timeouts: [],
        Enters: [],
        Exits: [],
        DBRebounds: []
    };

    var players = [];
    var oppScoreCounter = 0;
    //    players.push("TEAM");
    for (var i = 0; i < segments.segs.length; i++) {
        //set up data shared between players in a single time period
        var seg = segments.segs[i];
        var oldDataTP = JSON.parse(JSON.stringify(oldDataBase));
        var dataTP = JSON.parse(JSON.stringify(dataBase)); //makes copy of template data
        dataTP["selectedPeriod"] = "P" + seg.time.selectedPeriod;
        dataTP["timeStartMin"] = seg.time.timeStart.min;
        dataTP["timeStartSec"] = seg.time.timeStart.sec;
        dataTP["timeStopMin"] = seg.time.timeStop.min;
        dataTP["timeStopSec"] = seg.time.timeStop.sec;
        //throw in logic for end of half scores

        console.log("seg-");
        console.log(seg);

        if (seg.time.timeStop.min == 0 && seg.time.timeStop.sec == 0) {
            //if its the end of a period, put the opponents score to the actual final score from oppScores
            console.log(oppScores[oppScoreCounter]);
            if (teama == 2) {
                //away
                dataTP["oppPoints"] =
                    oppScores[oppScoreCounter] - seg.stats[0].score.home;
            } else {
                dataTP["oppPoints"] =
                    oppScores[oppScoreCounter] - seg.stats[0].score.away;
            }
            oppScoreCounter++;
        } else {
            if (i == 0) {
                if (teama == 2) {
                    //away
                    dataTP["oppPoints"] = segments.segs[i].score.home; //difference between last stat and first
                } else {
                    //segments.segs[i-1].score.home //seg.stats[0].score.away
                    dataTP["oppPoints"] = segments.segs[i].score.away; //difference between last stat and first
                }
            } else {
                if (teama == 2) {
                    //away
                    dataTP["oppPoints"] =
                        segments.segs[i].score.home - segments.segs[i - 1].score.home; //difference between last stat and first
                } else {
                    //segments.segs[i-1].score.home //seg.stats[0].score.away
                    dataTP["oppPoints"] =
                        segments.segs[i].score.away - segments.segs[i - 1].score.away; //difference between last stat and first
                }
            }
        }

        dataTP["possessions"] = seg.time.poss;

        if (
            seg.time.timeStart.min == 20 ||
            (seg.time.selectedPeriod >= 3 && seg.time.timeStart.min == 5)
        ) {
            //CHANGE eventually
            //next half - all new players
            players = [];
            players.push("TEAM");
        }
        for (var j = 0; j < players.length; j++) {
            datas[players[j]] = JSON.parse(JSON.stringify(dataTP));
            datas[players[j]]["name"] = players[j];
            if (!female) {
                //old data
                oldDatas[players[j]] = JSON.parse(JSON.stringify(oldDataTP));
                oldDatas[players[j]]["name"] = players[j];
            }
        }

        for (var j = 0; j < segments.segs[i].stats.length; j++) {
            var stat = segments.segs[i].stats[j];
            if (players.indexOf(stat.player) < 0 && stat.player != "") {
                //player not already in players
                players.push(stat.player);
                //set up base info about player in this time segment
                datas[stat.player] = JSON.parse(JSON.stringify(dataTP));
                datas[stat.player]["name"] = stat.player;
                if (!female) {
                    //old data
                    oldDatas[stat.player] = JSON.parse(JSON.stringify(dataTP));
                    oldDatas[stat.player]["name"] = stat.player;
                }
            }
            if (stat.stat2 == "Exits") {
                players.splice(players.indexOf(stat.player), 1); //removes player from players
                delete datas[stat.player]; //removes player's object from datas
                //old datas
                if (!female) {
                    delete oldDatas[stat.player]; //removes player's object from datas
                }
            } else {
                //for each stat - parse statBase and add it to the list for that stat
                //datas[stat.player][stat.stat2] --> this is a list!
                var newStat = JSON.parse(JSON.stringify(statBase));
                newStat.location = stat.loc;
                newStat.time = stat.time;
                newStat.score = stat.score;

                datas[stat.player][stat.stat2].push(newStat); //adds a new empty stat to this category

                if (stat.stat2 == "FTMakes") {
                    datas[stat.player]["Points"] += 1;
                    if (!female) {
                        oldDatas[stat.player]["Points"] += 1;
                    }
                } else if (stat.stat2 == "TwoPtMakes") {
                    datas[stat.player]["Points"] += 2;
                    if (!female) {
                        oldDatas[stat.player]["Points"] += 2;
                    }
                } else if (stat.stat2 == "ThreePtMakes") {
                    datas[stat.player]["Points"] += 3;
                    if (!female) {
                        oldDatas[stat.player]["Points"] += 2;
                    }
                }
            }
        }

        if (Object.keys(datas).length != 6) {
            console.log("error found!");
            var error = JSON.parse(JSON.stringify(errorBase));
            error.description =
                "Invalid number of players: " + Object.keys(datas).length;
            error.time = seg.time;
            error.segment = i;
            console.log(error);
            errors.push(error);
            console.log("~~~~~~");
        }

        topDatas.push({ segment: i, datas: datas });
        datas = {};
    }

    if (errors) {
        console.log("errors:" + errors);
    }

    oppScore = 0;
    oppScores = [];
    return topDatas;
}

//womens functions - yay repeated code
//integrate into same functions as men when men is rewritten

function getGameStatsWomen(url, team, game, res, callback1, callback2, callback3) {
    teama = team;
    console.log("getGameStats");
    var gameStats = {
        'game': "",
        'stats': []
    };

    request(url, function(err, resp, body) {
        //        console.log(body0);
        console.log("inside request");


        if (err) {
            console.log("errrrorrr");
            throw err;
        }

        $ = cheerio.load(body);
        var count = 0;
        var period = 1;
        var stat2 = null;

        $('.mytable tr').each(function() {
            stat2 = null;
            var players = false;
            gameStats.game = game;
            if (count == 0) {
                //nothing
            } else if (count == 1) {
                //away total
            } else if (count == 2) {
                //home total
            } else if (count == 3) {
                //gameStats.game = away + " @ " + home;
            } else {
                //all data starts here
                var r = $(this).text().split('\n');
                console.log(r);
                if (r[1].indexOf('End of 1st') > -1 || r[1].indexOf('End of 2nd') > -1 || r[1].indexOf('End of 3rd') > -1 || r[1].indexOf('End of 4th') > -1 || (r[1].indexOf('End of') > -1 && r[1].indexOf('OT') > -1 && period == 3)) {
                    console.log("End of XXX");
                    period++;
                    gameStats.stats.push("period_end");
                    oppScores.push(oppScore);
                } else if (r[1].indexOf('End of') > -1 && r[1].indexOf('OT') > -1) {
                    console.log("end OT");
                    period++;
                    gameStats.stats.push("ot_start_end");
                    oppScores.push(oppScore);
                    console.log(oppScore);
                } else if (r[1] == '\t   Time') {
                    //
                } else if (r[team] == '\t   ') {
                    //console.log()
                    var score_ind = r[3].indexOf('-');
                    //grab opponent score
                    if (team == 4) { //home
                        oppScore = parseInt(r[3].substr(2, score_ind - 2).trim()); //away score
                    } else {
                        oppScore = parseInt(r[3].substr(score_ind + 1).trim()); //home score
                    }
                } else if (r[team] != '\t   ') {
                    //                var player_ind = r[2].indexOf(' ', 4);
                    var score_ind = r[3].indexOf('-');
                    //grab opponent score

                    //                console.log(r[2].split(/[a-z]/));
                    var a = r[team];
                    console.log("here is a: ");
                    //console.log(a);
                    //                var b = r[4];
                    //                console.log('r[team]: ' + a);
                    //                console.log('r[4]: ' + b);
                    var aa = a.split(/[a-z0-9]/);
                    //console.log("aa");
                    //                var bb = b.split(/[a-z0-9]/);
                    //                console.log("aa: " + aa);
                    //                console.log("bb: " + bb);
                    var player_ind = aa[0].length;

                    var time_ind = r[1].indexOf(':');
                    //                console.log(r[team].substr(player_ind-1).trim());
                    var playr = r[team].substr(4, player_ind - 5).trim();
                    var play = '';
                    if (playr != "TEAM") {
                        play = reg_ex_players[format_scrape_name(playr)];
                    } else {
                        play = 'TEAM';
                        console.log(a);
                        console.log(playr);
                        console.log(aa);

                        if (aa[2].indexOf(" CU:") >= 0) { //contained in here
                            players = true;
                            stat2 = "Exits";

                        }
                    }
                    if (play == null) {
                        console.log("Player not in database error");
                        console.log("playr: " + playr);
                        var error = JSON.parse(JSON.stringify(errorBase));
                        error.description = 'Player ( ' + playr + ' ) does not match player in database';
                        error.time = {
                            'min': parseInt(r[1].substr(2, time_ind - 2).trim()),
                            'sec': parseInt(r[1].substr(time_ind + 1).trim()),
                            'period': period
                        };
                        error.segment = -1;
                        errors.push(error);
                        play = playr;
                    }
                    console.log("~~~~~~~~~~~~~");
                    console.log(play);
                    console.log("~~~~~~~~~~~~~");
                    var stat = {
                        'player': play, //assuming team is away right now
                        'stat': r[team].substr(player_ind - 1).trim(),
                        'stat2': dic[r[team].substr(player_ind - 1).trim()] || stat2,
                        'time': {
                            'min': parseInt(r[1].substr(2, time_ind - 2).trim()),
                            'sec': parseInt(r[1].substr(time_ind + 1).trim())
                        },
                        'period': period,
                        'score': {
                            'away': parseInt(r[3].substr(2, score_ind - 2).trim()),
                            'home': parseInt(r[3].substr(score_ind + 1).trim())
                        },
                        'loc': {
                            'x': -1,
                            'y': -1
                        },
                        players: players
                    };


                    if (stat.stat2 == undefined) {
                        var error = JSON.parse(JSON.stringify(errorBase));
                        error.description = 'Stat (' + stat.stat + ') never seen before!';
                        error.time = {
                            'min': parseInt(r[1].substr(2, time_ind - 2).trim()),
                            'sec': parseInt(r[1].substr(time_ind + 1).trim()),
                            'period': period
                        };
                        error.segment = -1;
                        errors.push(error);
                    }
                    gameStats.stats.push(stat);
                }
            }
            count++;
        });
        console.log("oppScore");
        console.log(oppScore);
        for (var k in gameStats.stats) {
            console.log("~~~~~~time~~~~~~~~~");
            console.log(gameStats.stats[k].time);
        }
        //console.log(gameStats);
        console.log("oppScores");
        console.log(oppScores);
        callback2(callback1(gameStats));
        callback3(res);
        //        console.log(tops);

        //        return gameStats;
    });

    //console.log(gameStats);
    //    return gameStats;
}

function getSegments_women(gameStats) {
    console.log("getSegments");
    var segments = {
        'game': gameStats.game,
        'segs': []
    };

    var timeStart = {
        'min': 10,
        'sec': 0
    };

    var stats = [];
    var enters = [];
    var exits = [];
    var others = [];
    var entered = false;
    var poss = 0;
    var players = [];
    var exitedPlayers = [];
    var enteredPlayers = [];
    var i = 0;
    var weirdplayerstat = false;
    while (i < gameStats.stats.length) {
        enters = [];
        enteredPlayers = [];
        exitedPlayers = [];
        exits = [];
        others = [];
        entered = false;
        weirdplayerstat = false;
        //        console.log(gameStats.stats[i]);
        //loop through time
        var time = gameStats.stats[i].time;
        var freeThrow = false;
        var shot = false;
        while (i < gameStats.stats.length && gameStats.stats[i] != "period_end" && gameStats.stats[i] != "ot_start_end" && JSON.stringify(gameStats.stats[i].time) === JSON.stringify(time)) {
            console.log("stat-");
            console.log(gameStats.stats[i]);
            if (players.indexOf(gameStats.stats[i].player) < 0) {
                //player not in players
                //report possible error
                //                var error = JSON.parse(JSON.stringify(errorBase));
                //                error.description = 'Player did something before entering game ( ' + gameStats.stats[i].player + ' )';
                //                error.segment = i;
                //                error.time = gameStats.stats[i].time;
                //                errors.push(error);
                players.push(gameStats.stats[i].player);
            }
            if (gameStats.stats[i].players) {
                weirdplayerstat = true;
                console.log("weirdplayerstat");
            }
            if (gameStats.stats[i].stat2 == "Enters") {
                enters.push(i);
                entered = true;
                enteredPlayers.push(gameStats.stats[i].player);
            } else if (gameStats.stats[i].stat2 == "Exits") {
                //                players.splice(players.indexOf(gameStats.stats[i].player), 1);
                exitedPlayers.push(gameStats.stats[i].player);
                entered = true;
                exits.push(i);
            } else {
                others.push(i);
                //                stats.push(gameStats.stats[i]);
            }

            //possessions!
            var stat2 = gameStats.stats[i].stat2;
            if (!freeThrow && (stat2 == "FTMakes" || stat2 == "FTMisses")) {
                poss++;
                freeThrow = true;
            }
            if (stat2 == "TwoPtMakes" || stat2 == "TwoPtMisses" || stat2 == "ThreePtMakes" || stat2 == "ThreePtMisses") {
                shot = true;
            }
            if (stat2 == "TwoPtMakes" || stat2 == "TwoPtMisses" || stat2 == "ThreePtMakes" || stat2 == "ThreePtMisses" || stat2 == "Turnovers") {
                poss++;
            } else if (stat2 == "ORebs") {
                poss--;
            }
            //end possessions
            i++;
        }
        //possesions
        if (shot && freeThrow) {
            poss--;
        }
        //end possessions

        //if someone entered during this time segment, pack away current lineup
        //else, just add all the stats
        //console.log("end-1");
        if (entered || gameStats.stats[i] == 'period_end' || gameStats.stats[i] == 'ot_start_end' || weirdplayerstat) {
            //push enters and exits last so they are the last thing in a segment
            //move to end so first thing in next segment????
            //            console.log("~~~~~");
            for (var j = 0; j < others.length; j++) {
                console.log(gameStats.stats[others[j]]);
                //if the player exited this time frame, append their stats to the last segment
                //this is because they did things then left
                if (enteredPlayers.indexOf(gameStats.stats[others[j]].player) < 0) { //player exited game - need to include stats
                    console.log("pushing this stat to stats: ");
                    console.log(gameStats.stats[others[j]]);
                    stats.push(gameStats.stats[others[j]]);
                }
            }

            if (enters.length != exits.length) {
                console.log("error in exit enters");
                var error = JSON.parse(JSON.stringify(errorBase));
                error.description = 'Exits ( ' + exits.length + ' ) do not match entrance ( ' + enters.length + ' )';
                error.segment = -1;
                error.time = {
                    'min': gameStats.stats[i - 1].time.min,
                    'sec': gameStats.stats[i - 1].time.sec,
                    'period': gameStats.stats[i - 1].period
                };
                //error.segment = segments.length;
                console.log(error);
                errors.push(error);
                console.log("~~~~~~");
            }
            console.log("packing away stat ayyyy");
            //pack away stats
            var seg = {
                'stats': stats,
                'time': {
                    'timeStart': timeStart,
                    'timeStop': gameStats.stats[i - 1].time,
                    'selectedPeriod': gameStats.stats[i - 1].period,
                    'poss': poss
                },
                'score': gameStats.stats[i - 1].score
            };
            segments.segs.push(seg);

            //reset

            timeStart = gameStats.stats[i - 1].time;
            poss = 0;
            stats = [];

            //append enters and exits
            for (var j = 0; j < enters.length; j++) {
                //                console.log(gameStats.stats[enters[j]]);
                stats.push(gameStats.stats[enters[j]]);
            }
            //            console.log("~~~~~");
            for (var j = 0; j < exits.length; j++) {
                stats.push(gameStats.stats[exits[j]]);
                //                console.log(gameStats.stats[exits[j]]);
            }
            for (var j = 0; j < others.length; j++) {
                //if the player entered this time frame, append their stats to this new segment
                //this is because they should not have done anything yet
                if (enteredPlayers.indexOf(gameStats.stats[others[j]].player) >= 0) { //if player entered, include down here
                    console.log("Pushed to the next lineup");
                    stats.push(gameStats.stats[others[j]]);
                }
            }
            //console.log("end0");
        } else {
            //if no one entered, just append all the others stats
            for (var j = 0; j < others.length; j++) {
                stats.push(gameStats.stats[others[j]]);
            }
            //console.log("end1");
        }
        if (gameStats.stats[i] === 'period_end') {
            console.log("?????");
            console.log(gameStats.stats[i - 1]);
            console.log(gameStats.stats[i]);
            console.log(gameStats.stats[i + 1]);

            console.log("~~~~period end~~~~");
            console.log(segments.segs.length);
            console.log(segments.segs[segments.segs.length - 1]);
            console.log("~~~~~~~~~~");
            segments.segs[segments.segs.length - 1].time.timeStop.min = 0;
            segments.segs[segments.segs.length - 1].time.timeStop.sec = 0;
            i++;
            timeStart = {
                'min': 10,
                'sec': 0
            };
        } else if (gameStats.stats[i] === 'ot_start_end') {
            console.log("?????");
            console.log(gameStats.stats[i - 1]);
            console.log(gameStats.stats[i]);
            console.log(gameStats.stats[i + 1]);
            console.log("~~~~ot_start_end~~~~");
            console.log(segments.segs.length);
            console.log(segments.segs[segments.segs.length - 1]);
            console.log("qqqqTIMESTOPMINqqqq");
            console.log(segments.segs[segments.segs.length - 1].time.timeStart.min);
            console.log(segments.segs[segments.segs.length - 1].time.timeStop.min);
            console.log("~~~~~~~~~~");
            segments.segs[segments.segs.length - 1].time.timeStop.min = 0;
            segments.segs[segments.segs.length - 1].time.timeStop.sec = 0;
            i++;
            timeStart = {
                'min': 5,
                'sec': 0
            };
        }

        //enters = [];
        //enteredPlayers = [];
        //exitedPlayers = [];
        //exits = [];
        //others = [];
        //entered = false;
    }

    console.log("\n\n\n\n\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    //for (var k=0; k<segments.segs.length; k++) {
    //    console.log(segments.segs[k]);
    //}
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n\n\n\n\n");
    return segments;
}

function get_topDatas_women(segments) {
    console.log("get_topDatas");

    var datas = {};

    var statBase = {
        "location": {
            "x": -1,
            "y": -1
        },
        "time": {
            "min": 0,
            "sec": 0
        },
        "score": {
            "home": 0,
            "away": 0
        },
        "type": []
    };

    var dataBase = {
        //        'lineupNum': 0,
        "selectedGame": segments.game,
        "selectedPeriod": "",
        "timeStartMin": 0,
        "timeStartSec": 0,
        "timeStopMin": 0,
        "timeStopSec": 0,
        "oppPoints": 0,
        "name": "",
        "Points": 0,
        "playerNames": [],

        "TwoPtMakes": [],
        "TwoPtMisses": [],
        "ThreePtMakes": [],
        "ThreePtMisses": [],
        "FTMakes": [],
        "FTMisses": [],
        "Assists": [],
        "DRebs": [],
        "ORebs": [],
        "Turnovers": [],
        "Fouls": [],
        "Poss": [],
        "Steals": [],
        "Blocks": [],
        "Timeouts": [],
        'Enters': [],
        'Exits': [],
        'DBRebounds': []
    };


    var players = [];
    var oppScoreCounter = 0;
    //    players.push("TEAM");
    for (var i = 0; i < segments.segs.length; i++) {
        //set up data shared between players in a single time period
        var seg = segments.segs[i];
        var dataTP = JSON.parse(JSON.stringify(dataBase)); //makes copy of template data
        dataTP["selectedPeriod"] = 'P' + seg.time.selectedPeriod;
        dataTP["timeStartMin"] = seg.time.timeStart.min;
        dataTP["timeStartSec"] = seg.time.timeStart.sec;
        dataTP["timeStopMin"] = seg.time.timeStop.min;
        dataTP["timeStopSec"] = seg.time.timeStop.sec;
        console.log("seg-");
        console.log(seg);

        if (seg.time.timeStop.min == 0 && seg.time.timeStop.sec == 0) {
            //if its the end of a period, put the opponents score to the actual final score from oppScores
            //console.log("oppScores");
            //console.log()
            console.log(oppScores[oppScoreCounter]);
            if (teama == 2) { //away
                dataTP["oppPoints"] = oppScores[oppScoreCounter] - seg.stats[0].score.home;
            } else {
                dataTP["oppPoints"] = oppScores[oppScoreCounter] - seg.stats[0].score.away;
            }
            oppScoreCounter++;
        } else {
            if (i == 0) {
                if (teama == 2) { //away
                    dataTP["oppPoints"] = segments.segs[i].score.home; //difference between last stat and first
                } else { //segments.segs[i-1].score.home //seg.stats[0].score.away
                    dataTP["oppPoints"] = segments.segs[i].score.away; //difference between last stat and first
                }
            } else {
                if (teama == 2) { //away
                    dataTP["oppPoints"] = segments.segs[i].score.home - segments.segs[i - 1].score.home; //difference between last stat and first
                } else { //segments.segs[i-1].score.home //seg.stats[0].score.away
                    dataTP["oppPoints"] = segments.segs[i].score.away - segments.segs[i - 1].score.away; //difference between last stat and first
                }
            }
        }

        dataTP["possessions"] = seg.time.poss;

        if (seg.time.timeStart.min == 10 || (seg.time.selectedPeriod >= 5 && seg.time.timeStart.min == 5)) { //CHANGE eventually probably
            //next half - all new players
            players = [];
            players.push("TEAM");
        }
        for (var j = 0; j < players.length; j++) {
            datas[players[j]] = JSON.parse(JSON.stringify(dataTP));
            datas[players[j]]['name'] = players[j];
        }

        //var startingScore = segments.segs[i].stats[0].score;

        for (var j = 0; j < segments.segs[i].stats.length; j++) {
            var stat = segments.segs[i].stats[j];
            //            console.log("player: " + stat.player + " - stat: " + stat.stat);// + " - datas: " + datas[stat.player][stat.stat2]);
            if (players.indexOf(stat.player) < 0 && stat.player != "") { //player not already in players
                //                console.log("player entering - " + stat.player);
                players.push(stat.player);
                //set up base info about player in this time segment
                datas[stat.player] = JSON.parse(JSON.stringify(dataTP));
                datas[stat.player]['name'] = stat.player;
            }
            if (stat.stat2 == "Exits") {
                //                console.log("player exiting - " + stat.player);
                players.splice(players.indexOf(stat.player), 1); //removes player from players
                delete datas[stat.player]; //removes player's object from datas
            } else {
                //for each stat - parse statBase and add it to the list for that stat
                //                datas[stat.player][stat.stat2] --> this is a list!
                var newStat = JSON.parse(JSON.stringify(statBase));
                newStat.location = stat.loc;
                newStat.time = stat.time;
                newStat.score = stat.score;
                console.log("pushing new stat");
                datas[stat.player][stat.stat2].push(newStat); //adds a new empty stat to this category

                if (stat.stat2 == "FTMakes") {
                    datas[stat.player]["Points"] += 1;
                } else if (stat.stat2 == "TwoPtMakes") {
                    datas[stat.player]["Points"] += 2;
                } else if (stat.stat2 == "ThreePtMakes") {
                    datas[stat.player]["Points"] += 3;
                }
            }
        }
        //        console.log("len(datas): " + Object.keys(datas).length);
        //        console.log("~~~~~~");
        //        console.log("datas.length: " + Object.keys(datas).length);
        //        if (Object.keys(datas).length > 6 || Object.keys(datas).length < 5) {
        if (Object.keys(datas).length != 6) {
            console.log("error found!");
            var error = JSON.parse(JSON.stringify(errorBase));
            error.description = 'Invalid number of players: ' + Object.keys(datas).length;
            error.time = seg.time;
            error.segment = i;
            console.log(error);
            errors.push(error);
            console.log("~~~~~~");
        }

        topDatas.push({ segment: i, datas: datas });
        datas = {};
    }

    oppScore = 0;
    oppScores = [];

    return topDatas;
}

router.post('/scrape_submit', function(req, res) {
    console.log(req.body);
    console.log(req.user);
    console.log('inside scrape submit');
    console.log(req.body.team);

    //put everything into auto_dataentry folder
    //    var team = req.body.team;
    //    team = team.replace(/ /g, '');
    //    team = team+'_data';
    var team = req.body.team + '_auto_datas';
    team = team.replace(/ /g, '');
    //    var team = 'auto_data';
    var GameDataModel = mongoose.model(team, AutoDataSchema);

    var dataPoints = req.body.dataPoints;

    //Undo-Setup
    if (req.session.passport.user) {
        console.log("added to limbo data");
        limbo_data[req.session.passport.user] = [team, dataPoints]; //Used for undo
    }

    //Saving datapoints
    //for(var i=0; i<dataPoints.length; i++) {
    //    new GameDataModel(dataPoints[i]).save(function (err) {
    //        if (err) {
    //            console.log("data add error");
    //            res.send('Error on saving data!');
    //        }
    //    });
    //}

    console.log("DATAPOINTS\n\n\n\n\n\n\n\n");
    console.log(dataPoints);
    console.log("DATAPOINTS\n\n\n\n\n\n\n\n");

    new GameDataModel(dataPoints).save(function(err) {
        if (err) {
            console.log("data add error");
            res.send('Error on saving data!');
        }
    });

    res.send("posted yaya");
});


module.exports = router;