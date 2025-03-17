const nodemailer = require("nodemailer")

const sendEmail =async options =>{
    
// 1 Create mail transport
const transporter = nodemailer.createTransport({
    host:process.env.EMAIL_HOST,
    port:process.env.EMAIL_PORT,
    // secure: true,
    auth:{
        username: process.env.EMAIL_USERNAME,
        password: process.env.EMAIL_PASSWORD
    }
})
// 2 Define the mail options
const mailOptions = {
    from : "Tanveer Singh <singhtanveer020@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
}

// 3 Actually send the mail
await transporter.sendMail(mailOptions)
}

module.exports = sendEmail