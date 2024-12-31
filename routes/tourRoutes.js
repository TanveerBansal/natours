const express = require("express")
const router = express.Router()
const { checkId, checkBody, aliasTopTours, getMonthlyPlan, getTourStats, getAllTours, createTour, getTour, updateTour, deleteTour } = require("../controllers/tourController")



//param middleware
// router.param("id", checkId )

router.route("/top-5-cheap").get(aliasTopTours,getAllTours)
router.route("/tour-stats").get(getTourStats)
router.route("/monthly-plan/:year").get(getMonthlyPlan)

router.route('/').get(getAllTours).post(createTour)
router.route('/:id').get(getTour).patch(updateTour).delete(deleteTour)

module.exports = router