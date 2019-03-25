var Sortie=(function(){
    var self={};


    self.setNewRecordDefaultValues = function (sortie) {
        if(!sortie.sortieArchiviste) {
            $("#attr_sortieArchiviste").val(authentication.currentUser);
            recordController.incrementChanges(attr_sortieArchiviste);
        }
    }


    self.highlightSorties=function(){
        mainController.showInMainDiv("graph")
        var sql="select cotesBoites from sortie_boite where retourDate is null order by sortieDate desc"
        mainController.execSql(sql, function(err, result){
            if(err)
                return console.log(err);

            var boitesSorties=[]
            result.forEach(function(line){
                if(line && line.cotesBoites!=null) {
                    var boites = line.cotesBoites.split(" ");
                    boitesSorties = boitesSorties.concat(boites)
                }
            })
            magasinD3.initialZoom();
            magasinD3.locate ("boite","id",boitesSorties,.3) ;


        })


    }




    self.create=function(){
        context.currentTable="sortie_boite";
        mainController.showNewRecordDialog();

    }



    self.listActives=function(){
        context.currentTable="sortie_boite";
        var sql="select * from sortie_boite where retourDate is null order by sortieDate desc"
        listController.listRecords(sql)

    }
    self.listHistory=function(){
        context.currentTable="sortie_boite";
        var sql="select * from sortie_boite order by sortieDate desc"
        listController.listRecords(sql)


    }







    return self;

})()