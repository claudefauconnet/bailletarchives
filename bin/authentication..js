
var jsonFileStorage=require('./jsonFileStorage.js');
var path=require('path');
var logger=require("./logger..js");
var mySqlProxy=require("./mySqlProxy..js");
const bcrypt = require('bcrypt');
var async=require("async");
var saltRounds = 10;
var authentication={



    authentify:function(login,password,callback){
      //  var usersLocation="../souslesens/config/users/users.json";
   //  var usersLocation=path.resolve(,"../config/users/users.json");
        var usersLocation= path.join(__dirname, "../config/users/users.json")
        jsonFileStorage.retrieve(path.resolve(usersLocation), function(err,users){
            if(err) {
                logger.error(login+" connected")
                return callback(err);
            }
            if(users[login] && users[login].password==password) {
              //  logger.log({level:'info',message:login+" connected"})
                logger.info(login+" connected")
                callback(null, users[login].groups);
            }else {
                logger.info(login+" rejected")
                callback(null, false);
            }


        })




    },

    loginInDB:function(login,password,callback) {

        if(password==login)
            return callback("changePassword");

        bcrypt.hash(password, saltRounds, function (err, hash) {
            var hashedPassword = hash;
            var sql = "select * from utilisateur where identifiant='" + login + "' and motDepasse='" + hashedPassword + "'";
            mySqlProxy.exec(null,sql, function (err, result) {
                if (err) {
                    return callback(err);
                }
                if (result.length == 0)

                    return callback();
                return callback(null, result[0]);

            })

        })
    },
    enrole:function(users,callback) {
        if (!Array.isArray(users)) {
            users = [users];
        }
        aysnc.eachSeries(users, function (user,callbackEach) {
            if(!user.password)
                user.password=user.login
            bcrypt.hash(user.password, saltRounds, function (err, hash) {
                var sql = "insert into utilisateur (identifiant,nomComplet,motDePasse,groupes) values ('" + user.identifiant + "'," + user.nomComplet + "'," + user.motDePasse + "'," + user.groupes + ")";
                mySqlProxy.exec(null,sql, function (err, result) {
                    if (err)
                        return callbackEach(err)

                    callbackEach();
                })
            })

        },function(err){
            if(err)
               return callback(err);
            callback("done");

        })
    },

    changePassword:function(login,oldPassword, newPassword,callback) {
        authentication.loginInDB(login, oldPassword, function (err, result) {
            if (err)
                callback(err);
            if (!result)
                callback("Invalid user /password");

            if (!newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)) {
                callback("invalid  login : Minimum eight characters, at least one uppercase letter, one lowercase letter and one number");
            }
            bcrypt.hash(newPassword, saltRounds, function (err, hash) {
                var sql = "update * from utilisateur where identifiant='" + login + "' set motDepasse='" + hash + "'";
                mySqlProxy.exec(null,sql,callback);
            })

        })
    },


testEncrypt:function(){
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const myPlaintextPassword = 's0/\/\P4$$w0rD';
    const someOtherPlaintextPassword = 'not_bacon';

    var mysHash;

    bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
        mysHash=hash;
        bcrypt.compare(someOtherPlaintextPassword, mysHash, function(err, res) {
            var x=res
        });
    });

}




}
/*authentication.authentify("Claude","CF1",function (err,result){
    var x=result;
})*/



authentication.testEncrypt();

module.exports=authentication;
