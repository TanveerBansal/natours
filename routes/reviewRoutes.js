const express = require("express")
const reviewController = require("../controllers/reviewController")
const authController = require("../controllers/authController")

// this merge params here is used as our route is in tourRouter so we need to get access of that route params
const router = express.Router({ mergeParams: true })

router.route("/").get(reviewController.getAllReviews).post(authController.protect, reviewController.createReview)


module.exports = router