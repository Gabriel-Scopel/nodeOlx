const mongoose = require('mongoose');
const {validationResult, matchedData} = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const State = require('../models/State');
module.exports = {
    signin: async(req, res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({error: errors.mapped()});
            return;
        }
        const data = matchedData(req);
        //validando o email
        const user = await User.findOne({email: data.email});
        if(!user){
            res.json({error:'E-mail e/ou senha incorretos'});
            return;
        }
        //validando a senha
        const match = await bcrypt.compare(data.password, user.passwordHash); //comparando a senha digitada com a senha do banco de dados
        if(!match){ //se a senha digitada e a do banco não forem compatíveis
            res.json({error:'E-mail e/ou senha incorretos' });
        }
        const playload = (Date.now() + Math.random()).toString();
        const token = await bcrypt.hash(playload, 10);
        user.token = token;//atuyalizando o token do usuário ao fazer login
        await user.save();
        res.json({token, email: data.email});
    },
    signup: async(req, res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({error: errors.mapped()});
            return;
        }
        const data = matchedData(req); //inserindo a variável data os dados do usuário

        const user = await User.findOne({ //procurando se há um email já cadastrado 
            email: data.email
        })
        if(user){
            res.json({
                error: {email:{msg:'E-mail já cadastrado.'}}
            });
            return;
        };
        //verificando se o estado existe
        if(mongoose.Types.ObjectId.isValid(data.state)){  //utilizando o mongoose para validar se o state dentro de data é do tipo objectId (assim que foi gravado no banco de dados, cada estado tem um id/token)
            const stateItem = await State.findById(data.state); //pegando o estado do banco
            if(!stateItem){
                res.json({
                    error: {state:{msg:'Estado não existe.'}}
                });
                return;
            }
        }else{
            res.json({
                error: {state:{msg:'Código de estado inválido.'}}
            });
            return;
        }

        //criando hash da senha
        const passwordHash = await bcrypt.hash(data.password, 10);
        const playload = (Date.now() + Math.random()).toString();
        const token = await bcrypt.hash(playload, 10);
        //criando novo usuário
        const newUser = new User({
            name: data.name,
            email: data.email,
            passwordHash: passwordHash,
            token:token,
            state: data.state
        });
        await newUser.save();
        
        res.json({token});
    }

};