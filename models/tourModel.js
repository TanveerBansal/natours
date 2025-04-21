const mongoose = require("mongoose")
const slugify = require('slugify')
const validator = require('validator')
const UserModel = require("./userModal")

const tourSchema = new mongoose.Schema({
    name: {
        type: String, required: [true, "A tour must have name"], unique: true, trim: true,
        maxLength: [40, "A tour name must be less or equal then 40 character"],
        minLength: [10, "A tour name must be more or equal then 10 character"],
    },
    slug: { type: String },
    duration: { type: Number, required: [true, "A tour must have duration"] },
    maxGroupSize: { type: Number, required: [true, "A tour must have GroupSize"] },
    difficulty: {
        type: String, required: [true, "A tour must have difficulty"],
        enum: {
            values: ["easy", "medium", "difficult"],
            message: "Difficulty is eihter: easy, medium, dufficult"
        }
    },
    ratingsAverage: {
        type: Number, default: 4.5,
        min: [1, "A tour rating can't be less than 1"],
        max: [5, "A tour rating can't be exceed than 5"],
    },
    ratingsQuantity: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
    price: { type: Number, required: [true, "A tour must have price"] },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                // 'this'  ONLY POINT TO CURR DOC ON NEW DOC CREATION (not work on update)
                // return this.priceDiscount > this.price
                return val < this.price
            },
            message: "A discount price ({VALUE}) should be below regular price"
        }
    },
    summary: { type: String, trim: true, required: [true, "A tour must have summary"] },
    description: { type: String, trim: true },
    imageCover: { type: String, required: [true, "A tour must have cover image"] },
    images: { type: [String] },
    createdAt: { type: Date, default: Date.now(), select: false },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
    startLocation: {
        type: {
            type: String,
            default: "Point",
            enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [{
        type: {
            type: String,
            default: "Point",
            enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
    }],
    guides: [{
        type: mongoose.Schema.ObjectId,
        ref: "User"
    }]
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7
})

//VIRTUAL REVIEWA POPULATE
tourSchema.virtual('reviews',{
    ref:"Review",
    foreignField: "tour",
    localField: "_id"
})


// DOCUMENT MIDDLEWARE: runs before save() create() not for insert
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true })
    next()
})

//middle to embedded the guides data through ids
// tourSchema.pre('save', async function (next) {
//     const guidePromises = this.guides.map(async id => await UserModel.findById(id))
//     this.guides = await Promise.all(guidePromises)
//     next()
// })


// tourSchema.pre('save', function (next) {
//     console.log("Will save document...");
//     next()
// })
// tourSchema.post('save', function (doc,next) {
//     console.log(doc);  
//     next()
// })

// QUERY MIDDLEWARE
// tourSchema.pre('find', function(next){
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } })
    // this.start = Date.now()
    next()
})
tourSchema.pre(/^find/, function (next) {
    this.populate({ path: "guides", select: "-__v -role" });
    next()
})
// tourSchema.post(/^find/, function(doc,next){
// console.log(`${Date.now() - this.start} millisecond`);
// console.log(doc);
//     next()
// })

//AGGREGATE MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
    console.log(this.pipeline())
    next()
})

const Tour = mongoose.model("Tour", tourSchema)

module.exports = Tour