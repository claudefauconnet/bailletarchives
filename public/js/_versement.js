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
                var boiteD3 = d3.select(this)
                var numVersement = boiteD3.attr("numVersement");
                if (!numVersement)
                    numVersement = boiteD3.attr("numversement");
                if (numVersements.indexOf(numVersement) > -1) {
                    boites.push(boiteD3.attr("name"))
                }

            })

            magasinD3.locate("boite", "id", boites, 1);


        })

    }

    self.integrerVersementFromD3Tablette = function () {


        var tablette = magasinD3.currentTablette;
        var numVersement = $("#tablette_numeroVersementIntegrer").val();
        var metrageFromDialog = $("#popupD3DivOperationDiv_metrage").val();
        if (!numVersement || numVersement == "")
            return alert("entrez un numero de versement");
        var sql = "select * from versement where numVersement='" + numVersement + "'"
        mainController.execSql(sql, function (err, result) {
            if (err)
                return console.log(err)
            if (result.length == 0)
                return alert("numero de versement non valide")
            var versement = result[0];
            if (!versement.metrage) {
                if (metrageFromDialog && metrageFromDialog != "") {
                    versement.metrage = parseInt(metrageFromDialog.replace(",", "."))
                }
                else
                    return $("#popupD3DivOperationDiv").prepend("metrage du versement <input id='popupD3DivOperationDiv_metrage'>");

            }


            var tablettesProposees = $("#popupD3DivOperationDivTablettesProposees li")
            $("#popupD3DivOperationDiv").css("visibility","hidden")
            if (tablettesProposees && tablettesProposees.length > 0) {// selection done do integration

                var tablettes = []
                $(tablettesProposees).each(function (index, value) {
                    tablettes.push(value.innerHTML)
                })

                var x = tablettes;

                async.eachSeries(tablettes, function (tablette, callback) {

                    var sql = "update magasin set numVersement='" + versement.numVersement + '",id_versement="+versement.id where magasin.coordonnees=' + tablette + "'";
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return callback(err);
                        callback();

                    })

                }, function(err){
                    if(err)
                   return  console. log(err);

                        self.listRecords("select * from versement where id="+versement.id)


                })


                return
            }


            var tablettesContigues = [];
            if (tablette.longueurM < versement.metrage) {

                var sumLength = 0;
                var started = false;
                d3.selectAll("g .tablette").each(function (d, i) {
                    var name = d3.select(this).attr("id");
                    var longueurM = parseInt(d3.select(this).attr("longueurM"));
                    if (name == tablette.name) {
                        started = true;
                        sumLength += longueurM;
                        tablettesContigues.push(name)

                    }
                    else if (started && longueurM && sumLength < versement.metrage) {
                        sumLength += longueurM;
                        tablettesContigues.push(name)
                    }

                })
            } else
                tablettesContigues.push(tablette.name)


            //magasinD3.locate("tablette", "id", tablettesContigues, "1")
            var xx = tablettesContigues;
            var html = "<br>longeur versement :" + tablette.longueurM;
            html += "<br>tablettes proposées<div id='popupD3DivOperationDivTablettesProposees' style='height: 200px;overflow: auto'><ul>"
            tablettesContigues.forEach(function (tablette) {
                html += "<li>" + tablette + "</li>"
            })
            html += "</ul></div>"
            html += "<button onclick='versement.integrerVersementFromD3Tablette()'>Intégrer</button>";
            return $("#popupD3DivOperationDiv").append(html);


        })


    }


    self.showDialogIntegrerVersement = function () {

        $("#dialogD3").attr("title", "chercher des tablettes");
        $("#dialogD3").dialog("option", "position", {my: "center", at: "center", of: $("#mainDiv")});

        dialogD3.dialog("open")
        $("#dialogD3").load("./htmlSnippets/" + "findTablettesDialogD3.html"), function () {

        }
    }

    self.chercherTablettesPourVersement = function (obj) {
        $("#findTablettes_message").html("");

        //  var metrage = prompt("longueur du versement")
        if (!obj.metrage || obj.metrage == null)
            return;
        //obj.metrage = parseFloat(obj.metrage.replace(",", "."));
        var longueurCumulee = 0;
        var tablettesOK = [];
        var done = false;

        magasinData.children.forEach(function (magasin) {

            if (obj.magasin && obj.magasin != "")
                if (magasin.name != obj.magasin)
                    return;

            if (!done)
                magasin.children.forEach(function (epi) {
                    if (!done)
                        epi.children.forEach(function (travee) {
                            if (!done)
                                travee.children.forEach(function (tablette) {
                                    if (!done)
                                        if ((!tablette.numVersement || tablette.numVersement == 0) && tablette.children.length == 0) {// tablette vide
                                            if (tablettesOK.length > 0 && !self.areTablettesContigues(tablettesOK[tablettesOK.length - 1], tablette.name)) {
                                                tablettesOK = []// on recommence si tablettes pas contigues
                                                longueurCumulee = 0;
                                            }
                                            longueurCumulee += tablette.longueurM;
                                            tablettesOK.push(tablette.name)
                                            if (longueurCumulee >= obj.metrage)
                                                done = true;
                                        }
                                        else {
                                            tablettesOK = []// on recommence si uen tablette est occuppée
                                            longueurCumulee = 0;
                                        }


                                })
                        })
                })

        })

        var xx = tablettesOK;
        self.currentVersement = obj;
        self.currentVersement.tablettes = tablettesOK
        $("#findTablettes_message").html("Tablettes contigues libres pour " + obj.metrage + " m : de " + tablettesOK[0] + " à " + tablettesOK[tablettesOK.length - 1])

        var first = true;
        d3.selectAll(".boite").style("opacity", 0.3)
        d3.selectAll(".tablette").style("fill", "none").style(" stroke", "blue");
        d3.selectAll(".tablette").each(function (d, i) {


            var name = d3.select(this).attr("name");
            if (tablettesOK.indexOf(name) > -1) {

                d3.select(this).style("opacity", 1).style("stroke", "black").style("fill", "green")
                if (first == true) {
                    self.centerOnElt(this)
                    first = false;
                }


            }

        })


    }

    self.getBoiteVersement = function (boite, callback) {

        var numVersement = boite.numVersement;
        if (!numVersement)
            return;
        var sql = "select * from versement where numVersement='" + numVersement + "'"
        mainController.execSql(sql, function (err, result) {
            if (err)
                return callback(err);
            return callback(null, result[0])
        })
    }


    return self;

})()