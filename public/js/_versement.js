var versement = (function () {

        var self = {};
        self.currentCandidateTablettes = []
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
                    listController.loadLinkedDivs()
                })
            })
        }


        self.locateCurrentVersement = function () {
            $("#dialogDiv").dialog("close");
            mainController.showInMainDiv("graph")
            self.locateByNumVersement(context.currentRecord.numVersement);
        }

        self.locateByNumVersement = function (_numVersement) {
            $("#popupD3Div").css("visibility", "hidden")
            var boites = [];
            d3.selectAll(".boite").each(function (d, i) {
                var boiteD3 = d3.select(this)
                var numVersement = boiteD3.attr("numVersement");
                if (!numVersement)
                    numVersement = boiteD3.attr("numversement");
                if (_numVersement == numVersement) {
                    boites.push(boiteD3.attr("name"))
                }

            })

            magasinD3.locate("boite", "id", boites, 1);
        }

        self.locateBySql = function (sql) {

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


        self.refoulerVersement = function (tablette) {
            alert("en construction");
        }

        self.entrerNouveauVersementFromD3Tablette = function () {
            var metrageFromDialog = $("#popupD3DivOperationDiv_metrage").val();

            if (!metrageFromDialog || metrageFromDialog == "") {

                return alert("specifiez le métrage")
            }

            if (isNaN(metrageFromDialog))
                return (alert("Le format du  métrage n'est pas correct"))


            var metrage = parseFloat(metrageFromDialog.replace(",", "."));


            var tablette = magasinD3.currentTablette;
            magasinD3.getTablettesContigues(tablette, metrage, function (err, tablettesContigues) {
                self.currentCandidateTablettes = tablettesContigues;
                var html = "<br>longeur versement :" + tablette.longueurM;

                html += "<br>tablettes proposées<div id='popupD3DivOperationDivTablettesProposees' style='height: 200px;overflow: auto'><ul>"
                tablettesContigues.forEach(function (tablette) {
                    html += "<li>" + tablette + "</li>"
                })
                html += "</ul></div>"
                html += "<button onclick='versement.creerVersementAndAttachTablettes()'>Creer versement</button>";
                return $("#popupD3DivOperationDiv").append(html);

            })
        }

        self.entrerVersementExistantFromD3Tablette = function () {

            var tablette = magasinD3.currentTablette;
            if (tablette.isEmpty == false) {

                return alert("la tablette n'est pas vide");
            }
            var metrageFromDialog = $("#popupD3DivOperationDiv_metrage").val();

            var numVersement = $("#tablette_numeroVersementIntegrer").val();

            if (!numVersement || numVersement == "") {
                return alert("entrez un numero de versement");
            }


            var sql = "select * from versement where numVersement='" + numVersement + "'"
            mainController.execSql(sql, function (err, result) {
                if (err)
                    return console.log(err)
                if (result.length == 0) {
                    $("#popupD3Div").css("visibility", "hidden");
                    return alert("numero de versement non valide")
                }


                var versement = result[0];

                if (versement.etatTraitement != "en attente" && versement.etatTraitement != "décrit") {
                    $("#popupD3Div").css("visibility", "hidden");
                    return alert("l'état du versement ne permet pas de l'enter en magasin")
                }
                if (!versement.metrage) {
                    if (metrageFromDialog && metrageFromDialog != "") {
                        versement.metrage = parseInt(metrageFromDialog.replace(",", "."))
                    }
                    else
                        return $("#popupD3DivOperationDiv").prepend("metrage du versement <input id='popupD3DivOperationDiv_metrage'>");

                }




                if (tablettesProposees && tablettesProposees.length > 0) {// selection done do integration
                    $("#popupD3DivOperationDiv").css("visibility", "hidden");
                    var tablettes=[];
                    var tablettesProposees = $("#popupD3DivOperationDivTablettesProposees li")
                    $(tablettesProposees).each(function (index, value) {
                        tablettes.push(value.innerHTML)
                    })
                    return self.AttachTablettesToVersement(versement, tablettes, function (err, result) {
                        if (err)
                            return console.log(err);
                        context.currentTable = "versement";
                        var sql = "update versement set metrage=" + versement.metrage + " where id=" + versement.id;
                        mainController.execSql(sql, function (err, result) {
                            if (err)
                                return callback(err);
                            listController.listRecords("select * from versement where id=" + versement.id)
                        })
                    })
                }


                magasinD3.getTablettesContigues(tablette, versement.metrage, function (err, tablettesContigues) {

                    var html = "<br>longeur versement :" + tablette.longueurM;
                    html += "<br>tablettes proposées<div id='popupD3DivOperationDivTablettesProposees' style='height: 200px;overflow: auto'><ul>"
                    tablettesContigues.forEach(function (tablette) {
                        html += "<li>" + tablette + "</li>"
                    })
                    html += "</ul></div>"
                    html += "<button onclick='versement.entrerVersementExistantFromD3Tablette()'>Entrer versement</button>";
                    return $("#popupD3DivOperationDiv").append(html);

                })

            })


        }

        self.creerVersementAndAttachTablettes = function () {
            var metrageFromDialog = $("#popupD3DivOperationDiv_metrage").val();
            var nbBoitesFromDialog = $("#popupD3DivOperationDiv_nbBoites").val();
            if (isNaN(metrageFromDialog))
                return (alert("Le format du  métrage n'est pas correct"))
            var metrage = parseFloat(metrageFromDialog.replace(",", "."));
            if (isNaN(nbBoitesFromDialog))
                return (alert("Le format du  nombre de boites n'est pas correct"))
            var nbBoites = parseInt(nbBoitesFromDialog.replace(",", "."));


            var tailleMoyBoite=metrage/nbBoites;
            var versementObj = {etatTraitement: "en attente",metrage:metrage};
            async.series([

                    function (callback) {// set new numero de versement
                        self.getNewNumVersement(function (err, numVersement) {
                            if (err)
                                callback(err);

                            versementObj.numVersement = numVersement;
                            callback();


                        })
                    },

                    function (callback) {// create versement
                        recordController.execSqlCreateRecord("versement", versementObj, function (err, newId) {
                            if (err)
                                callback(err);
                            versementObj.id = newId;
                            callback();
                        })


                    },

                    function (callback) {// get taille tablettes
                        var sql="select * from magasin where coordonnees in "
                        recordController.execSqlCreateRecord("versement", versementObj, function (err, newId) {
                            if (err)
                                callback(err);
                            versementObj.id = newId;
                            callback();
                        })


                    },

                    function (callback) {//create tablettes
                        if (self.currentCandidateTablettes) {
                            var tablettes = self.currentCandidateTablettes;

                            self.AttachTablettesToVersement(versementObj, tablettes,nbBoites,tailleMoyBoite, function (err, result) {
                                if (err)
                                    callback(err);

                                callback();

                            })
                        } else {
                            callback();
                        }
                    }

                ]

                ,
                function (err) {// at the end dispalay  versement and tablettes
                    $("#popupD3DivOperationDiv").css("visibility", "hidden");
                if(err){
                    console.log(err);
                    return mainController.setErrorMessage(err);
                }

                    listController.listRecords("select * from versement where id=" + versementObj.id)
                }
            )
        }

        self.AttachTablettesToVersement = function (versement, tablettes,nbBoites,tailleMoyBoite, callback) {



            async.eachSeries(tablettes, function (tablette, callbackSeries) {

                var sql = "update magasin set numVersement='" + versement.numVersement + "',id_versement=" + versement.id + " where magasin.coordonnees='" + tablette + "'";
                console.log(sql)
                mainController.execSql(sql, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    callbackSeries();

                })

            }, function (err) {
                if (err)
                    return callback(err);
                return callback(null);

            })

        }


        self.showDialogEntrerVersement = function () {

            var metrage = $("#attr_metrage").val()
            var nbBoites = $("#attr_nbBoites").val()


            if (metrage == "" || nbBoites == "")
                return alert(" le métrage et le nombre de boites sont obligatoires")

            $("#dialogD3").attr("title", "chercher des tablettes");
            $("#dialogD3").dialog("option", "position", {my: "center", at: "center", of: $("#mainDiv")});

            dialogD3.dialog("open")
            $("#dialogD3").load("./htmlSnippets/" + "findTablettesDialogD3.html", function () {
                $("#findTablettesD3_versement").val(context.currentRecord.numVersement);
                $("#findTablettesD3_nbBoites").val(metrage)
                $("#findTablettesD3_metrage").val(nbBoites);

                metrage = parseFloat(metrage.replace(",", ".")) * 100
                nbBoites = parseInt(nbBoites)

                var ep = "" + (Math.round(parseInt(metrage / nbBoites)) / 100);
                ep = ep.replace(".", ",");
                $("#findTablettesD3_epaisseurMoyBoite").val(ep);


            })
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
                        self.centerOnElt(this, magasinD3.avgZoom)
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

        self.onMagasinsLoaded = function (magasins) {
            if (magasins.length > 0) {
                $("#versementEntrerEnMagasinButton").css("visibility", "hidden");
                $("#versementLocaliserButton").css("visibility", "visible");
                $("#versementRefoulerButton").css("visibility", "visible");

            }
            else {
                $("#versementEntrerEnMagasinButton").css("visibility", "visible");
                $("#versementLocaliserButton").css("visibility", "hidden");
                $("#versementRefoulerButton").css("visibility", "hidden");
            }


        }

        self.setNewRecordDisplayNumVersement = function (versementObj) {
            self.getNewNumVersement(function (err, numVersement) {
                if (err)
                    return console.log(err);
                $("#attr_numVersement").val(numVersement)
            })

        }

        self.getNewNumVersement = function (callback) {
            var sql = statistics.stats["prochain numero de versement"].sql;
            mainController.execSql(sql, function (err, result) {
                if (err) {
                    callback(err)

                }
                callback(null, result[0].prochainNumeroVersement)
            })

        }


        self.getVersementMagasinInfos = function (obj, callback) {

            var infos = {
                versement: {
                    numVersement: null,
                    id: null,
                    metrage: 0,
                    nbreBoites: 0
                },
                tablettes: {
                    metrage: 0,
                    coteBoites: [],
                    tailleTotaleTablettes: 0

                }
            }

            // infos sur le versement
            var key = Object.keys(obj)[0];
            var sql = "select * from versement where " + key + "=" + obj[key];
            mainController.execSql(sql, function (err, json) {
                var numVersement = json[0].numVersement;
                var idVersement = json[0].id;
                if (err)
                    return callback(err);
                if (json.length == 0)
                    return callback({message: "ce versement n'existe pas"})
                if (json.length > 1)
                    return callback({message: "ce numero de versement a plusieurs entrées , operation impossible "})
                infos.versement.metrage = json[0].metrage;
                infos.versement.nbreBoites = json[0].nbBoites;
                infos.versement.numVersement = numVersement;
                infos.versement.id = json[0].id;


// cherche les tablettes   actuelles du versement
                var sql = "select magasin.* from  versement,magasin,r_versement_magasin where  magasin.id=r_versement_magasin.id_magasin and r_versement_magasin.id_versement=versement.id  and versement.id=" + idVersement;
                mainController.execSql(sql, function (err, json) {
                    if (err)
                        return callback(err);

                    json.forEach(function (tablette) {
                        infos.tablettes.metrage += tablette.metrage;
                        infos.tablettes.tailleTotaleTablettes += tablette.DimTabletteMLineaire
                        var tabletteBoites = [];
                        if (tablette.cotesParTablette)
                            tabletteBoites = tablette.cotesParTablette.split(" ");
                        tabletteBoites.forEach(function (boite, index) {
                            var p = boite.indexOf("/");
                            if (p > -1)
                                tabletteBoites[index] = parseInt(boite.substring(p + 1))

                        })
                        infos.tablettes.coteBoites.push.apply(infos.tablettes.coteBoites, tabletteBoites);
                        infos.tablettes.coteBoites.sort();


                    })
                    infos.tablettes.tailleTotaleTablettes = (Math.round(infos.tablettes.tailleTotaleTablettes * 100)) / 100
                    return callback(null, infos);


                })
            })

        }
        self.SetVersementCotesExtremesFromMagasin = function (versementId) {
            self.getVersementMagasinInfos({id: versementId}, function (err, infos) {
                var input = $("#attr_cotesExtremesBoites");
                var tablettesExtremes = "pas de cotes dans magasin";
                if (infos.tablettes.coteBoites.length > 0)
                    tablettesExtremes = infos.tablettes.coteBoites[0] + " - " + infos.tablettes.coteBoites[infos.tablettes.coteBoites.length - 1]
                $(input).val(tablettesExtremes)
                recordController.incrementChanges(input, 'table');
            })
        }

        self.SetVersementnbBoitesFromMagasin = function (versementId) {
            self.getVersementMagasinInfos({id: versementId}, function (err, infos) {
                var input = $("#attr_nbBoites");
                $(input).val(infos.tablettes.coteBoites.length);
                recordController.incrementChanges(input, 'table');
            })
        }


        return self;

    }
)
()