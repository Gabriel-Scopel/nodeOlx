const { v4: uuid } = require('uuid');//biblioteca para gerar um hash aleatório
const jimp = require('jimp'); //biblioteca para manipulação de imagens
const Category = require('../models/Category');
const User = require('../models/User');
const Ad = require('../models/Ad');
const stateModel = require('../models/State');


const addImage = async (buffer)=>{
    let newName = `${uuid()}.jpg`;
    let tmpImg = await jimp.read(buffer); //lendo a imagem com o jimp
    tmpImg.cover(500,500).quality(80).write(`./public/media/${newName}`); //redimentacionando a imagem, colocando boa qualidade e salvando em public/media
    return newName;
};

module.exports={
    getCategories: async(req, res)=>{
        const cats = await Category.find();
        let categories = [];
        for(let i in cats){
            categories.push({
                ...cats[i]._doc, //copiando o objeto encontrado no banco para dentro do array
                img: `${process.env.BASE}/assets/images/${cats[i].slug}.png` //montando a url a imagem
            });
        }
        
        res.json({categories});
    },
    addAction: async(req, res)=>{
        let {title,price,priceneg,desc,cat,token} = req.body;
        const user = await User.findOne({token: token}).exec();

        if(!title || !cat){
            res.json({error:" Título e/ou categoria não preenchidos"});
            return
        }
        if(cat.length<12){ //toda categoria tem 12 caracteres
            res.json({error:'categoria inexistente'});
            return;
        }
        const category = await Category.findById(cat);
        if(!category){
            res.json({error:'ID de categoria inexistente'});
            return;
        }

        if(price){
            price = price.replace('.','').replace(',','.').replace('R$', '');
            price = parseFloat(price);
        }else{
            price=0;
        }
        const newAd = new Ad();
        newAd.status = true;
        newAd.idUser = user._id;
        newAd.state = user.state;
        newAd.dateCreated = new Date();
        newAd.title = title;
        newAd.Category = cat;
        newAd.price = price;
        newAd.priceNegotiable = (priceneg=='true') ? true : false; //ele vem como string, por isso é necessário verificar se veio como "true" e então inserir como true boleano, se não como false
        newAd.description = desc;
        newAd.views = 0;

        if(req.files && req.files.img){
            if(req.files.img.length == undefined){ //se o usuário não enviar várias imagens, ela vem como objeto, portanto, o tamanho do array é indefinido pq n é um array
                if(['image/jpeg', 'images/jpg', 'image/png'].includes(req.files.img.mimetype)){
                    let url = await addImage(req.files.img.data);
                    newAd.images.push({
                        url: url,
                        default: false //dizemos que essa imagem não é a "imagem padrão" do anúncio
                    })
                }
            }else{ //caso ele envie várias imagens
                for(let i=0; i<req.files.img.length;i++){
                    if(['image/jpeg', 'images/jpg', 'image/png'].includes(req.files.img[i].mimetype)){
                        let url = await addImage(req.files.img[i].data);
                        newAd.images.push({
                            url: url,
                            default: false //dizemos que essa imagem não é a "imagem padrão" do anúncio
                        })
                    }
                }
            }
            if(newAd.images.length>0){
                newAd.images[0].default = true; //tornando a primeira imagem a "imagem padrão"
            }
        }

        const info = await newAd.save();
        res.json({id: info._id});

    },
    getList: async(req, res)=>{
        //sort: ordenação asc(ascendente) ou desc(decrescente)
        //offset: quantidade de itens que ele pula na paginação
        //limit: quantos itens aparecerão por página
        //q: a pesquisa que o usuário faz, que bate com o título dos nossos anúncios
        //cat: categoria
        //state: estado
        let {sort = 'asc', offset=0, limit=8,q,cat,state} = req.query;
        let filters = {status:true};
        let total = 0;

        if(q){
            filters.title = {'$regex': q, '$options': 'i'} //ele busca anúncios que tiverem parte da pesquisa do usuário como titulo e tira o case sensitive no 'options'

        }
        if(cat){
            const c = await Category.findOne({slug:cat}).exec();
            if(c){
                filters.category = c._id.toString();
            }
        }
        if(state){
            const s = await stateModel.findOne({name: state.toUpperCase()}).exec();
            if(s){
                filters.state = s._id.toString();
            }
        }

        const adsTotal = await Ad.find(filters).exec();
        total = adsTotal.length;//pegando o total de itens correspodentes a busca

        const adsData = await Ad.find(filters)
            .sort({dateCreated:(sort=='desc'?-1:1)}) //ordenando de forma crescente ou decrescente
            .skip(parseInt(offset)) //pulando a quantidade de itens necessárias
            .limit(parseInt(limit)) //limitando os itens da busca
            .exec(); 
        let ads = [];
        for(let i in adsData){
            let image;
            let defaultImg = adsData[i].images.find(e=>e.default); //pegando apenas os itens que possuem default: true

            if(defaultImg){
                image = `${process.env.BASE}/media/${defaultImg.url}`;
            }else{
                image = `${process.env.BASE}/media/default.jpg`; //se não houver imagem, pegamos a imagem default padrão
            }

            ads.push({
                id: adsData[i]._id,
                title: adsData[i].title,
                price: adsData[i].price,
                priceNegotiable: adsData[i].priceNegotiable,
                image:image,
            });
        }
        res.json({ads:ads, total: total});
    },
    getItem: async(req, res)=>{
        //other: caso seja true, apresenta informações de produtos relacionados
        //id: id do produto
        let {id, other = null} = req.query;
        if(!id){
            res.json({error: 'Sem produto'});
            return;
        }
        if(id.length<12){
            res.json({error:"ID inválido"});
            return;
        }
        const ad = await Ad.findById(id);
        if(!ad){
            res.json({error: 'Produto inexistente'});
            return;
        }
        ad.views++; //incrementando o total de visitas do anúncio
        await ad.save();
        
        let images = [];
        for(let i in ad.images){
            images.push(`${process.env.BASE}/media/${ad.images[i].url}`);

        }

        let category = await Category.findById(ad.category).exec();
        let userInfo = await User.findById(ad.idUser).exec();
        let stateInfo = await stateModel.findById(ad.state).exec();

        let others=[];
        if(other){
            const otherData = await Ad.find({status: true, idUser: ad.idUser}).exec(); //pegando os anuncios do mesmo anunciante

            for(let i in otherData){
                if(otherData[i]._id.toString() != ad._id.toString()){ //pegando todos os anúncios menos o próprio anúncio
                    let image = `${process.env.BASE}/media/default.jpg`;

                    let defaultImg = otherData[i].images.find(e=>e.default);
                    if(defaultImg){
                        image = `${process.env.BASE}/media/${defaultImg.url}`;  
                    }

                    others.push({
                        id: otherData[i]._id,
                        title: otherData[i].title,
                        price: otherData[i].price,
                        priceNegotiable: otherData[i].priceNegotiable,
                        image: image,
                    })

                }
            }
        }
        
        res.json({
            id: ad._id,
            title: ad.title,
            price: ad.price,
            priceNegotiable: ad.priceNegotiable,
            description: ad.description,
            dateCreated: ad.dateCreated,
            views: ad.views,
            images: images,
            category,
            userInfo:{
                name: userInfo.name,
                email: userInfo.email
            },
            stateName: stateInfo.name,
            others: others

        })
    },
    editAction: async(req, res)=>{
        let {id} = req.params; //pegando o id do anúncio (que vem na url)
        let {title, status, price, priceneg, desc, cat, images, token} = req.body; //o token é necessário uma vez que o usuário só pode alterar anuncios que são dele
        
        if(id.length<12){ //o id tem por padrão 12 caracteres, se ele tiver menos, é um id inválido
            res.json({error: 'id inválido'});
            return;
        }
        const ad = Ad.findById(id).exec();
        if(!ad){
            res.json({error: 'anúncio inexistente'});
        }
        const user = await User.findOne({token}).exec();
        if(user._id.toString() !== ad.idUser){
            res.json({error: 'você não pode alterar anúncios de terceiros'});
        }
        //processo de atualização do produto:
        let updates = {};
        
        if(title){
            updates.title = title;
        }
        if(price){
            price = price.replace('.','').replace(',','.').replace('R$', '');
            price = parseFloat(price);
            updates.price = price;
        }
        if(priceneg){
            updates.priceNegotiable = priceneg;
        }
        if(status){
            updates.status = status;
        }
        if(desc){
            updates.description = desc;
        }
        if(cat){
            const category = await Category.findOne({slug:cat}).exec();
            if(!category){
                res.json({error:'Categoria inexistente'});
                return;
            }
            updates.categories = category._id.toString();
        }
        if(images){
            updates.images=images;
        }
        await Ad.findByIdAndUpdate(id, {$set: updates}); //acha o anúncio pelo id e faz seu update com as informações que o usuário mandou atualizar
        
        if(req.files && req.files.img) {
            const adI = await Ad.findById(id);

            if(req.files.img.length == undefined) {
                if(['image/jpeg', 'image/jpg', 'image/png'].includes(req.files.img.mimetype)) {
                    let url = await addImage(req.files.img.data);
                    adI.images.push({
                        url,
                        default: false
                    });
                }
            } else {
                for(let i=0; i < req.files.img.length; i++) {
                    if(['image/jpeg', 'image/jpg', 'image/png'].includes(req.files.img[i].mimetype)) {
                        let url = await addImage(req.files.img[i].data);
                        adI.images.push({
                            url,
                            default: false
                        });
                    }
                }
            }

            adI.images = [...adI.images];
            await adI.save();
        }


        res.json({error:""});
        

    },
}