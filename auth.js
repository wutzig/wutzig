const passport = require('passport')
const LocalStrategy = require('passport-local')
const session = require('express-session')
const argon2i = require('argon2-ffi').argon2i
const MongoStore = require('connect-mongo')(session)

module.exports = function(app, User, connection){
    const sessionStore = new MongoStore({mongooseConnection: connection, collection: 'sessions'})
    app.use(session({
        secret: 'whatever',
        resave: false,
        saveUninitialized: true,
        cookie: {secure: false, maxAge: 1000 * 120},
        store: sessionStore
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    passport.serializeUser((user, done) => done(null, user._id));
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            err ? done(err) : done(null, user)
        })
    })
    passport.use(new LocalStrategy(function(username, password, done){
        User.findOne({ username: username }, function(err, user) {
            if(err) return done(err);
            if(!user) return done(null, false)
            argon2i.verify(user.password, password).then(match => {
                return match ? done(null, user) : done(null, false);
            });
        })
    }))
}