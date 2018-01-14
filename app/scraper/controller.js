var app = angular.module("ScrapeApp", []);
app.controller("ScrapeCtrl", function($scope, $http) {
    $scope.url = '';
    $scope.datas = {};
    $scope.team = 0;
    $scope.team_name = '';
    $scope.team_names = [];
    $scope.team_game = '';
    $scope.team_games = [];
    $scope.team_players = [];
    $scope.errors = [];
    $scope.selectedError = '';
    $scope.type = '';
    $scope.oldPlayer = '';
    $scope.newPlayer = '';

    $scope.autoDataStatus = "NOPE";
    $scope.oldDataStatus = "NOPE";

    $scope.prettyDatas; //JSON.stringify($scope.datas, undefined, 4);
    $scope.prettyList = [];

    $scope.examples = ['http://stats.ncaa.org/game/play_by_play/3951333',
        'http://stats.ncaa.org/game/play_by_play/3506812',
        'http://stats.ncaa.org/game/play_by_play/3712864',
        'http://stats.ncaa.org/game/play_by_play/3793298'
    ];

    $http.get("/api/team_names").success(function(data) {
        // $scope.team_names = data.sort();
        for (var i = 0; i < data.length; i++) {
            console.log(data[i]);
            if ($scope.team_names.indexOf(data[i]) < 0) { //not in already
                $scope.team_names.push(data[i])
            }
        }
        $scope.team_names = $scope.team_names.sort()
        console.log($($scope.team_names));
    });

    $scope.find_games_and_players = function() {
        var body = { team_name: $scope.team_name };
        console.log("findgames");
        $http.post("/api/team_info_team", body).success(function(data) {
            $scope.team_games = data[0];
            $scope.team_players = data[1];
            console.log($scope.team_players);
        });
    };

    $scope.search = function() {
        if ($scope.type == 'men') {
            $scope.errors = [];
            $scope.data = {};
            var body = {
                url: $scope.url,
                team_name: $scope.team_name,
                team: $scope.team,
                game: $scope.team_game,
                players: $scope.team_players
            };
            console.log($scope.url);
            console.log($scope.team);
            $http.post('/scraper/scrape', body).success(function(data) {
                console.log("successful scrape");
                $scope.datas = data.datas;
                $scope.errors = data.errors;
                $scope.prettyDatas = JSON.stringify($scope.datas, undefined, 4);

                for (var i = 0; i < $scope.datas.length; i++) {
                    console.log($scope.datas[i]);
                    $scope.prettyList[i] = JSON.stringify($scope.datas[i], undefined, 4);
                }
                console.log("prettyList");
                //console.log($scope.prettyList);
            });
        } else { //womens
            $scope.errors = [];
            $scope.data = {};
            var body = {
                url: $scope.url,
                team_name: $scope.team_name,
                team: $scope.team,
                game: $scope.team_game,
                players: $scope.team_players
            };
            console.log($scope.url);
            console.log($scope.team);
            $http.post('/scraper/scrape_women', body).success(function(data) {
                console.log("successful scrape");
                //            console.log(data.datas);
                //            $scope.teamName = data.teamName;
                //            console.log($scope.teamName);
                $scope.datas = data.datas;
                $scope.errors = data.errors;
                $scope.prettyDatas = JSON.stringify($scope.datas, undefined, 4);

                for (var i = 0; i < $scope.datas.length; i++) {
                    console.log($scope.datas[i]);
                    $scope.prettyList[i] = JSON.stringify($scope.datas[i], undefined, 4);
                }
                console.log("prettyList");
                //console.log($scope.prettyList);
            });
        }
    };

    $scope.selectError = function(error) {
        $scope.selectedError = error;
        document.getElementById("main").scrollTop = 0;
        document.getElementById("main").scrollTop = error.segment * 7300;
        //        console.log($textarea);
    };


    $scope.deleteGame = function() {
        var body = { game: $scope.team_game };
        $http.post("/api/removeGame", body).success(function(data) {
            console.log(data);
        }).error(function(data) {
            //console.log("Error deleting game");
            console.log(data);
        })
    };

    $scope.replacePlayer = function() {
        console.log($scope.oldPlayer);
        console.log($scope.newPlayer);
        for (var i = 0; i < $scope.prettyList.length; i++) {
            $scope.prettyList[i] = $scope.prettyList[i].split($scope.oldPlayer).join($scope.newPlayer);
        }
        //console.log($scope.prettyList);
    };

    $scope.submit = function() {
        //data is in prettyData now?
        //turn prettyData into list of just data points
        //var body = {team: $scope.teamName, datapoints: []}; //use this so autodatas has a team in future
        //var body = [];
        //        var dan = JSON.parse($scope.prettyDatas);
        //        var aaa = document.getElementById("datatext1").value;
        //console.log(aaa);

        var dan = [];
        for (var i = 0; i < $scope.datas.length; i++) {
            dan.push(JSON.parse($scope.prettyList[i]));
        }
        //var dan = JSON.parse(aaa);
        console.log(dan);

        //return;

        var datapoints = [];
        //console.log(aaa);
        //var dan = JSON.parse(aaa);
        var oldDatapoints = [];

        var oldStuff = [
            "selectedGame",
            "selectedPeriod",
            "timeStartMin",
            "timeStartSec",
            "timeStopMin",
            "timeStopSec",
            "oppPoints",
            "name",
            "Points",
            "TwoPtMakes",
            "TwoPtMisses",
            "ThreePtMakes",
            "ThreePtMisses",
            "FTMakes",
            "FTMisses",
            "Assists",
            "DRebs",
            "ORebs",
            "Turnovers",
            "playerNames"
        ];

        var oldStuff2 = [
            "TwoPtMakes",
            "TwoPtMisses",
            "ThreePtMakes",
            "ThreePtMisses",
            "FTMakes",
            "FTMisses",
            "Assists",
            "DRebs",
            "ORebs",
            "Turnovers"
        ];

        var totalBase = {
            "selectedGame": '',
            "selectedPeriod": '',
            "timeStartMin": 0,
            "timeStartSec": 0,
            "timeStopMin": 0,
            "timeStopSec": 0,
            "oppPoints": 0,
            "name": "Total",
            "Points": 0,
            "TwoPtMakes": 0,
            "TwoPtMisses": 0,
            "ThreePtMakes": 0,
            "ThreePtMisses": 0,
            "FTMakes": 0,
            "FTMisses": 0,
            "Assists": 0,
            "DRebs": 0,
            "ORebs": 0,
            "Turnovers": 0,
            "playerNames": []
        };

        //console.log(dan);
        for (var k in dan) {
            console.log(k);
            console.log(dan[k]);
            for (var ke in dan[k]) {
                if (ke === "datas") {
                    var oldDps = [];
                    var segment = dan[k][ke]; //this is a segment
                    //start total count here;
                    var total = JSON.parse(JSON.stringify(totalBase)); //need total across segment
                    for (var key in segment) {
                        if (dan[k][ke][key].name != "TEAM") { //this is a single stat!
                            var stat = dan[k][ke][key];
                            var oldStat = {};
                            for (var el in stat) { //goes through every key in a stat
                                if (oldStuff.indexOf(el) >= 0) { //only add old stuff
                                    if (el == 'playerNames') {
                                        total[el].push(stat['name']); //puts all the names in
                                    } else if (el == "Points") {
                                        oldStat[el] = stat[el];
                                        total[el] += stat[el];
                                    } else if (el == 'selectedPeriod') {
                                        if ($scope.type == 'men') {
                                            if (stat[el] == "P1" || "P2") {
                                                oldStat[el] = stat[el].replace("P", "H");
                                                total[el] = stat[el].replace("P", "H");
                                            } else {
                                                oldStat[el] = stat[el].replace("P", "OT");
                                                total[el] = stat[el].replace("P", "OT");
                                                oldStat[el] = stat[el].replace("3", "1");
                                                total[el] = stat[el].replace("3", "1");
                                                oldStat[el] = stat[el].replace("4", "2");
                                                total[el] = stat[el].replace("4", "2");
                                            }
                                        } else if ($scope.type == 'women') {
                                            oldStat[el] = stat[el].replace("P5", "OT1");
                                            total[el] = stat[el].replace("P5", "OT1");
                                            oldStat[el] = stat[el].replace("P6", "OT2");
                                            total[el] = stat[el].replace("P6", "OT2");
                                        }
                                    } else if (oldStuff2.indexOf(el) >= 0) {
                                        //console.log(el + " : " + dan[k][ke][key][el].length);
                                        oldStat[el] = dan[k][ke][key][el].length;
                                        total[el] += dan[k][ke][key][el].length;
                                    } else {
                                        //console.log(el + " : " + dan[k][ke][key][el]);
                                        oldStat[el] = dan[k][ke][key][el];
                                        total[el] = dan[k][ke][key][el]; //gives total the same time and stuff
                                    }
                                }
                            }
                            oldDps.push(oldStat);
                        }

                        datapoints.push(dan[k][ke][key]); //one stat!
                    }
                    console.log("~~~~~dps~~~~~");
                    console.log(oldDps);
                    console.log("~~~~~total~~~~~~~\n\n");
                    console.log(total);
                    total['playerNames'] = total['playerNames'].sort();
                    total['name'] = "Total";
                    oldDps.push(total);
                    //console.log("~~~~~~~~~~~~~~~~~~~~~~");
                    ////console.log(oldDps);
                    //console.log("~~~~~~~~~~~~~~~~~~~~~~");
                    oldDatapoints.push(oldDps);
                }
            }
        }


        console.log("~~~~~~~~~~~~~~~~~~~~~~");
        console.log(datapoints);
        console.log("~~~~~~~~~~~~~~~~~~~~~~");

        var body1 = { team: $scope.team_name, datapoints: datapoints };
        //Canisius Womens
        $scope.autoDataStatus = "Successfully posted auto data";

        for (var e = 0; e < datapoints.length; e++) {
            console.log(datapoints[e]);
            var body3 = { team: $scope.team_name, dataPoints: datapoints[e] };
            $http.post('/scraper/scrape_submit', body3).success(function(data) {
                console.log("Successfully posted auto data: " + e);
            }).error(function(data) {
                $scope.autoDataStatus = "Error";
            });
        }

        $scope.oldDataStatus = "Successfully posted old data";
        for (var q = 0; q < oldDatapoints.length; q++) {
            var body2 = { team: $scope.team_name, dataPoints: oldDatapoints[q] };
            $http.post('/api/addData', body2).success(function(data) {
                console.log("Successfully posted old data: " + q);
                console.log(body2);
            }).error(function(data) {
                $scope.oldDataStatus = "Error";
            });
        }
    }
});