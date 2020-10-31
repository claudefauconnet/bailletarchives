var EspaceOccupe=(function(){

    var self={};



    self.onBeforeEditing = function (espaceOccupe) {

        var userGroups = authentication.currentUser.groupes;
        if (!userGroups)
            userGroups = "NONE";
        /*  if (userGroups.indexOf("ADMIN") < 0) {
              $("#deleteRecordButton").css("display", "none")
          }*/


        if (!espaceOccupe.id) {
            $("#espaceOccupeLocaliserButton").attr("disabled", true);
        }

        if (!espaceOccupe.etatTraitementAuteur) {

            $("#attr_etatTraitementAuteur").val(authentication.currentUser.nomComplet);
            //   recordController.incrementChanges(attr_etatTraitementAuteur);
        }
        if (!espaceOccupe.centreArchive)
            $("#attr_centreArchive").val("Baillet");


    }

    self.locateCurrentEspaceOccupe = function () {
        $("#dialogDiv").dialog("close");
        $("#dialogD3").dialog("close");
        mainController.showInMainDiv("graph");
        magasinD3.locate("tablette", "id_espace_occupe", context.currentRecord.id, 1.0)

    }

    self.onAfterDelete=function(record,callback){

        var sql= "update magasin set id_espace_occupe=null where id_espace_occupe="+record.id;
        mainController.execSql(sql, function(err, result){
            if( err)
                mainController.setMessage(err)


        })

    }
    self.stats=function(){
        var id=context.currentRecord.id;
        var sql="select sum(DimTabletteMLineaire) as metrage, count(*) as count from magasin  where id_espace_occupe="+id+" group by id_espace_occupe"

        mainController.execSql(sql, function(err, result){
            if( err)
                mainController.setMessage(err)
           $("#attr_nbreTablettes").val(result[0].count)
            $("#attr_metrage").val(result[0].metrage.replace(".",","))



        })



    }





    return self;


})()
