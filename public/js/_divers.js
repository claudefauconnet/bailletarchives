var Divers=(function(){

    var self={};



    self.onBeforeEditing = function (divers) {

        var userGroups = authentication.currentUser.groupes;
        if (!userGroups)
            userGroups = "NONE";
        /*  if (userGroups.indexOf("ADMIN") < 0) {
              $("#deleteRecordButton").css("display", "none")
          }*/


        if (!divers.id) {
            $("#diversLocaliserButton").attr("disabled", true);
        }

        if (!divers.etatTraitementAuteur) {

            $("#attr_etatTraitementAuteur").val(authentication.currentUser.nomComplet);
            //   recordController.incrementChanges(attr_etatTraitementAuteur);
        }
        if (!divers.centreArchive)
            $("#attr_centreArchive").val("Baillet");

    /*    if (versement.etatTraitement)//reinitilaiser etat traitement lorsqu'on ouvre un versement (demande juillet 2019)
            $("#attr_etatTraitement").val("");

        if (versement.etatTraitementDate)//reinitilaiser etat traitement lorsqu'on ouvre un versement (demande juillet 2019)
            $("#attr_etatTraitementDate").val("");

        if (versement.etatTraitement == "retraitement/reconditionnement") {
            $("#retraitementButton").attr("disabled", true);
            $("#versementEntrerEnMagasinButton").removeAttr("disabled");

        }*/
    }




    return self;


})()
