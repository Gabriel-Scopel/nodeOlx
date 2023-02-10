require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileupload = require('express-fileupload');
const apiRoutes = require('./src/routes');

mongoose.set("strictQuery", true);

//conexão com o banco de dados mongoose
mongoose.connect(process.env.DATABASE,{
    useNewUrlParser: true,
    //useFindAndModify: false,
    useUnifiedTopology: true
});

mongoose.Promise = global.Promise;
mongoose.connection.on('error', (error)=>{
    console.log('Erro: ', error.message)
});


//criando e configurando o servidor:
const server = express();
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({extended: true}));
server.use(fileupload());

server.use(express.static(__dirname+'/public'));


//rotas
server.use('/', apiRoutes);

server.listen(process.env.PORT, ()=>{
    console.log(`Rodando no endereço: ${process.env.BASE}`);
});