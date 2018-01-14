const userSchema = new Schema({
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