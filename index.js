const express = require("express");
const bodyParser = require("body-parser");
const redis = require("redis");
const session = require("express-session");
const redisStore = require("connect-redis")(session);
const cookieParser = require("cookie-parser");
const app = express();
const client = redis.createClient();
const router = express.Router();
const db = require("./db");
const path = require("path");

// app.set('views', path.join(__dirname, 'views'));
// app.engine('html', require('ejs').renderFile);

// app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(__dirname + "/views/"));
app.use(express.static(__dirname + "/views/js"));
app.use(express.static(__dirname + "/views/css"));

// session middleware
app.use(
  session({
    secret: "4hKRFhSFBWHaZT3zwDFE",
    store: new redisStore({
      host: "localhost",
      port: 6379,
      client: client,
      ttl: 10000
    }),
    saveUninitialized: false,
    resave: false
  })
);

// include cookies for session
app.use(cookieParser("secretSign#143_!223"));

// add the middleware
app.use(bodyParser.json());

// routers

/**
 * Home page route
 */
app.get("/", (req, res) => {
  res.sendFile("home.html", { root: __dirname + "/views" });
});

app.get("/login", (req, res) => {
  // if (req.session.key) {
  res.sendFile("newlogin.html", { root: __dirname + "/views" });
  // }
  // return res.redirect('/');
});

app.get("/register", (req, res) => {
  res.sendFile("newregister.html", { root: __dirname + "/views" });
});

app.get("/mailbox", (req, res) => {
  res.sendFile("mailbox.html", { root: __dirname + "/views" });
});

app.get("/dashboard", (req, res) => {
  // if (req.session.key) {
  res.sendFile("dashboard.html", { root: __dirname + "/views" });
  // }
  // return res.redirect('/');
});

/**
 * Sign up, add new user
 */

router.post("/user", async (req, res) => {
  // add new user
  let data = req.body;
  //check if user already exists
  let existance = await db.checkUserEmail(data);
  if (existance.error) {
    res.json({ error: true, message: "User already exists." });
  } else {
    // verify the payload
    let response = await db.addUser(data);
    if (response.error) {
      return res.json({ error: true, message: "Error adding user." });
    }
    // set session
    req.session.key = {
      userId: response.data._id,
      email: response.data.email,
      publicKey: response.data.accountAddress,
      role: response.data.role
    };
    res.json({ error: false, message: "User added.", hash: response.hash });
  }
});

/**
 * Login to the system
 */

router.post("/login", async (req, res) => {
  let data = req.body;
  let response = await db.login(data);
  if (response.error) {
    return res.json({ error: true, message: "Invalid user" });
  }
  // add session info here
  // set session
  req.session.key = {
    userId: response.data.userId,
    email: response.data.email,
    publicKey: response.data.accountAddress,
    role: response.data.role
  };
  res.json({
    error: false,
    message: "User logged in.",
    data: response.data    
  });
});

/**
 * Get listings available for credit buying
 */

router.get("/property/listing", async (req, res) => {
  // check session and based on user id and email
  // extract the contacts
  if (req.session.key && req.session.key.role === 'company') {
    let response = await db.getListing();
    if (response.error) {
      return res.json({ error: true, message: "failure" });
    }
    res.json({ error: false, message: "success", data: response.data });
  } else {
    return res.json({ error: true, message: "Invalid session" });
  }
});

/**
 * get listings created by farmers/landowners
 */

router.get("/property/list", async (req, res) => {
  // check session and based on user id and email
  // extract the contacts
  if (req.session.key && req.session.key.role === 'landowner') {
    let response = await db.getMyListing(req.session.key);
    if (response.error) {
      return res.json({ error: true, message: "failure" });
    }
    res.json({ error: false, message: "success", data: response.data });
  } else {
    return res.json({ error: true, message: "Invalid session" });
  }
});

/**
 * property creation
 */

 router.post('/property', async (req,res) => {
  if (req.session.key && req.session.key.role === 'landowner') {
    let response = await db.createProperty(req.session.key, req.body);
    if (response.error) {
      return res.json({ error: true, message: "failure" });
    }
    res.json({ error: false, message: "success", data: response.data });
  } else {
    return res.json({ error: true, message: "Invalid session" });
  }
 });

 /**
  * buy propery to get carbon credit
  */

  router.post('/property/buy', async(req,res) => {
    if (req.session.key && req.session.key.role === 'company') {
    let response = await db.buyPropertyForCredit(req.session.key, req.body.recieverEmail,req.body.propertyId);
      if (response.error) {
        return res.json({ error: true, message: "failure" });
      }
      res.json({ error: false, message: "success", data: response.data });
    } else {
      return res.json({ error: true, message: "Invalid session" });
    }
  });


/**
 * get company credit 
 */

router.get("/company/credit", async (req, res) => {
  // create a contact request
  if (req.session.key) {
    let data = req.session.key;
    // add contact email information
    let response = await db.getCompanyCredit(data);
    if (response.error) {
      return res.json({ error: true, message: "failure" });
    }
    res.json({ error: false, message: "success" });
  } else {
    return res.json({ error: true, message: "Invalid session" });
  }
});

/**
 * get public credit info
 */

router.get("/public/credit", async (req, res) => {
  let response = await db.getCreditData();
  if (response.error) {
    return res.json({ error: true, message: "failure" });
  }
  res.json({ error: false, message: "success" });
});

/**
 * Logout the user
 */

app.get("/logout", (req, res) => {
  if (req.session.key) {
    req.session.destroy();
    res.redirect("/");
  } else {
    res.redirect("/");
  }
});

app.use("/api", router);

app.listen(process.env.PORT || 3000);
console.log("Listening on " + (process.env.PORT || 3000) + " port");
