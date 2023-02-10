const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const modelSchema = new mongoose.Schema({
    name, slug: String,
});

const modelName = 'Category';

//verificando se já há um model 'Category' criado e então reaproveitando ele, se não ele é criado
if(mongoose.connection && mongoose.connection.models[modelName]){
    module.exports = mongoose.connection.models[modelName];
}else{
    module.exports = mongoose.model(modelName,modelSchema);
}