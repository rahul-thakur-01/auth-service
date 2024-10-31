import { checkSchema } from 'express-validator'

export default checkSchema({
    email: {
        errorMessage: 'Email is required !',
        notEmpty: true,
        trim: true,
    },
    password: {
        isLength: {
            options: { min: 8 },
            errorMessage: 'Password should be atleast 8 characters long !',
        },
    },
})

// import { body } from "express-validator";
// export default [

//     body("email")
//     .notEmpty().withMessage("Email is required !"),

//     body("firstName")
//     .notEmpty().withMessage("First name is required !")
//     .isAlpha().withMessage("First name should contain only alphabets !"),

// ];
