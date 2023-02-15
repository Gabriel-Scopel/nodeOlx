const { v4: uuid } = require('uuid');//biblioteca para gerar um hash aleatório
const jimp = require('jimp'); //biblioteca para manipulação de imagens
const Category = require('../models/Category');
const User = require('../models/User');
const Ad = require('../models/Ad');

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
        
    },
    getItem: async(req, res)=>{
        
    },
    editAction: async(req, res)=>{
        
    },
}