var router = require("express").Router();

function loginTrue(req, res, next) {
  if (req.user) {
    //if logged in, req.user is alway there
    next();
  } else {
    res.send("Please log in first");
  }
}

// if router.get is too many, cannot add 'loginTrue' for all. Then use below
router.use(loginTrue);
//or router.use('/shirts', loginTrue);

// router.get("/board/sub/sports", (req, res) => {
// router.get("/sports", loginTrue, (req, res) => {
router.get("/sports", loginTrue, (req, res) => {
  res.send("sports board");
});

// router.get("/board/sub/game", (req, res) => {
// router.get("/game", loginTrue, (req, res) => {
router.get("/game", loginTrue, (req, res) => {
  res.send("game board");
});

module.exports = router;
