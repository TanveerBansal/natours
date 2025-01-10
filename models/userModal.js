const { default: mongoose } = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please, tell us your name!"],
        // trim: true,
        maxLength: [20, "A name user not exceed then 20 characters"]
    },
    email: {
        type: String,
        required: [true, "Please, provide your email"],
        // trim: true,
        unique: true,
        lowercase: true,
        // validate:{
        //     validator:function(value){
        //         const pattern = /[a-b0-9]+@+[a-b]+.+[a-b]/
        // }
        validate: [validator.isEmail, "Please provide a valid email"]
    },
    photo: {
        type: String,
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        // trim: true,
        minLength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, "Please conform your password"],
        // trim: true,
        validate: {
            //this only works on CREATE and SAVE
            validator: function (val) {
                return val === this.password
            },
            message: "Passwords are not same"
    
        }
    },
})

//this pre() hook is lies between getting the data from the input feild and before saving the document
userSchema.pre('save', async function(next){
    //only run this fn if password is actually modified
    if(!this.isModified("password")) return next()
    
    //hash the password with  12 
    this.password = await bcrypt.hash(this.password, 10)

    //delete the passwordConfirm field
    this.passwordConfirm = undefined
    next()
})

userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword)
}
// OR
// userSchema.method("correctPassword",async function(candidatePassword, userPassword){
//     return await bcrypt.compare(candidatePassword, userPassword)
// })
const User = mongoose.model("User", userSchema)
module.exports = User