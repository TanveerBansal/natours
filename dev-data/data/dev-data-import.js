const fs = require("fs")
const mongoose = require("mongoose")
const Tour = require("../../models/tourModel")
const User = require("../../models/userModal")
const Review = require("../../models/reviewModel")
const dotenv = require("dotenv")
const { exit } = require("process")
dotenv.config({ path: "./config.env" })


// const DB = process.env.DATABASE_LOCAL
const DB = process.env.DATABASE_ATLAS

mongoose.connect(DB)
    .then((con) => {
        console.log("Db connection sucessful")
    })
    .catch((err) => console.log(err.message))



//READ FILE

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'))

//add
const importData = async () => {

try {
    const newTour = await Tour.create(tours)
    const newUser = await User.create(users, {validateBeforeSave: false})
    const newReview = await Review.create(reviews)
    console.log("done");
    
} catch (err) {
    console.log(err);

}
finally{
    process.exit()
}
}
//delete
const deleteData = async () => {

try {
    await Tour.deleteMany()
    await User.deleteMany()
    await Review.deleteMany()
    console.log("data deleted successfully");
} catch (err) {
    console.log(err);
}
finally{
    process.exit()
}
}


if (process.argv[2] === "--import") importData()
else if (process.argv[2] === "--delete") deleteData()




// ASYNC METHOD-----
// fs.readFile(`${__dirname}/tours-simple.json`, 'utf-8', (err, data) => {
//     if (err) console.log(err);

//     const tours = JSON.parse(data)

//     //add
//     const importData = async () => {

//         try {
//             const newTour = await Tour.create(tours)
//             console.log("done");

//         } catch (err) {
//             console.log(err);

//         }
//         finally {
//             process.exit()
//         }
//     }
//     //delete
//     const deleteData = async () => {

//         try {
//             await Tour.deleteMany()
//             console.log("data deleted successfully");
//         } catch (err) {
//             console.log(err);
//         }
//         finally {
//             process.exit()
//         }
//     }


//     if (process.argv[2] === "--import") importData()
//     else if (process.argv[2] === "--delete") deleteData()

// })



//console.log(process.argv) //return arr in which tells the path of each command