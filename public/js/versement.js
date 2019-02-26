var versement = (function () {

    var self = {};
    self.updateRecordHistory = function (id) {
        var sql = "select * from versement where id=" + id;
        mainController.execSql(sql, function (err, result) {
            if (err)
                return console.log(err);
            var versement = result[0];


            var sql2 = " insert into versement_historique (etat,etatAuteur, etatDate,dateModification,id_versement) values (" +
                "'" + versement.etatTraitement + "'," +
                "'" + versement.etatTraitementAuteur + "'," +
                "'" + util.longDateStrToShortDateStr(versement.etatTraitementDate) + "'," +
                "'" + util.dateToMariaDBString(new Date()) + "'," +
                "" + versement.id + ")"
            mainController.execSql(sql2, function (err, result) {
                if (err)
                    return console.log(err);
            })
        })
    }

    self.locate = function (sql) {

        mainController.execSql(sql, function (err, json) {
            if (json.length > config.maxVersementsToLocate) {
                return mainController.setMessage("trop de résultats :" + json.length + " précisez la requête");
            }

            var numVersements = [];
            json.forEach(function (line) {
                numVersements.push(line.numVersement);
            })
            var found = 0;
            var firstBoiteName = ""
            var coordonnees = "";
            var boites = [];

            $("#popupD3Div").css("visibility", "hidden")
            d3.selectAll(".boite").each(function (d, i) {
                var boiteD3=d3.select(this)
                var numVersement = boiteD3.attr("numVersement");
                if (!numVersement)
                    numVersement =boiteD3.attr("numversement");
                if (numVersements.indexOf(numVersement) > -1) {
                    boites.push(boiteD3.attr("name"))
                }

            })

            magasinD3.locate ("boite","id",boites,1) ;


        })

    }


    return self;

})()