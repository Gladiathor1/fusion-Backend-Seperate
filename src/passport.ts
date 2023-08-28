import bcrypt from 'bcrypt';
import crypto from 'crypto';
import passport from 'passport';
import session from 'express-session';
import createSQLiteSessionStore from 'connect-sqlite3';
import { Strategy as LocalStrategy } from 'passport-local';
import { config } from './config';
import ChatServer from '.';

const secret = config.authSecret;

export function configurePassport(context:ChatServer) {
    const SQLiteStore = createSQLiteSessionStore(session);
    const sessionStore = new SQLiteStore({ db: 'sessions.db' });

    passport.use(new LocalStrategy(async (email, password, cb) => {
        const user = await context.database.getUser(email);

        if (!user) {
            return cb(null, false, { message: 'Incorrect username or password.' });
        }

        try {
            const isPasswordCorrect = user.salt
                ? crypto.timingSafeEqual(user.passwordHash, crypto.pbkdf2Sync(password, user.salt, 310000, 32, 'sha256'))
                : await bcrypt.compare(password, user.passwordHash.toString());

            if (!isPasswordCorrect) {
                return cb(null, false, { message: 'Incorrect username or password.' });
            }

            return cb(null, user);
        } catch (e) {
            cb(e);
        }
    }));

    passport.serializeUser((user:any, cb) => {
        process.nextTick(() => {
            cb(null, { id: user.id, username: user.username });
        });
    });

    passport.deserializeUser((user:any, cb) => {
        process.nextTick(() => {
            cb(null, user);
        });
    });

    context.app.use(session({
        secret,
        resave: false,
        saveUninitialized: false,
        store: sessionStore as any,
        cookie: {
            secure: true,
            httpOnly: true,
            sameSite: 'none',
        }
    }));

    context.app.use(passport.authenticate('session'));


    // Authentication endpoints
    context.app.post('/chatapi/login', passport.authenticate('local'), (req, res) => {
        res.json({ session: req.session });
    });

    context.app.post('/chatapi/register', async (req, res) => {
        const { username, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 12);

        try {
            await context.database.createUser(username, Buffer.from(hashedPassword));
            res.json({ session: req.session });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Registration failed' });
        }
    });

    context.app.all('/chatapi/logout', (req, res, next) => {
        req.logout((err) => {
            if (err) {
                return next(err);
            }
        });
        res.json({ session: req.session });
    });
}
