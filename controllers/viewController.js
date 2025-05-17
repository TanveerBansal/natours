const Tour = require('../models/tourModel')
const catchAsync = require('../utils/catchAsync')


exports.getOverview = catchAsync(async (req, res, next) => {
    //1 Get the tour data form the collection
    const tours = await Tour.find()
    // 2 Build template

    // 3 Render that template

    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    })
})
exports.getTour = catchAsync((req, res, next) => {
    res.status(200).render('tour', {
        title: 'The'
    })
})