var sorties=(function(){
    var self={};



    self.highlightSorties=function(){
        mainController.showInMainDiv("graph")
        var sql="select cotesBoites from  historique_sorties";
        mainController.execSql(sql, function(err, result){
            if(err)
                return console.log(err);

            var boitesSorties=[]
            result.forEach(function(line){
                if(line && line.cotesBoites!=null) {
                    var boites = line.cotesBoites.split(",");
                    boitesSorties = boitesSorties.concat(boites)
                }
            })
            magasinD3.locate ("id",boitesSorties) ;

        })


    }




    self.create=function(){
        context.currentTable="historique_sorties";
        mainController.showNewRecordDialog();

    }

    self.deleteSortie=function(){

    }

    self.listActives=function(){
        context.currentTable="historique_sorties";
        var sql="select * from  historique_sorties"
        listController.listRecords(sql)

    }
    self.listHistory=function(){

    }







    return self;

})()