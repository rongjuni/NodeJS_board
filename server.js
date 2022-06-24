// environment variable - npm install dotenv

require("dotenv").config();

// npm install body-parser
const express = require("express");
const app = express();

//websoket io to communicate with server live. write below const app. and app.lisent => http.listen. html 하나 만들어서 거기서도 설치
//npm install socket.io
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

//To receive data from HTML readable
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// ejs - so html can read data
app.set("view engine", "ejs");

// middleware for CSS use
app.use("/public", express.static("public"));

// method-override to use method PUT and Delete in From Tag
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

// for login feature
// npm install passport passport-local express-session
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
app.use(
  session({ secret: "secretCode", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

//connectiong MongoDB
const MongoClient = require("mongodb").MongoClient;

var db;
MongoClient.connect(
  // "mongodb+srv://rongjuni:rongjuni@cluster0.v3x40.mongodb.net/?retryWrites=true&w=majority",
  process.env.DB_URL,
  (error, client) => {
    if (error) {
      return console.log(error);
    }

    // DB client link
    db = client.db("Todo_prac");

    // adding data to DB
    // db.collection("post").insertOne(
    // { name: "john", _id: 20 },
    // (error, result) => {
    // console.log("saved!");
    // }
    // );

    // app.listen(process.env.PORT, () => {
    http.listen(process.env.PORT, () => {
      console.log("Listening on 8080");
    });
  }
); //MongoClient.connect end

// socket run
app.get("/socket", loginTrue, (req, res) => {
  res.render("socket.ejs", { userIdData: req.user.id });
});
io.on("connection", function (socket) {
  console.log("connected to the socket");
  console.log(socket.id);

  // socket.on("room1-send", function (data) {
  //   io.to("room1").emit("broadcast", data);
  // });

  // socket.on("joinroom", function (data) {
  //   socket.join("room1", "let me enter room1");
  // });

  socket.on("user-send", function (data) {
    // console.log(data);
    io.emit("broadcast", data); //socket on in socket.ejs
    // io.to(socket.id).emit("broadcast", data); //socket on in socket.ejs. only chat to socket.id person
  });
});
// end socket run

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/write", (req, res) => {
  res.render("write.ejs");
});

app.get("/list", (req, res) => {
  //all data extracting
  db.collection("post")
    .find()
    .toArray((error, result) => {
      // console.log("list ", result);
      res.render("list.ejs", { posts: result });
    });
});

app.get("/search", (req, res) => {
  //indexing
  let searchCondition = [
    {
      $search: {
        index: "titleSearch",
        text: {
          query: req.query.value,
          path: "title",
        },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 10 },
    {
      $project: { title: 1, date: 1, _id: 1, score: { $meta: "searchScore" } },
    },
  ];

  db.collection("post")
    .aggregate(searchCondition)
    // .find({ title: / req.query.value /})
    // .find({ $text: { $search: req.query.value } })
    .toArray((error, result) => {
      console.log("search result ", result);
      if (result == true) {
        res.render("search.ejs", { searched: result });
      } else res.render("searchNotFound.ejs");
    });
});

app.post("/add", loginTrue, (req, res) => {
  res.render("writeAddSuccess.ejs");
  // console.log(req.body.title);
  // console.log(req.body.date);
  db.collection("counter").findOne(
    { name: "accumulated total post" },
    (err, result) => {
      // console.log(result.totalPost);
      // console.log("req user ", req.user);
      // console.log("req body ", req.body);
      var totalPostings = result.totalPost;

      var whatToBeSaved = {
        _id: totalPostings + 1,
        title: req.body.title,
        content: req.body.content,
        user: req.user._id,
        userName: req.user.id,
      };

      db.collection("post").insertOne(
        // { _id: totalPostings + 1, title: req.body.title, date: req.body.date },
        whatToBeSaved,
        (error, result) => {
          // console.log("error ? ", error);
          db.collection("counter").updateOne(
            { name: "accumulated total post" },
            { $inc: { totalPost: 1 } }, // One more curly bracket here. $set or $inc more in google. increase by 1
            (error, result) => {
              if (error) {
                return console.log(error);
              }
            }
          );
        }
      );
    }
  );
});

app.delete("/delete", (req, res) => {
  console.log("req.body._id before ", req.body._id);
  req.body._id = parseInt(req.body._id);
  console.log("req.body._id after ", req.user._id);

  // as add two paramter in object, delete one that satisfies both values
  let dataToBeDeleted = { _id: req.body._id, userName: req.user.id };

  // db.collection("post").deleteOne(req.body, (error, result) => {
  db.collection("post").deleteOne(dataToBeDeleted, (error, result) => {
    console.log("deleted");
    if (result) {
      console.log(result);
    }
    res.status(200).send({ message: "success" }); // assuming always success - code 200
    // res.status(400).send({ message: "fail" }); // assuming always fail - code 400
  });
});

app.get("/detail/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (err, result) => {
      // console.log("detail page ", result);

      db.collection("message")
        .find({ parent: req.params.id })
        .toArray((error, result2) => {
          console.log("message result2", result2);
          res.render("detail.ejs", { data: result, data2: result2 });
        });
    }
  );
  // res.writeHead(200, {
  //   Connection: "keep-alive",
  //   "Content-Type": "text/event-stream",
  //   "Cache-Control": "no-cache",
  // });
});

app.get("/edit/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (err, result) => {
      console.log(result);
      res.render("edit.ejs", { post: result });
    }
  );
});

app.put("/edit", (req, res) => {
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    (err, result) => {
      console.log("updated successfully");
      res.redirect("/list");
    }
  );
});

//adding login feature
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

// image upload and save
// npm install multer
let multer = require("multer");
const { callbackify } = require("util");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/image");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + "date" + new Date());
  },
  // filefilter: function (req, file, cb) { //only img file? doc files? pdf files?

  // },
});

// var storage = multer.memoryStorate({})
var upload = multer({ storage: storage });

app.get("/upload", (req, res) => {
  res.render("upload.ejs");
});
// app.post("/upload", upload.array("picture", 10), (req, res) => { // allows you to upload multiple files. html needs changes too
app.post("/upload", upload.single("picture"), (req, res) => {
  res.send("image sent");
});
app.get("/image/:imagename", (req, res) => {
  res.sendFile(__dirName + "/public/image/" + req.params.imagename);
});
//// image upload/save ending

//My page - login verification
app.get("/mypage", loginTrue, (req, res) => {
  console.log("req.user ", req.user);
  res.render("mypage.ejs", { userInfo: req.user });
});

function loginTrue(req, res, next) {
  if (req.user) {
    //if logged in, req.user is alway there
    next();
  } else {
    res.render("noLogin.ejs");
  }
}

// login check
passport.use(
  new LocalStrategy(
    {
      usernameField: "id", //in form, id
      passwordField: "pw", //in form, pw
      session: true,
      passReqToCallback: false, // if true, we can check more values by adding one more parameter in function below
    },
    function (idEntered, pwEntered, done) {
      console.log(idEntered, pwEntered);
      db.collection("login").findOne(
        { id: idEntered },
        function (error, result) {
          if (error) return done(error);

          if (!result)
            return done(null, false, { message: "Your ID does not exist" });
          if (pwEntered == result.pw) {
            return done(null, result); // result here goes to passport.serializeUser function (user)
          } else {
            return done(null, false, { message: "Wrong Password" });
          }
        }
      );
    }
  )
);

//adding session in cookie
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

//finding data with user.id above
passport.deserializeUser(function (id, done) {
  db.collection("login").findOne({ id: id }, (err, result) => {
    done(null, result);
  });
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/fail",
  }),
  (req, res) => {
    res.redirect("/list");
  }
);

//need above paragraph to make it work properly.
// add feature to confirm login id is not duplicate or not already registered
app.post("/register", (req, res) => {
  db.collection("login").findOne({ id: req.body.id }, (err, result) => {
    if (result) {
      res.redirect("/register/fail");
      // res.send("already exist");
    } else {
      db.collection("login").insertOne(
        { id: req.body.id, pw: req.body.pw },
        (err, result) => {
          res.redirect("/register/success");
        }
      );
    }
  });
});

app.get("/register/fail", (req, res) => {
  res.render("registerFail.ejs");
});

app.get("/register/success", (req, res) => {
  res.render("registerSuccess.ejs");
});

//moved to Routes folder
// app.get("/shop/shirts", (req, res) => {
//   res.send("We're selling Shirts");
// });
// app.get("/shop/pants", (req, res) => {
//   res.send("Pants Pants Selling");
// });

// instead, below. app.use = middle ware

// app.use("/shop", require("./routes/shop")); // if /shop is deleted, it can be added here
// app.use("/", require("./routes/shop.js"));
// app.use("/board/sub", require("./routes/board.js"));

//chatting - below login freature
const { ObjectId } = require("mongodb");
const { render } = require("ejs");

app.post("/chatroom", loginTrue, (req, res) => {
  var saving = {
    title: "random Chatroom",
    // member: [req.body.idChatted << || comes in string format. need to use objectId||, req.user._id],
    member: [ObjectId(req.body.idChatted), req.user._id],
    date: new Date(),
  };

  //chatting freature
  db.collection("chatroom")
    .insertOne(saving)
    .then((result) => {
      //without callback, use .then. same result
      res.send("success chat");
    });
});

app.get("/chatroom", loginTrue, (req, res) => {
  db.collection("chatroom")
    .find({ member: req.user._id })
    .toArray()
    .then((result) => {
      res.render("chat.ejs", { data: result });
    });
});

// saving chat message in DB
app.post("/message", (req, res) => {
  var toBeSaved = {
    parent: req.body.parent,
    content: req.body.content,
    userid: req.user._id,
    date: new Date(),
  };

  db.collection("message")
    .insertOne(toBeSaved)
    .then(() => {
      console.log("done done saving");
      res.send("saved in DB");
    });
});
// end-saving chat message in DB

// live updating chat "called Server Sent Event(SSE)"
app.get("/message/:id", loginTrue, function (req, res) {
  res.writeHead(200, {
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  db.collection("message")
    .find({ parent: req.params.id })
    .toArray()
    .then((result) => {
      res.write("event: test\n");
      res.write("data: " + JSON.stringify(result) + "\n\n");
    });

  // change in DB, DB lets know front end
  const pipeline = [
    {
      $match: { "fullDocument.parent": req.params.id }, // if this empty, it catches all change in DB. this only watches parent
    },
  ];
  const collection = db.collection("message");
  const changeStream = collection.watch(pipeline);
  changeStream.on("change", (result) => {
    console.log(result.fullDocument);
    res.write("event: test\n");
    res.write("data: " + JSON.stringify([result.fullDocument]) + "\n\n"); //as change happnes in DB, do this
  });
});

app.post("/commentpost", (req, res) => {
  let commentSave = {
    parent: req.body.parent,
    content: req.body.comment,
    userid: req.user._id,
    date: new Date(),
  };

  db.collection("message").insertOne(commentSave, (err, result) => {
    res.redirect("/list");
  });
});
