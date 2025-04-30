const express = require("express")
const reviewController = require("../controllers/reviewController")
const authController = require("../controllers/authController")

// this merge params here is used as our route is in tourRouter so we need to get access of that route params
const router = express.Router({ mergeParams: true })


router.use(authController.protect)


router.route("/").get(reviewController.getAllReviews).post(authController.restrictTo("user"),reviewController.setTourUserIds, reviewController.createReview)
router.route("/:id").get(reviewController.getReview).delete(authController.restrictTo("user","admin"),reviewController.deleteReview).patch(authController.restrictTo("user","admin"),reviewController.updateReview)


module.exports = router