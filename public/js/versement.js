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
                  "'" +   util.longDateStrToShortDateStr(versement.etatTraitementDate) + "'," +
                  "'" + util.dateToMariaDBString (new Date())+ "'," +
                  "" + versement.id + ")"
              mainController.execSql(sql2, function (err, result) {
                  if (err)
                      return console.log(err);
              })
        })
    }

    self.locateVersements = function (sql) {

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

            $("#popupD3Div").css("visibility", "hidden")
            d3.selectAll(".boite").each(function (d, i) {
                d3.select(this).style("opacity", 0.1)
                var x = d;
                var numVersement = d3.select(this).attr("numVersement");
                if (!numVersement)
                    numVersement = d3.select(this).attr("numversement");

                var firstbox = true;
                if (numVersements.indexOf(numVersement) > -1) {
                    found += 1
                    if (firstbox) {
                        firstBoiteName = d3.select(this).attr("name");
                        coordonnees = d3.select(this).attr("coordonnees");


                        $("#messageSpan").html(message)
                        firstbox = false
                        self.centerOnElt(this)

                    }
                    d3.select(this).style("opacity", 1)
                    d3.select(this).style("fill", "red")
                    d3.select(this).style("stroke", "black")

                    /*   $(this).css("opacity", 1)
                       $(this).css("stroke", "red")*/


                }

            })
            if (found > 0) {
                var message = "versement " + numVersement + " , localisation : " + coordonnees + " nombre de boites +" + found + "+ première boite " + firstBoiteName;
                $("#messageSpan").html(message);
                zoom.scaleTo(svg, avgZoom);
            }
            else
                $("#messageSpan").html("aucune boite correspond au versement " + numVersement)

        })

    }
    self.searchVersement = function (versement) {
        versement = prompt("numero de versement")
        var found = 0;
        var firstBoiteName = ""
        var coordonnees = "";
        if (versement && versement != "") {
            $("#popupD3Div").css("visibility", "hidden")
            d3.selectAll(".boite").each(function (d, i) {
                d3.select(this).style("opacity", 0.1)
                var x = d;
                var numVersement = d3.select(this).attr("numVersement");
                if (!numVersement)
                    numVersement = d3.select(this).attr("numversement");

                var firstbox = true;
                if (versement == numVersement) {
                    found += 1
                    if (firstbox) {
                        firstBoiteName = d3.select(this).attr("name");
                        coordonnees = d3.select(this).attr("coordonnees");


                        $("#messageSpan").html(message)
                        firstbox = false
                        self.centerOnElt(this)

                    }
                    d3.select(this).style("opacity", 1)
                    d3.select(this).style("fill", "red")
                    d3.select(this).style("stroke", "black")

                    /*   $(this).css("opacity", 1)
                       $(this).css("stroke", "red")*/


                }

            })
            if (found > 0) {
                var message = "versement " + versement + " , localisation : " + coordonnees + " nombre de boites +" + found + "+ première boite " + firstBoiteName;
                $("#messageSpan").html(message);
                zoom.scaleTo(svg, minZoom);
            }
            else
                $("#messageSpan").html("aucune boite correspond au versement " + versement)
        }
    }

    return self;

})()