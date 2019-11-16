const express = require("express");
const bodyParser = require("body-parser");
const redis = require("redis");
const session = require("express-session");
const redisStore = require("connect-redis")(session);
const cookieParser = require("cookie-parser");
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const client = redis.createClient();
const router = express.Router();
const db = require("./db");
const path = require("path");

// app.set('views', path.join(__dirname, 'views'));
// app.engine('html', require('ejs').renderFile);

// app.use(express.static(path.join(__dirname, 'views')));
//app.use(cors({credentials: true}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static(__dirname + "/views/"));
app.use(express.static(__dirname + "/views/js"));
app.use(express.static(__dirname + "/views/css"));

// session middleware
var secret = '4hKRFhSFBWHaZT3zwDFE';
// app.use(
//   session({
//     secret: "4hKRFhSFBWHaZT3zwDFE",
//     store: new redisStore({
//       host: "localhost",
//       port: 6379,
//       client: client,
//       ttl: 10000
//     }),
//     saveUninitialized: false,
//     resave: false
//   })
// );

// include cookies for session
// app.use(cookieParser("secretSign#143_!223"));

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
  // if (req.decoded) {
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
  // if (req.decoded) {
  res.sendFile("dashboard.html", { root: __dirname + "/views" });
  // }
  // return res.redirect('/');
});

/**
 * Sign up, add new user
 */

app.post("/user", async (req, res) => {
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
    res.json({ error: false, message: "User added.", hash: response.hash });
  }
});

/**
 * get public credit info
 */

app.get("/public/credit", async (req, res) => {
  let response = await db.getCreditData();
  if (response.error) {
    return res.json({ error: true, message: "failure" });
  }
  res.json({ error: false, data: response.data, message: "success" });
});



/**
 * Login to the system
 */

app.post("/login", async (req, res) => {
  let data = req.body;
  let response = await db.login(data);
  if (response.error) {
    return res.json({ error: true, message: "Invalid user" });
  }
  // add session info here
  // set session
  let resp = {
    userId: response.data.userId,
    email: response.data.email,
    publicKey: response.data.accountAddress,
    role: response.data.role
  };
  var token = jwt.sign(resp,secret, {
    expiresIn: 14400 // expires in 1 hours
});
  res.json({
    error: false,
    message: "User logged in.",
    token: token,
    data: response.data    
  });
});

/**
 * Get listings available for credit buying
 */

router.get("/property/listing", async (req, res) => {
  // check session and based on user id and email
  // extract the contacts
  if (req.decoded && req.decoded.role === 'company') {
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
  if (req.decoded && req.decoded.role === 'landowner') {
    let response = await db.getMyListing(req.decoded);
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
  if (req.decoded && req.decoded.role === 'landowner') {
    let response = await db.createProperty(req.decoded, req.body);
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
    if (req.decoded && req.decoded.role === 'company') {
    let response = await db.buyPropertyForCredit(req.decoded, req.body.propertyId);
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
  if (req.decoded) {
    let data = req.decoded;
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
 * Logout the user
 */

app.get("/logout", (req, res) => {
  res.redirect("/");
});

app.use(require('./tokenValidator')); //middleware to authenticate token
app.use("/api", router);

app.listen(process.env.PORT || 3000);
console.log("Listening on " + (process.env.PORT || 3000) + " port");
