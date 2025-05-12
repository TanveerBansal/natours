const express = require("express")
const router = express.Router()
const { checkId, checkBody, aliasTopTours, getMonthlyPlan, getTourStats,
    getAllTours, createTour, getTour, updateTour, deleteTour,
    getToursWithIn, getDistances } = require("../controllers/tourController")
const authController = require("../controllers/authController")
const { createReview } = require("../controllers/reviewController")
const reviewRouter = require("./reviewRoutes")


//param middleware
// router.param("id", checkId )

// NESTED ROUTE
// example:-
// POST /tour/:tourId/reviews
// GET /tour/:tourId/reviews
// GET /tour/:tourId/reviews/:reviewId
router.use("/:tourId/reviews", reviewRouter)



router.route("/top-5-cheap").get(aliasTopTours, getAllTours)
router.route("/tour-stats").get(getTourStats)
router.route("/monthly-plan/:year").get(authController.protect, authController.restrictTo("admin", "lead-guide", "guide"), getMonthlyPlan)

router.route('/').get(getAllTours).post(authController.protect, authController.restrictTo("admin", "lead-guide"), createTour)
router.route('/:id').get(getTour).patch(authController.protect, authController.restrictTo("admin", "lead-guide"), updateTour).delete(authController.protect, authController.restrictTo("admin", "lead-guide"), deleteTour)

router.route("/tours-within/:distance/center/:latlng/unit/:unit").get(getToursWithIn)
router.route("/distances/:latlng/unit/:unit").get(getDistances)

module.exports = router