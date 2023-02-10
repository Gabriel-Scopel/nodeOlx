const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const modelSchema = new mongoose.Schema({
    name : String,
});

const modelName = 'State';

//verificando se já há um model 'State' criado e então reaproveitando ele, se não ele é criado
if(mongoose.connection && mongoose.connection.models[modelName]){
    module.exports = mongoose.connection.models[modelName];
}else{
    module.exports = mongoose.model(modelName,modelSchema);
}