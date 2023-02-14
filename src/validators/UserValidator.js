//realiza a validação: definimos regras em que cada processo, como o signup, deve seguir

const { checkSchema } = require("express-validator")

module.exports={
    editAction: checkSchema({
        token:{
            notEmpty: true
        },
        name:{
            optional: true, //para mudar uma informação do usuário é interessante que enviemos apenas a informaçõa que vamos modificar, as outras não são obrigatórias
            trim:true,
            isLength:{
                options:{min:2}
            },
            errorMessage:"Nome precisa ter ao menos 2 caracteres"
        },
        email:{
            optional: true,
            isEmail: true,
            normalizeEmail: true, //realiza trim, coloca todos os caracteres em minúsculo, etc
            errorMessage: "E-mail inválido"
        },
        password:{
            optional: true,
            isLength:{
                options:{min:2}
            },
            errorMessage:"Senha precisa ter ao menos 2 caracteres"
        },
        state:{
            optional: true,
            notEmpty: true,
            errorMessage:"Estado não preenchido"
        }
    })
}