//realiza a validação: definimos regras em que cada processo, como o signup, deve seguir

const { checkSchema } = require("express-validator")

module.exports={
    signup: checkSchema({
        name:{
            trim:true,
            isLength:{
                options:{min:2}
            },
            errorMessage:"Nome precisa ter ao menos 2 caracteres"
        },
        email:{
            isEmail: true,
            normalizeEmail: true, //realiza trim, coloca todos os caracteres em minúsculo, etc
            errorMessage: "E-mail inválido"
        },
        password:{
            isLength:{
                options:{min:2}
            },
            errorMessage:"Senha precisa ter ao menos 2 caracteres"
        },
        state:{
            notEmpty: true,
            errorMessage:"Estado não preenchido"
        }
    }),
    signin: checkSchema({
        email:{
            isEmail: true,
            normalizeEmail: true, //realiza trim, coloca todos os caracteres em minúsculo, etc
            errorMessage: "E-mail inválido"
        },
        password:{
            isLength:{
                options:{min:2}
            },
            errorMessage:"Senha precisa ter ao menos 2 caracteres"
        }
    })
}