import session from "express-session";

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET as any,
  resave: false,
  saveUninitialized: false,
});
