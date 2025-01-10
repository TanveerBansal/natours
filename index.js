const express = require("express")
const morgan = require("morgan")

const tourRouter = require("./routes/tourRoutes")
const userRouter = require("./routes/userRoutes")
const AppError = require("./utils/appError")
const globalErrorHandler = require("./controllers/errorController")

const app = express()


//1) MIDDLEWARE
console.log(process.env.NODE_ENV)
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"))
}


app.use(express.json()) //it is type of middleware

app.use(express.static(`${__dirname}/public`))

// app.use((req,res,next)=>{
//     console.log("Hello from middleware 1");
//     next()
// })

app.use((req, res, next) => {
    req.requestTime = new Date().toLocaleTimeString()
    // console.log(req.headers)
    next()
})

/*
app.get("/", (req, res) => {
    // res.status(200).send("Hello from server")
    res.status(200).json({ message: "Hello from server", app: "Natours" });
})
app.post("/", (req, res) => {
    res.status(200).json({ message: "you can post at this endpoint..." });
})
*/




//3) ROUTES

// app.get('/api/v1/tours', getAllTours )
// app.get('/api/v1/tours/:id',getTour )
// app.post('/api/v1/tours', createTour)
// app.patch("/api/v1/tours/:id",updateTour )
// app.delete("/api/v1/tours/:id", deleteTour)

// app.route('/api/v1/tours').get(getAllTours).post(createTour)
// app.route('/api/v1/tours/:id').get(getTour).patch(updateTour).delete(deleteTour)

// app.route("/api/v1/users").get(getAllUsers).post(createUser)
// app.route("/api/v1/users/:id").get(getUser).patch(updateUser).delete(deleteUser)








app.use("/api/v1/users", userRouter)
app.use("/api/v1/tours", tourRouter)

// RESPONSE FOR UNDEFINED ROUTES
// app.all("*", (req, res) => {
//     res.status(404).json({
//         success: "fail",
//         message: `Can't find the ${req.originalUrl} on this server`
//     })
// })

/*
app.all("*", (req, res, next) => {
    //error handled with global error handler middleware
    const err = new Error(`Can't find the ${req.originalUrl} on this server`)
    err.statusCode = 404
    err.status = "fail"

    next(err)
    //when we pass an argument in next fn, express automatically understand its is an error and pass it to error handle middleware
})
*/

app.all("*", (req, res, next) => {

    next(new AppError(`Can't find the ${req.originalUrl} on this server`, 404))
})



// GLOBAL ERROR HANGLER MIDDLEWARE
app.use(globalErrorHandler)

module.exports = app