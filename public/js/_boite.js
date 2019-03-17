var boite = (function () {
    var self = {}

    self.onBoiteOperationSelect = function (select) {
        var operation = $(select).val();


        if (operation == "voirVersement") {

            var boite=magasinD3.currentBoite;
            var sql=" select * from versement where id="+boite.id_versement;
            mainController.execSql(sql,function(err, result){
                if(err)
                    return console.log(err);
                context.currentTable="versement";
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


    self.locate = function () {
        self.locate = function () {

            var boite = prompt("boite :")
            if (boite && boite != "") {
                magasinD3.locate("boite", "id", [boite], 1);
            }
            // return alert("en construction");
        }
    }


    return self;

})()