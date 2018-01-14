const _ = require("lodash");
var express = require("express");
var router = express.Router();
var dataModels = require("../../database/database.js");

var mongoose = require("mongoose");

var mySchemas = require("../../database/schemas");

var DataSchema = dataModels.DataSchema;
var AutoDataSchema = dataModels.AutoDataSchema;
var LineupsSchema = dataModels.LineupsSchema;
var TeamModel = dataModels.TeamModel;

var Lineups = require("../../database/createLineups.js");
var database_queries = require("../../database/mongo_queries.js");

/********* 
 * $http.get("/api/team_names")
 * $http.post("/api/team_info_team", body)
 * $http.post("/api/removeGame", body)
 * $http.post('/api/addData', body2)
 * $http.post('/scraper/scrape', body)
 * $http.post('/scraper/scrape_women', body)
 * $http.post('/scraper/scrape_submit', body3)
 * **********/

/***** LEGACY API CALLS *****/
//First Scraper Call
router.get("/team_names", function(req, res) {
    //Creation of Team model
    var TeamModel = dataModels.teamModel;
    TeamModel.find({}, function(err, data) {
        var team_names = [];
        for (var i in data) {
            team_names.push(data[i]["name"]);
        }
        res.send(team_names);
    });
});

//Second Scraper call
router.post("/team_info_team", function(req, res) {
    var team = req.body.team_name;

    //Creation of Team model
    var TeamModel = dataModels.teamModel;
    TeamModel.find({ name: team }, function(err, data) {
        if (err) {
            console.log(err);
        }
        console.log(data);

        // (data[0] because data is array of length 1)
        var data = data[0];

        var team_data = [];
        team_data.push(data.games);
        team_data.push(data.players);
        team_data.push(team);
        team_data.push(data.type);
        team_data.push(data.lineupKeys);

        res.send(team_data);
    });
});


//Third & Fourth Scraper Call in Scraper Folder

//Fifth Scraper Call
router.post("/removeGame", function(req, res) {
    console.log("Inside removeGame");
    //Permissions Check
    /* console.log(req.user.username);
    if (req.user.username !== "admin") {
        //console.lo
        res.send({ error: true, text: "Error: Permission Denied" });
        return;
    } */

    req.session.team = "Oakland University";
    //Team Check
    if (!req.session.team) {
        res.send({ error: true, text: "Error: Team not defined" });
        return;
    }

    //Game Check
    if (!req.body.game) {
        res.send({ error: true, text: "Error: Please define game name" });
        return;
    }

    var team = req.session.team.replace(/ /g, "");
    var game = req.body.game;

    console.log("Deleting Game:", game);

    var RegDataModel = mongoose.model(team + "_datas", DataSchema);
    var AutoDataModel = mongoose.model(team + "_auto_datas", AutoDataSchema);

    RegDataModel.remove({ selectedGame: game }, function(err, data) {
        if (err) {
            err.error = true;
            res.send(err);
        } else {
            AutoDataModel.remove({ selectedGame: game }, function(err, dataAuto) {
                if (err) {
                    err.error = true;
                    res.send(err);
                } else {
                    var response = {
                        error: false,
                        text: "Removal Success, Reg Datas removed: " +
                            data +
                            " Auto: " +
                            dataAuto
                    };
                    res.send(response);
                }
            });
        }
    });
});

//Sixth Scraper Call in Scraper Folder


//Seventh Scraper Call
router.post("/addData", function(req, res) {
    var team = req.body.team;
    var teamName = team;

    team = team.replace(/ /g, "");
    team = team + "_data";
    var GameDataModel = mongoose.model(team, DataSchema);

    var dataPoints = req.body.dataPoints;

    //Undo-Setup
    if (req.session.passport.user) {
        console.log("added to limbo data");
        limbo_data[req.session.passport.user] = [team, dataPoints]; //Used for undo
    }

    //Adds lineup key (if it does not yet exist) into the database
    //MAKE SURE TEAM NAMES MATCH
    console.log("Updating Lineup Key");
    LineupKeys.updateLineupKeys(teamName, dataPoints);

    //Saving datapoints
    var counter = 0;
    for (var i = 0; i < 6; i++) {
        new GameDataModel(dataPoints[i]).save(function(err) {
            counter++;
            if (err) {
                console.log("data add error");
                res.send("Error on saving data!");
            }
            if (counter == 5) {
                res.send("Add data success");
            }
        });
    }
});





/**********************  EVERYTHING BELOW TO BE REMOVED  ********/
/*
LINEUPS AS FILTERED BY GAMES
Model found in database/lineups_by_games
*/
router.get("/get_lineups_by_games", function(req, res) {
    var params = req.query;
    var team = req.session.team;
    var games = [];
    var p_inc = [];
    var p_exc = [];

    team = "Oakland University";

    //If they exist, clean up the data and put it into list format
    if (params["games"])
        var games = params["games"].replace(/\'/g, "'").split("$");
    if (params["includes"]) var p_inc = params["includes"].split("$");
    if (params["excludes"]) var p_exc = params["excludes"].split("$");

    console.log("Games After");

    var d = new Date();
    var n = d.getTime();
    console.log("Starting DB query", n);

    lineups_by_games.gen_lineup_for_games(team, games, p_inc, p_exc, function(
        err,
        data
    ) {
        if (err) {
            console.log(err);
        }

        var d2 = new Date();

        console.log("Time Taken: ", d2.getTime(), d2.getTime() - n);

        res.send(data);
        //Memory clean? maybe?????
        data = null;
    });
});

router.get("/regular_players", function(req, res) {
    var params = req.query;
    var team = req.session.team;
    var games = [],
        p_inc = [],
        p_exc = [];

    team = "Oakland University";

    //If they exist, clean up the data and put it into list format
    if (params["games"]) var games = params["games"].split("$");
    if (params["includes"]) var p_inc = params["includes"].split("$");
    if (params["excludes"]) var p_exc = params["excludes"].split("$");
    var selPlayer = params["aggregateOn"].trim();

    regular_player_aggregations.retrieveData(
        team,
        selPlayer,
        games,
        p_inc,
        p_exc,
        function(retData) {
            res.send(retData);
        }
    );
});

router.get("/get_lineups", lineups_query, function(req, res) {
    if (req.err_body) {
        console.log(req.err_body);
    }
    res.send(req.body.lineup_data);
});

router.get("/recompute_lineups", function(req, res) {
    console.log(req._parsedUrl.query);
    var team = req._parsedUrl.query;
    team_data = team.replace(/ /g, "");
    team_data = team + "_datas";

    var DataModel = mongoose.model(team_data, DataSchema);
    DataModel.find({}, function(err, data) {
        if (err) {
            res.send(data);
        }
        database_queries.append_lineups_routerless(team, data);
    });
});

/*


  Result of hitting the undo button,
  The add data function saves the data into a limbo-object
  that turns into a datapoint with negative values
    (+1 points becomes -1 points)
    (time start and time end are flipped)
    and adds this negated data to the aggregated lineups to
    cancel out what we are trying to undo


*/
//Limbo data used for undo
var limbo_data = {};

router.get("/undo", undo, append_lineups, function(req, res) {
    res.send(limbo_data[req.session.passport.user]);
    console.log("reached meh");
    limbo_data[req.session.passport.user] = [];
});

//######Integrity Constraints for the data to be added
var add_integrity = require("../../database/de_add_integrity");
router.post("/addData", function(req, res) {
    var team = req.body.team;
    var teamName = team;

    team = team.replace(/ /g, "");
    team = team + "_data";
    var GameDataModel = mongoose.model(team, DataSchema);

    var dataPoints = req.body.dataPoints;

    console.log("******req.body******");
    //console.log(req.body.dataPoints);

    //Check datapoint's integrity
    //var validated = true;
    //console.log("checking integrity API");
    //add_integrity.dps_integrity(dataPoints, team,
    //  function(status, body){
    //       console.log("ERROR with data on server side");
    //    res.status(status).send(body);
    //    validated = false;
    //});
    //if(!validated){
    //   return;
    //}
    //If integrity was violated, this point won't be reached

    //Undo-Setup
    if (req.session.passport.user) {
        console.log("added to limbo data");
        limbo_data[req.session.passport.user] = [team, dataPoints]; //Used for undo
    }

    //Adds lineup key (if it does not yet exist) into the database
    //MAKE SURE TEAM NAMES MATCH
    console.log("Updating Lineup Key");
    LineupKeys.updateLineupKeys(teamName, dataPoints);

    //Saving datapoints
    var counter = 0;
    for (var i = 0; i < 6; i++) {
        new GameDataModel(dataPoints[i]).save(function(err) {
            counter++;
            if (err) {
                console.log("data add error");
                res.send("Error on saving data!");
            }
            if (counter == 5) {
                res.send("Add data success");
            }
        });
    }
});

router.post("/append_lineups", append_lineups, function(req, res) {
    if (req.body.append_lineups_error) {
        console.log("An error occured appending the lineups");
        res.send(req.body.append_lineups_error);
    }

    res.send(req.lineup_data);
});


router.get("/team_info", function(req, res, next) {
    var team = req.session.team;

    team = "Oakland University";

    //Creation of Team model
    var TeamModel = dataModels.teamModel;
    TeamModel.findOne({ name: team })
        .then(data => {
            if (!data) {
                throw new Error("Team information couldn't be found");
            }

            fetchFormattedGames(team, data.games).then(function(formattedGames) {
                console.log(formattedGames);
                res.send([
                    data.games,
                    data.players,
                    team,
                    data.manualSettings,
                    data.lineupKeys,
                    formattedGames
                ]);
            });
        })
        .catch(next);
});

router.post("/team_info_team", function(req, res) {
    var team = req.body.team_name;

    //Creation of Team model
    var TeamModel = dataModels.teamModel;
    TeamModel.find({ name: team }, function(err, data) {
        if (err) {
            console.log(err);
        }

        console.log(data);

        // (data[0] because data is array of length 1)
        var data = data[0];

        var team_data = [];
        team_data.push(data.games);
        team_data.push(data.players);
        team_data.push(team);
        team_data.push(data.type);
        team_data.push(data.lineupKeys);

        res.send(team_data);
    });
});

//gets the lineups for the specified team
function lineups_query(req, res, next) {
    var num_lineups = req.query.num_lineups || 1000;
    //If its held in the session, that's an admin trying to view
    if (!req.session.team) {
        console.log("Coach querying lineup? -- api");
        //otherwise the user logged in is a coach
        req.session.team = req.user.team;
    }
    var team = req.session.team;
    team = team.replace(/ /g, "");
    team = team + "_lineups";

    var LineupsModel = mongoose.model(team, LineupsSchema);
    LineupsModel.find({})
        .limit(num_lineups)
        .sort("-Time_total")
        .exec(function(err, data) {
            if (err) {
                req.err_body = err;
            }
            req.body.lineup_data = data;
            next();
        });
}

/*

  Middleware api call that will either create a lineup if it is not already made,
    or update a previously created lineup

*/

function append_lineups(req, res, next) {
    console.log("at append lineups");

    var team = req.body.team;
    team = team.replace(/ /g, "");
    team = team + "_lineups";

    var dataPoints = req.body.data;

    //Call to lineups api in database/createLineups.js
    var lineup = Lineups.create_lineups(Lineups.create_timestamps(dataPoints));

    var keys = [];
    for (key in lineup) {
        keys.push(key);
    }
    var key = keys[0];
    lineup = lineup[key]; //fixup data structure to have
    lineup.name_key = key; //correct key as Schema does

    //Try to look up lineup
    var LineupsModel = mongoose.model(team, LineupsSchema);

    LineupsModel.find({ name_key: key }, function(err, data) {
        if (err) {
            console.log("Error finding" + key + " in lineups");
            req.body.append_lineups_error = err;
            next();
        }
        lineup.name_key = key;
        console.log("Lineup found: ");
        //console.log(data);
        //if this lineup doesn't exist yet create it
        if (!data.length) {
            console.log("New Lineup!");
            new LineupsModel(lineup).save(function(err) {
                if (err) {
                    console.log("error saving new lineup");
                    req.body.append_lineups_error = err;
                    next();
                } else {
                    console.log("No errors Saving lineup!");
                    req.body.lineup_data = lineup;
                    next();
                }
            });
        } else {
            //otherwise append it to the existing one and update
            LineupsModel.findOne({ name_key: key }, function(err, doc) {
                if (err) {
                    console.log("error in finding lineup to update");
                    req.body.append_lineups_error = err;
                    next();
                }
                for (key in lineup) {
                    if (key != "name_key") {
                        doc[key] = lineup[key] + data[0][key];
                    }
                }
                doc.save(function(err, data) {
                    if (err) {
                        console.log("Error saving updated lineup");
                        req.body.append_lineups_error = err;
                        next();
                    } else {
                        console.log("No error updating lineup");
                        req.body.lineup_data = lineup;
                        console.log(req.body.lineup_data);
                        next();
                    }
                });
            });
        }
    });
}

/*


  Result of hitting the undo button,
  The add data function saves the data into a limbo-object
  that turns into a datapoint with negative values
    (+1 points becomes -1 points)
    (time start and time end are flipped)
    and adds this negated data to the aggregated lineups to
    cancel out what we are trying to undo

  NEXT should be for append_lineups

*/
//Limbo data used for undo,

function undo(req, res, next) {
    console.log("limbo data");
    console.log(limbo_data[req.session.passport.user]);

    if (!limbo_data[req.session.passport.user] ||
        !limbo_data[req.session.passport.user].length
    ) {
        console.log("Limbo Data empty");
        res.send(new Error(" Nothing to undo "));
        return;
    }
    console.log("limbo data to restore exists");

    team = limbo_data[req.session.passport.user][0];
    console.log(team);
    var GameDataModel = mongoose.model(team, DataSchema);

    dataPoints = limbo_data[req.session.passport.user][1];

    var to_lineup = {};
    to_lineup.team = team.split("_")[0];
    to_lineup.data = Lineups.negate_data(dataPoints);
    console.log("Data negated");

    var from_db = [];
    for (var i = 0; i < 6; i++) {
        var point = dataPoints[i];
        GameDataModel.remove({
                selectedGame: point.selectedGame,
                timeStartMin: point.timeStartMin,
                timeStartSec: point.timeStartSec,
                selectedHalf: point.selectedHalf,
                name: point.name
            },
            function(err, data) {
                if (err) {
                    console.log("An error occured removing the limbo data");
                    res.send(err);
                }

                from_db.push(data);
                if (from_db.length == 6) {
                    req.body.team = to_lineup.team;
                    req.body.data = to_lineup.data;
                    console.log("appendin to lineups");
                    //THIS NEXT SHOULD BE A CALL TO APPEND LINEUPS
                    next();
                }
            }
        );
    }
}

module.exports = router;

router.get("/change_to_period", function(req, res) {
    var dataModel = mongoose.model("test_datas", DataSchema);
    dataModel.update({}, { $rename: { Turnovers: "selectedPeriod" } }, { multi: true },
        function(err, dps, raw) {
            console.log(err);
            res.send(raw);
        }
    );
});

// ======================================================== TEAM DATA ACCESS ==

// -- get team data -----------------------------------------------------------

router.get("/team_data", function(req, res) {
    var team = req.session.team;
    team = "Oakland University";
    var withCompleted = req.query.completed || false;

    team = "Oakland University";

    if (!team) {
        res.send({ success: false });
    } else {
        shotchart.get_team_data(team, withCompleted, function(team_data) {
            if (team_data) {
                res.send({ success: true, team_data: team_data });
            } else {
                res.send({ success: false });
            }
        });
    }
});

// ======================================================= SHOT CHART ACCESS ==

// -- get all games/shots for shot chart data entry ---------------------------

router.get("/all_games", function(req, res) {
    var team = req.session.team;
    team = "Oakland University";

    if (!team) {
        res.send({ success: false });
    } else {
        shotchart.get_all_games(team, function(all_games) {
            if (all_games) {
                res.send({ success: true, all_games: all_games });
            } else {
                res.send({ success: false });
            }
        });
    }
});

// -- update a shot - shot chart data entry -----------------------------------

router.post("/shot_chart_shot", function(req, res) {
    var team = req.session.team;
    var shot = req.body.shot;

    team = "Oakland University";

    if (!shot || !team) {
        res.send({ success: false });
    } else {
        shotchart.save_shot(team, shot, function(err) {
            res.send({ success: !err, shot });
        });
    }
});

// -- get lineups w/ segment keys based on games/included/excluded ------------

router.get("/lineups_data", function(req, res) {
    var team = req.session.team;
    var games = (req.query["games"] || "").split("$").filter(function(v) {
        return v != "";
    });
    var includedPlayers = (req.query["included"] || "")
        .split("$")
        .filter(function(v) {
            return v != "";
        });
    var excludedPlayers = (req.query["excluded"] || "")
        .split("$")
        .filter(function(v) {
            return v != "";
        });

    team = "Oakland University";

    console.log("team:", team);
    console.log("games:", games);
    console.log("includedPlayers:", includedPlayers);
    console.log("excludedPlayers:", excludedPlayers);

    if (team) {
        shotchart.get_lineups_data(
            team,
            games,
            includedPlayers,
            excludedPlayers,
            function(lineups) {
                if (lineups) {
                    res.send({
                        success: true,
                        lineups: lineups
                    });
                } else {
                    res.send({ success: false });
                }
            }
        );
    } else {
        res.send({ success: false });
    }
});

// -- get data needed for shot chart tool based on segment keys ---------------

router.post("/shot_chart_data", function(req, res) {
    var team = req.session.team;

    team = "Oakland University";

    if (team) {
        shotchart.get_shot_chart_data(team, req.body.segmentKeys, function(
            teamStats,
            players,
            allShots
        ) {
            if (teamStats) {
                res.send({
                    success: true,
                    teamStats: teamStats,
                    players: players,
                    allShots: allShots
                });
            } else {
                res.send({ success: false });
            }
        });
    } else {
        res.send({ success: false });
    }
});

// ===================================================== COMBINATIONS ACCESS ==

// -- get lineup stats based on criteria --------------------------------------

router.get("/filtered_lineup_stats", function(req, res) {
    var team = req.session.team;
    var games = req.query.games.split("$").filter(function(v) {
        return v != "";
    });
    var includedPlayers = req.query.included.split("$").filter(function(v) {
        return v != "";
    });
    var excludedPlayers = req.query.excluded.split("$").filter(function(v) {
        return v != "";
    });

    team = "Oakland University";

    if (team) {
        combinations.getLineupStats(
            team,
            games,
            includedPlayers,
            excludedPlayers,
            function(lineupsMap) {
                if (lineupsMap) {
                    res.send({
                        success: true,
                        lineupsMap: lineupsMap
                    });
                } else {
                    res.send({ success: false, message: "No Results" });
                }
            }
        );
    } else {
        res.send({ success: false, message: "No Team Set" });
    }
});

// ============================================================================

//Remove Game from the database
//
// Expecting caller to be logged in to admin account, with
// parameter "game" representing the name of the game to be removed
//
// Responds with Object:
//      error:  boolean (whether or not it was successfull)
//      text:   String  (response text)
router.post("/removeGame", function(req, res) {
    console.log("Inside removeGame");
    //Permissions Check
    console.log(req.user.username);
    if (req.user.username !== "admin") {
        //console.lo
        res.send({ error: true, text: "Error: Permission Denied" });
        return;
    }

    req.session.team = "Oakland University";
    //Team Check
    if (!req.session.team) {
        res.send({ error: true, text: "Error: Team not defined" });
        return;
    }

    //Game Check
    if (!req.body.game) {
        res.send({ error: true, text: "Error: Please define game name" });
        return;
    }

    var team = req.session.team.replace(/ /g, "");
    var game = req.body.game;

    console.log("Deleting Game:", game);

    var RegDataModel = mongoose.model(team + "_datas", DataSchema);
    var AutoDataModel = mongoose.model(team + "_auto_datas", AutoDataSchema);

    RegDataModel.remove({ selectedGame: game }, function(err, data) {
        if (err) {
            err.error = true;
            res.send(err);
        } else {
            AutoDataModel.remove({ selectedGame: game }, function(err, dataAuto) {
                if (err) {
                    err.error = true;
                    res.send(err);
                } else {
                    var response = {
                        error: false,
                        text: "Removal Success, Reg Datas removed: " +
                            data +
                            " Auto: " +
                            dataAuto
                    };
                    res.send(response);
                }
            });
        }
    });
});

//In case of emergency: break glass
//For each team
// For each total's datapoint
//   if playernames not in lineupKeys
//      append playernames to lineupKeys
router.get("/updateAllTeamsLineupKeysFromDatapoints", function(req, res) {
    var TeamModel = dataModels.teamModel;

    TeamModel.find({}, function(err, data) {
        //FOR EACH TEAM
        data.forEach(function(team) {
            console.log("UPDATING LINEUPKEYS NAME:", team.name);

            var teamDatas = team.name.replace(/ /g, "") + "_datas";
            var DataModel = mongoose.model(teamDatas, DataSchema);

            //GET ALL TOTALS POINTS
            DataModel.find({ name: "Total" }, function(err, datapoints) {
                datapoints.forEach(function(dp) {
                    if (!dp.playerNames) {
                        console.log(dp);
                        return;
                    }

                    var lineupKey = dp.playerNames.sort().join("|");
                    console.log(lineupKey);
                    TeamModel.update({
                            name: team.name,
                            lineupKeys: { $nin: [lineupKey] }
                        }, {
                            $push: { lineupKeys: lineupKey }
                        }, {},
                        function(err, data) {
                            if (err) {
                                console.log("ERROR UPDATING LINEUP KEY", err);
                            } else {
                                console.log("DATA FROM LINEUP KEY UPDATE", data);
                            }
                        }
                    );
                });
            });
        });
    });
});

router.get("/me", function(req, res, next) {
    dataModels.teamModel
        .findOne({ name: req.user.team })
        .then(team => {
            if (!team) {
                throw new Error("Team does not exist");
            }

            const teamObj = team.toObject();
            const userObj = req.user.toObject();

            res.send({
                teamName: req.user.team,
                features: appendMissingFeatures(
                    userObj.features, !!teamObj.manualSettings
                ),
                manualSettings: teamObj.manualSettings,
                username: userObj.username,
                logoUrl: team.logo ? logoRouteUrl : null
            });
        })
        .catch(next);
});