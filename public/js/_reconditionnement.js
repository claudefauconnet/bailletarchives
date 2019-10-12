var reconditionnement = (function () {
    var self = {};


    self.start = function () {
        var numVersement = $("#attr_numVersement").val();
        self.showVersementBoitesCbx(numVersement, function (err, htmlBoites) {
            var html = "<div style='background: white'>";
            html += "versement source " + numVersement;
            html += "versement cible " + "<input id='reconditionnement_numVersementCible'>";
            html += "<button onclick='reconditionnement.execute()'>Reconditionner</button>"
            html += "<button onclick=' $(\"#dialogDiv\").dialog(\"close\");'>Annuler</button>"
            html += htmlBoites;
            html += "</div>"
            $("#dialogDiv").html(html)
            $("#dialogDiv").dialog("open");
        });

    }


    self.showVersementBoitesCbx = function (numVersement, callback) {

        if (!numVersement || numVersement == "")
            return mainController.setRecordErrorMessage("saisissez un versement")
        var sql = "select magasin.* from magasin, versement where versement.id=magasin.id_versement and versement.numVersement=" + numVersement + " order by magasin.coordonnees";
        mainController.execSql(sql, function (err, json) {
            if (err)
                return mainController.setRecordErrorMessage(err);
            var html = "";
            if (json.length == 0)
                html = " pas de boites correspondantse";
            else {

                var boitesTablettes = [];
                var maxBoitesTablette;
                context.reconditionnementBoites = {}
                json.forEach(function (line) {
                    var tablette = {coordonnees: line.coordonnees, boites: [], id_tablette: line.id};
                    var boitesStr = line.cotesParTablette;
                    if (boitesStr != null && boitesStr != "") {
                        var boites = boitesStr.split(" ");
                        var maxBoitesTablette = Math.max(maxBoitesTablette, boites.length)
                        boites.forEach(function (boite) {
                            tablette.boites.push(boite)
                            context.reconditionnementBoites[tablette.coordonnees + "_" + boite] = {
                                cote: boite,
                                coordonnees: tablette.coordonnees,
                                id_tablette: tablette.id_tablette,
                                versementSource: line.id_versement
                            }
                        })

                        boitesTablettes = boitesTablettes.concat(tablette);
                    }
                })
                html = "<table border='1'>"
                boitesTablettes.forEach(function (tablette) {
                    html += "<tr>"
                    html += "<td>" + tablette.coordonnees + "</td><td><input type='checkbox' onchange=reconditionnement.onAllCbxChanged($(this),'" + tablette.coordonnees + "')>Toutes</td>";
                    html += "<td>"
                    tablette.boites.forEach(function (boite) {
                        html += "<input type='checkbox'  class='reconditionnementCbx' value='" + tablette.coordonnees + "_" + boite + "'style='width: auto''><span style='font-size: 10px'>" + boite + "</span>"
                    })
                    html += "</td>"
                    html += "<tr>"
                })
                html += "</table>"


                return callback(null, html);

            }


        })


    }

    self.onAllCbxChanged = function (cbx, tabletteCoords) {
        var checked = $(cbx).prop("checked")
        $(".reconditionnementCbx").each(function () {
            var value = $(this).val();
            if (value.indexOf(tabletteCoords) == 0) {
                if (checked)
                    $(this).prop("checked", "checked")
                else
                    $(this).removeProp("checked");
            }


        })
    }

    self.execute = function () {
        var message = ""
        var numVersementSource = $("#attr_numVersement").val();
        var numVersementCible = $("#reconditionnement_numVersementCible").val();

        if (numVersementCible == "") {
            if (!confirm("supprimer les boites sélectionnées de ce versement ?")) {
                return;
            } else
                numVersementCible = null;
        }


        var boites = [];
        var versementCible = null;
        var versementSource = null;
        var longueurBoitesSource = 0;
        var longueurCibleDisponible = 0;
        var tablettesCible = [];
        var tailleMoyenneBoites = config.tailleMoyenneBoite

        $(".reconditionnementCbx").each(function () {
            if ($(this).prop("checked")) {

                var value = $(this).val();
                boites.push(context.reconditionnementBoites[value])

            }
        })

        if (boites.length == 0) {
            message = "aucune boite selectionnée";
            return;
        }
        async.series([


                // recherche versement source et longueur de sboites à deplacer
                function (callbackSeries) {

                    var sql = "SELECT * from versement where numVersement='" + numVersementSource + "'";
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        if (result.length == 0)
                            return callbackSeries("le versement " + numVersementCible + " n'esxiste pas")

                        versementSource = result[0];
                        if (versementSource.metrage && versementSource.nbBoites)
                            tailleMoyenneBoites = versementSource.metrage / versementSource.nbBoites;
                        else
                            tailleMoyenneBoites = config.tailleMoyenneBoite;

                        longueurBoitesSource = boites.length * tailleMoyenneBoites;
                        return callbackSeries();

                    })
                },

                // recherche versement cible
                function (callbackSeries) {
                    if (numVersementCible == null)
                        return callbackSeries();
                    var sql = "SELECT * from versement where numVersement='" + numVersementCible + "'";
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        if (result.length == 0)
                            return callbackSeries("le versement " + numVersementCible + " n'esxiste pas")

                        versementCible = result[0];
                        return callbackSeries();

                    })


                },


                // recherche espace disponible à la suite du versement cible
                function (callbackSeries) {
                    var derniereTabletteVersementCible = result[result.length - 1];
                    magasinD3.chercherTablettesPourVersement({metrage: longueurBoitesSource}, derniereTabletteVersementCible, function (err, result) {
                        if (err) {
                            return callback("pas assez d'espace disponible après de le versement cible " + versementCible.numVersement + ", effectuez un refoulement au préalable")
                        }
                        tablettesCible = result;
                        return callbackSeries();

                    })
                }

                ,

                function (callbackSeries) {

                    return callbackSeries();
                }


            ],

            function (err) {
            }
        )


    }


    return self;


})()
