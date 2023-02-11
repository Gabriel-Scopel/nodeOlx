//middleware que realiza verificação de quem é o usuário, assim, ele permite ou proibe certas rotas e ações dentro do sistema
const User = require('../models/User'); //pegamos o model de usuários para verificar se no banco de dados há usuário com aquele token

module.exports = {
    private: async(req,res,next)=>{
        //a verificação será feita por meio de um token, caso o usuário envie por meio do body ou pela query da 
        //requisição, ele terá acesso, caso contrário, não
        if(!req.query.token && !req.body.token){
            res.json({notallowed: true});
            return;
        }
        //preenchendo a variável token com o token enviado, seja pela query, seja pelo body
        let token = '';
        if(req.query.token){
            token = req.query.token;
        }
        if(req.body.token){
            token = req.body.token;
        }
        
        if(token==''){
            res.json({notallowed: true});
            return;
        }
        const user = await User.findOne({
            token:token
        });
        
        if(!user){//caso o usuário tenha enviado um token mas ele não é válido, a variável user não será preenchida, não podemos dar acesso
            res.json({notallowed: true})
            return;
        };

        next();//permite que se dê acesso, que rode a função info do userController no arquivo de rotas "router.get('/user/me',Auth.private, UserController.info);"
    }
};