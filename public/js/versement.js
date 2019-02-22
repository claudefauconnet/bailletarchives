var versement=(function(){

    var self={};
    self.updateRecordHistory=function(id){


        var sql="select * from versement where id="+id;
        mainController.execSql(sql, function (err, result){
            if( err)
              return  console.log(err);
            var versement=result[0];
            if(versement.etatTraitement=="en ")

            var sql2=" insert into versement_historique (etat,creePar,date,id_versement"

        })
        var xx=id;




    }



    return self;

})()