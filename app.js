require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Order = require("./order");
const app = express();

const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

// Add session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://shakthikannan:sYXU6wn0aCs1H0zf@cluster0.itpwjzc.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
  }
);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:8080/auth/google/home",
    },
    async function (accessToken, refreshToken, profile, cb) {
      const id = profile.id;
      const uname = profile.displayName;
      console.log(profile);
      const currentuser = await User.findOne({ googleId: id });
      if (!currentuser) {
        const user = await User.create({ googleId: id, username: uname });
        return cb(null, user);
      }
      return cb(null, currentuser);
    }
  )
);
// Define your routes

// Initialize Google OAuth authentication
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

// Google OAuth callback
app.get(
  "/auth/google/home",
  passport.authenticate("google", { failureRedirect: "/" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/home");
  }
);
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});

app.get("/home", (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(__dirname + "/index.html");
  }
});

app.get("/contact", (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(__dirname + "/contact.html");
  }
});

app.post("/order", async (req, res) => {
  if (req.isAuthenticated()) {
    const username = req.user.username;
    const item = req.body.itemName;

    // Parse the form data to get the ordered items (as shown in previous responses)
    console.log(req.user);
    console.log(item);

    const newOrder = await Order.create({
      username: username,
      item: item,
    });

    await newOrder.save();

    // Emit a Socket.io event to notify the admin page of the new order
    io.emit("newOrder", newOrder);

    res.redirect("/home");
  }
});

app.listen(8080, () => {
  console.log("Server up and running");
});
