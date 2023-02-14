const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const State = require('../models/State');
const User = require('../models/User');
const Category = require('../models/Category');
const Ad = require('../models/Ad');
const {validationResult, matchedData} = require('express-validator');


module.exports={
    getStates: async(req, res)=>{
        let states = await State.find();
        res.json({
            states: states
        })
    },
    info: async(req, res)=>{
        let token = req.query.token; //pegando o token que vem pela requisição para usar o model para pegar o usuário
        const user = await User.findOne({token: token});//pegando usuário
        const state = await State.findById(user.state);//pegando o estado do usuário
        const ads = await Ad.find({idUSer: user._id.toString()});//pegando os anúncios do usuário

        let adList = []; //array que armazena as informações de cada anuncio

        for(let i in ads){
            const cat = await Category.findById(ads[i].category);
            adList.push({
                id: ads[i]._id,
                status: ads[i].status,
                image: ads[i].image,
                dateCreated: ads[i].dateCreated,
                title: ads[i].title,
                priceNegotiable: ads[i].priceNegotiable,
                description: ads[i].description,
                views: ads[i].views,
                category: cat.slug
            });

        }
        res.json({
            name: user.name,
            email: user.email,
            state: state.name,
            ads: adList
        });
    },
    editAction: async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            res.json({error: errors.mapped()});
            return;
        }
        const data = matchedData(req);

        let updates = {};

        if(data.name) {
            updates.name = data.name;
        }

        if(data.email) {
            const emailCheck = await User.findOne({email: data.email});
            if(emailCheck) {
                res.json({error: 'E-mail já existente!'});
                return;
            }
            updates.email = data.email;
        }

        if(data.state) {
            if(mongoose.Types.ObjectId.isValid(data.state)) {
                const stateCheck = await State.findById(data.state);
                if(!stateCheck) {
                    res.json({error: 'Estado não existe'});
                    return;
                }
                updates.state = data.state;
            } else {
                res.json({error: 'Código de estado inválido'});
                return;
            }
        }

        if(data.password) {
            updates.passwordHash = await bcrypt.hash(data.password, 10);
        }
        
        await User.findOneAndUpdate({token: data.token}, {$set: updates});

        res.json({});
    }
};