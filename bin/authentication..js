
var jsonFileStorage=require('./jsonFileStorage.js');
var path=require('path');
var authentication={



    authentify:function(login,password,callback){
        var usersLocation="../souslesens/config/users/users.json";
        //var usersLocation="config/users/users.json";
        jsonFileStorage.retrieve(path.resolve(usersLocation), function(err,users){
            if(err)
                return callback(err)
            if(users[login] && users[login].password==password)
                callback(null, users[login].groups);
            else
                callback(null, false);


        })



    },
    enrole:function(){

    }




}
/*authentication.authentify("Claude","CF1",function (err,result){
    var x=result;
})*/

module.exports=authentication;