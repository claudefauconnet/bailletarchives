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





    return self;


})()
