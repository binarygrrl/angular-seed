const _ = require("lodash");
const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
var express = require("express");
var path = require("path");
//var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
const MongoStore = require("connect-mongo")(session);
const connection = require("./database").connection;

var morgan = require("morgan");
var flash = require("connect-flash");
var session = require("express-session");

var scraper = require("./routes/index");
var teamApi = require("./routes/api");
const apiRoutes = require("./routes/api");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));

app.use(morgan("dev"));
app.use(cookieParser());
app.use(bodyParser());

app.use("/", routes);
app.use("/api/team", teamApi);
app.use("/scraper", scraper);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

/// error handlers
app.use(function(err, req, res, next) {
    const isApi = req.originalUrl.includes("api");
    if (!isApi) {
        return next(err);
    }
    next(err);
});

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render("error.jade", {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render("error.jade", {
        message: err.message,
        error: {}
    });
});

module.exports = app;



//"start": "http-server -a localhost -p 8000 -c-1 ./app",