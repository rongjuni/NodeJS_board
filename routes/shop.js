// //moving
// var router = require("express").Router();

// function loginTrue(req, res, next) {
//   if (req.user) {
//     //if logged in, req.user is alway there
//     next();
//   } else {
//     res.send("shop - please log in ");
//   }
// }

// // if router.get is too many, cannot add 'loginTrue' for all. Then use below
// router.use(loginTrue);
// //or router.use('/shirts', loginTrue);

// // app.get("/shop/shirts", (req, res) => { // app (x), Router(o)
// router.get("/shop/shirts", (req, res) => {
//   res.send("We're selling Shirts");
// });

// router.get("/shop/pants", (req, res) => {
//   res.send("Pants Pants Selling");
// });

// module.exports = router;

// // duplicating url can be removed. check server.js
// // router.get("/shirts", (req, res) => {
// //   res.send("We're selling Shirts");
// // });

// // router.get("/pants", (req, res) => {
// //   res.send("Pants Pants Selling");
// // });
