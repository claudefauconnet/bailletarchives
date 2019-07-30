var Boite = (function () {
    var self = {}




    self.onBoiteOperationSelect = function (select) {
        var operation = $(select).val();

        $("#popupD3Div").css("visibility", "hidden");
        $("#select").val("");

        if (operation == "voirVersement") {


            var sql = "";
            if (magasinD3.currentVersementSansBoites) {
                sql = " select * from versement where numVersement='" + magasinD3.currentVersementSansBoites + "'";
                magasinD3.currentVersementSansBoites = null;

            }
            else {
                var boite = magasinD3.currentBoite;
                sql = " select * from versement where id=" + boite.id_versement;
            }


            mainController.execSql(sql, function (err, result) {
                if (err)
                    return console.log(err);
                context.currentTable = "versement";
                recordController.displayRecordData(result[0]);
            })

            // alert("en construction")

        }


        else if (operation == "decalerBoite") {
            alert("en construction")

        }
        else if (operation == "supprimerBoite") {
            alert("en construction")

        }


    }


    self.locate = function (boite) {
        if (!boite)
            boite = prompt("boite :")
        if (boite && boite != "") {
            $("#currentMainMenuBoiteSpan").html(boite)
            magasinD3.locate("boite", "id", [boite], 1);
            mainController.showInMainDiv('graph');
        }

    }


    return self;

})()