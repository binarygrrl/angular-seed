var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var uriUtil = require("mongodb-uri");

var options = {
    server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
    replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
};

var dbuser = process.env.dbusername || "mason";
var dbpass = process.env.dbpassword || "NewHouse";
console.log(dbuser);

var mongodbUri =
    "mongodb://" +
    dbuser +
    ":" +
    dbpass +
    "@ds055654-a1.mongolab.com:55654/heroku_5rsns3d2?replicaSet=rs-ds055654";
var mongooseUri = uriUtil.formatMongoose(mongodbUri);

console.log("Mongolab URI " + process.env.MONGOLAB_URI);

mongoose.connect(process.env.MONGOLAB_URI || mongooseUri, options);
exports.connection = mongoose.connection;

//New Schema Work on Old Models
//Old Schema Models
const lineupsSchema = require('./lineup');
const dpSchema = require("./dataPoint");
const autoDpSchema = require("./autoDataPoint");
const statDpSchema = require("./statDataPoint");
const teamSchema = require("./team");

var teamModel = mongoose.model("teams", teamSchema);

//Addition of Static method
dpSchema.statics.findByPlayerName = function(name, cb) {
    this.find({ player: new RegExp(player, "i") }, cb);
};

exports.LineupsSchema = lineupsSchema;
exports.DataSchema = dpSchema;
exports.AutoDataSchema = autoDpSchema;
exports.StatDataModel = statDpSchema;
exports.teamModel = teamModel;

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function callback() {
    console.log("Database Esta Connected");
});