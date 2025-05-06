const mongoose = require("mongoose")
const Tour = require("./tourModel")

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, "Review can not be empty!"],
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: "Tour",
        required: [true, "A review must belong to a tour."]
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "A review must belong to a user."]

    },
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    })


reviewSchema.index({tour:1,user:1},{unique:true})


reviewSchema.pre(/^find/, function (next) {
    // this.populate({path:"user",select:"name photo"})
    // this.populate({path:"tour",select:"name"})

    this.populate({ path: "user", select: "name photo" })
    next()
})


// STATIC METHOD to calculate the rating average
// syntax-> -schemaName-.static.-fnName-
reviewSchema.statics.calAvgRating = async function (tourId) {
    const stats = await this.aggregate([
        { $match: { tour: tourId } },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ])
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, { ratingsQuantity: stats[0].nRating, ratingsAverage: stats[0].avgRating })
    } else {
        await Tour.findByIdAndUpdate(tourId, { ratingsQuantity: 0, ratingsAverage: 4.5 })

    }
}

reviewSchema.post("save", function () {
    // this points to current review
    this.constructor.calAvgRating(this.tour)
})


// handling rating avg on updation and delete --------------------
// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre("/^findOneAnd/", async function (next) {
    // using this here, so that post method can access the resulted document
    // and using this.findOne, bcoz here this refer to current query
    this.r = await this.findOne()
    next()
})
reviewSchema.post("/^findOneAnd/", async function () {
    // await this.findOne does not work here as query already executed
    await this.r.constructor.calAvgRating(this.r.tour)
})

// end--------------------------


const Review = mongoose.model("Review", reviewSchema)

module.exports = Review