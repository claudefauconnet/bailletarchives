var Versement = (function () {

        var self = {};
        self.currentCandidateTablettes = []
        //   self.updateRecordHistory = function (id, etat, commentaire) {


        self.updateRecordHistoryAfterVersementSave = function (options) {

            var idVersement = options.currentRecord.id;
            var etatTraitement = options.changes.etatTraitement || options.currentRecord.etatTraitement;
            var etatTraitementDate = util.uiStrDateToDate(options.changes.etatTraitementDate || options.currentRecord.etatTraitementDate);
            var etatTraitementAuteur = options.changes.etatTraitementAuteur || options.currentRecord.etatTraitementAuteur;

            self.updateRecordHistory(idVersement, etatTraitement, etatTraitementAuteur, null, etatTraitementDate, function (err, result) {
                if (err)
                    return console.log(err);
                listController.loadLinkedDivs();
            })
        }

        /**
         *
         *
         * @param options  :idVersement, etatTraitement,etatTraitementAuteur, date(optional),etatTraitementDate
         */

        self.updateRecordHistory = function (idVersement, etatTraitement, etatTraitementAuteur, etatTraitementCommentaire, etatTraitementDate, callback) {
            var date;
            if (typeof etatTraitementDate == "string")
                date = util.longDateStrToShortDateStr(etatTraitementDate)
            else
                date = util.dateToMariaDBString(etatTraitementDate);


            var commentaireStr = "''";
            if (etatTraitementCommentaire)
                commentaireStr = "'" + etatTraitementCommentaire + "'";

            var sql2 = " insert into versement_historique (etat,etatAuteur, etatDate,dateModification,commentaire,id_versement) values (" +
                "'" + etatTraitement + "'," +
                "'" + etatTraitementAuteur + "'," +
                "'" + date + "'," +
                "'" + util.dateToMariaDBString(new Date()) + "'," +
                commentaireStr + "," +
                "" + idVersement + ")"
            mainController.execSql(sql2, function (err, result) {
                if (err) {
                    if (callback)
                        return callback(err)
                    else
                        return console.log(err);
                }
                if (callback) return callback(null)


            })


        }
        self.ajouterTablette = function () {
            var tablette = prompt("coordonnées de la tablette")
            if (!tablette || tablette == "")
                return;
            var sql = "select * from magasin where coordonnees='" + tablette + "'";
            mainController.execSql(sql, function (err, result) {
                if (err) {
                    return mainController.setErrorMessage(err)
                }
                if (result.length == 0)
                    return mainController.setErrorMessage("la tablette " + tablette + " n'existe pas");
                if (result[0].numVersement && result[0].numVersement != "")
                    return mainController.setErrorMessage("la tablette " + tablette + " est déjà attribuée au versement " + result[0].numVersement);
                if (result[0].id_versement)
                    return mainController.setErrorMessage("la tablette " + tablette + " est déjà attribuée au versement avec l'id" + result[0].id_versement);

                var sql = "update magasin set id_versement=" + context.currentRecord.id + ",numVersement= '" + context.currentRecord.numVersement + "' where id=" + result[0].id;
                mainController.execSql(sql, function (err, result) {
                    if (err) {
                        return mainController.setErrorMessage(err)
                    }
                    recordController.displayRecordData(context.currentRecord)
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
        self.showDialogEntrerVersement = function () {
            //  context.currentRecord = null;
            var html = Tablette.getEnterVersementExistantDialogHtml();
            html += "<br>magasin<input id='popupD3DivOperationDiv_Magasin'style='width:50px' >"
            html += "<br>tablette debut<input id='popupD3DivOperationDiv_tabletteDebut'style='width:100px' value=''> <button onclick='Versement.chercherTablettes()'>chercher</button>"
            html += "<br><div id='popupD3DivOperationDiv_tablette'></div>"
            $("#dialogD3").html(html);

            $("#popupD3DivOperationDiv_numVersement").attr("disabled", true);


            $("#dialogD3").dialog("option", "position", {my: "center", at: "center", of: $("#mainDiv")});
            dialogD3.dialog("open")
            $("#popupD3DivOperationDiv_numVersement").val(context.currentRecord.numVersement);
            $("#popupD3DivOperationDiv_metrage").val(context.currentRecord.metrage)
            $("#popupD3DivOperationDiv_nbBoites").val(context.currentRecord.nbBoites);
        }


        self.doAfterEntrerVersementExistantDialogValidate = function (refouler) {
            var numVersement = $("#popupD3DivOperationDiv_numVersement").val();
            if (!numVersement || numVersement == "") {
                return alert("entrez un numero de versement");
            }
            var versement;


            async.series([

                function (callback) {// get versement from its numVersement

                    var sql = "select * from versement where numVersement='" + numVersement + "'"
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            callback(err);
                        if (result.length == 0)
                            callback("ce numero de versement n'existe pas")

                        versement = result[0];
                        context.currentRecord = versement;

                        if (false && (versement.etatTraitement != "en attente" && versement.etatTraitement != "décrit"))
                            callback("l'état du versement ne permet pas de l'enter en magasin")

                        callback();
                    })

                }

            ], function (err) {

                if (err) {
                    console.log(err);
                    $("#popupD3Div").css("visibility", "hidden");
                    return alert(err);

                }

                $(".popupD3DivOperationDiv_hiddenInput").css("visibility", "visible");
                if (versement.metrage)
                    $("#popupD3DivOperationDiv_metrage").val(versement.metrage);
                if (versement.nbBoites)
                    $("#popupD3DivOperationDiv_nbBoites").val(versement.nbBoites);
                $("#popupD3DivOperationDiv_okButtonExistant").css("visibility", "hidden");
                $("#popupD3DivOperationDiv_okButtonAll").css("visibility", "visible");


            })
        }


        self.doAfterEntrerVersementDialogValidate = function (numVersement) {
            var params = Tablette.getIntegrerVersementDialogParams();
            if (params.error != "")
                return alert(params.error)

            var tablette = magasinD3.currentTablette;
            if (tablette.isEmpty == false) {// le metrage doit pouvoir tenir sur la tablette si elle n'est pas vide (avec coef remplissage)
                var longeurDisponible = tablette.longueurTotale - tablette.longueurOccupee - (0.1 * config.coefRemplissageTablette)
                if (longeurDisponible <= params.metrage)
                    return alert("Tablette  déjà occupee, le métrage demandé ne rentre pas dans la tablette, choisisez une autre tablette");
                else {
                    if (confirm("Tablette  déjà occupée, confirmez l'entree de ce nouveau versement sur cette tablette")) {
                        Tablette.splitTablette(tablette.name, function (err, newTabletteId) {

                            Versement.entrerVersement({useTabletteId: newTabletteId});


                        })
                        return;

                    }
                    else {
                        return;
                    }
                }

            }

            var tailleMoyBoite = params.metrage / params.nbBoites;
            magasinD3.getTablettesContigues(tablette, params.metrage, tailleMoyBoite, function (err, tablettesContigues) {
                self.currentCandidateTablettes = tablettesContigues;
                var html = "";

                html += "<br>tablettes proposées<div id='popupD3DivOperationDivTablettesProposees' style='height: 200px;overflow: auto'><ul>"
                tablettesContigues.forEach(function (tablette) {
                    html += "<li>" + tablette + "</li>"
                })

                var buttonTitle = ""
                if (numVersement)
                    buttonTitle = "enter versement"
                else
                    buttonTitle = "creer versement et entrer"

                html += "</ul></div>"
                html += "<button onclick='Versement.entrerVersement()'>" + buttonTitle + "</button>";
                return $("#popupD3DivOperationDiv").append(html);

            })
        }


        self.entrerVersement = function (options) {
            if (!options)
                options = {};
            context.currentTable = "versement";
            // cas versement existant
            var numVersement = $("#popupD3DivOperationDiv_numVersement").val();
            if (numVersement == "")
                numVersement = null;

            var coordonneesTablettes = self.currentCandidateTablettes;

            var tablettes = [];
            var coteDebutIndex = 1;
            var err = "";

            var params = Tablette.getIntegrerVersementDialogParams();
            if (params.error != "")
                return alert(params.error)


            var tailleMoyBoite = params.metrage / params.nbBoites;
            var tablettesaRefouler = null;
            var versement = {
                etatTraitement: "en attente",
                metrage: params.metrage,
                nbBoites: params.nbBoites,
                cotesExtremesBoites: ""
            };
            async.series([
                    function (callback) {// set new numero de versement
                        if (numVersement) {
                            versement.numVersement = numVersement;
                            callback()
                        }
                        else {
                            self.getNewNumVersement(function (err, numVersement) {
                                if (err)
                                    return callback(err);
                                versement.numVersement = numVersement;
                                callback();
                            })
                        }
                    },


                    function (callback) {// create  or select versement
                        if (numVersement) {
                            var sql = "select id from versement where numVersement='" + numVersement + "'"
                            mainController.execSql(sql, function (err, result) {
                                if (err)
                                    return callback(err);
                                versement.id = result[0].id;
                                context.currentRecord = versement
                                callback()
                            })
                        }
                        else {
                            recordController.execSqlCreateRecord("versement", versement, function (err, newId) {
                                if (err)
                                    return callback(err);
                                versement.id = newId;
                                callback();
                            })
                        }
                    },


                    function (callback) {// check if tablettes have this versement id
                        if (!versement.id)// nouveau
                            return callback();
                        else {
                            var sql = "select * from magasin where id_versement=" + versement.id;
                            mainController.execSql(sql, function (err, result) {
                                if (err)
                                    return callback(err);
                                if (result.length > 0) {//refoulement total

                                    if (confirm("Ce versement est déjà entré. Confirmez le refoulement de tout ce versement sur les nouvelles tablettes")) {
                                        tablettesaRefouler = result;
                                        callback();
                                    }
                                    else {
                                        callback("refoulement abandonné");
                                    }

                                }
                                else {
                                    callback();
                                }


                            })
                        }

                    },

                    function (callback) {// pour mise à jourà la fin  et calcul recherche tablettes contigues
                        mainController.showInMainDiv("graph");
                        callback();

                    },

                    function (callback) {// process refoulement : libere les tablettes du versement : numVersement et cotesParTablette vides
                        if (!tablettesaRefouler)
                            callback();
                        else {
                            versement.etatTraitementAuteur = authentication.currentUser;
                            self.refoulerVersement(versement, tablettesaRefouler, function (err, result) {

                                if (err) {
                                    return callback(err)
                                }

                                callback();
                            })


                        }

                    },


                    function (callback) {// get taille tablettes and set cotesParTablette

                        if (options.useTabletteId) {// quand on divise une tablette(useTabletteId )  pour mettre un petit versement sur une tablette deja occupee

                            var sql = "select * from magasin where id=" + options.useTabletteId;
                            mainController.execSql(sql, function (err, result) {
                                if (err)
                                    return callback(err);
                                var tablette = result[0];
                                var cotesParTablette = "";
                                var coteIndex = params.coteDebutIndex
                                for (var i = 0; i < params.nbBoites; i++) {
                                    var cote = versement.numVersement + "/" + util.integerToStringWithFixedLength(params.coteDebutIndex, config.coteBoiteNbDigits);
                                    params.coteDebutIndex += 1
                                    if (i > 0)
                                        cotesParTablette += " ";
                                    cotesParTablette += cote;

                                }
                                tablette.cotesParTablette = cotesParTablette
                                tablettes = [tablette]
                                versement.cotesExtremesBoites = self.getTablettesCotesExtremes(tablettes);
                                callback();
                            })

                        }
                        else if (coordonneesTablettes) {
                            var tablettesStr = ""
                            coordonneesTablettes.forEach(function (coordonnee, index) {
                                if (index > 0)
                                    tablettesStr += ",";
                                tablettesStr += '"' + coordonnee + '"';

                            })
                            var sql = "select id, coordonnees,DimTabletteMLineaire from magasin where coordonnees in (" + tablettesStr + ") order by coordonnees";
                            mainController.execSql(sql, function (err, result) {
                                if (err)
                                    return callback(err);

                                tablettes = result;
                                tablettes = self.setCotesParTablette(versement, tablettes, params.nbBoites, tailleMoyBoite, params.coteDebutIndex);

                                versement.cotesExtremesBoites = self.getTablettesCotesExtremes(tablettes);
                                callback();

                            })
                        }
                        else
                            callback();
                    },
                    function (callback) {//create tablettes
                        if (tablettes.length > 0) {
                            self.AttachTablettesToVersement(versement, tablettes, params.nbBoites, tailleMoyBoite, function (err, result) {
                                if (err)
                                    return callback(err);
                                callback();
                            })
                        } else {
                            callback();
                        }
                    },
                    function (callback) {//update cotesExtremes
                        var sql = "update versement set metrage=" + versement.metrage + ", nbBoites=" + versement.nbBoites + ",cotesExtremesBoites='" + versement.cotesExtremesBoites + "' where id=" + versement.id;
                        mainController.execSql(sql, function (err, result) {
                            if (err)
                                return callback(err);
                            callback();
                        })
                    },
                    function (callback) {

                        Versement.updateRecordHistory(versement.id, "en attente", authentication.currentUser, "", new Date(), function (err, result) {
                            if (err)
                                return callback(err);
                            return callback();
                        });

                    },
                    function (callback) {// redraw tablettes
                        if (tablettes.length > 0) {

                            var travees = [];
                            tablettes.forEach(function (tablette) {
                                var coordonneesObj = Tablette.getCoordonneesElements(tablette.coordonnees);
                                if (travees.indexOf(coordonneesObj.travee) < 0)
                                    travees.push(coordonneesObj.travee);
                            })
                            if (tablettesaRefouler) {
                                tablettesaRefouler.forEach(function (tablette) {
                                    var coordonneesObj = Tablette.getCoordonneesElements(tablette.coordonnees);
                                    if (travees.indexOf(coordonneesObj.travee) < 0)
                                        travees.push(coordonneesObj.travee);
                                })
                            }
                            var options = {filter: {travees: travees}}
                            magasinD3.drawMagasins(options);

                            //   magasinD3.zoomOnMagasin(tablettes[0].substring(0, 1))
                        }
                        callback(null);
                    }
                    , function (callback) {// display record
                        // listController.listRecords("select * from versement where id=" + versement.id);
                        var sql = "select * from versement where id=" + versement.id;
                        mainController.execSql(sql, function (err, result) {
                            if (err)
                                return callback(err);

                            recordController.displayRecordData(result[0]);
                            callback(null);
                        })

                    }
                ]
                ,
                function (err) {// at the end dispalay  versement and tablettes
                    tablettesaRefouler = null;
                    $("#popupD3Div").css("visibility", "hidden");
                    $("#popupD3DivOperationDiv").css("visibility", "hidden");
                    if (err) {
                        console.log(err);
                        return mainController.setErrorMessage(err);
                    }


                }
            )
        }

            , self.refoulerVersement = function (versement, tablettesaRefouler, callback) {

            context.currentTable = "versement";
            async.series([

                function (callbackSeries) {// remove versement attrs from tablettes
                    var tablettesStr = ""
                    tablettesaRefouler.forEach(function (tablette, index) {
                        if (index > 0)
                            tablettesStr += ",";
                        tablettesStr += '"' + tablette.coordonnees + '"';

                    })

                    var sql = "update magasin set id_versement=null, numVersement='', cotesParTablette='' where coordonnees in (" + tablettesStr + ")";
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        callbackSeries();
                    })
                },

                function (callbackSeries) {

                    var sql = "update versement set etatTraitement='en attente',etatTraitementAuteur='" + versement.etatTraitementAuteur + "', etatTraitementDate='" + util.dateToMariaDBString(new Date()) + "' where id=" + versement.id;
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        callbackSeries();
                    })
                },
                function (callbackSeries) {
                    var tablettesStr = ""
                    tablettesaRefouler.forEach(function (tablette, index) {
                        if (index > 0)
                            tablettesStr += ",";
                        tablettesStr += tablette.coordonnees;

                    })
                    var commentaire = "refoulement depuis les tablettes " + tablettesStr;
                    Versement.updateRecordHistory(versement.id, "refoulement", authentication.currentUser, commentaire, new Date());
                    callbackSeries();
                }
            ], function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null, tablettesaRefouler);


            })


        },

            /**
             *
             *  // le taux d'occupation d'une tablette ne doit pas dépasser  config.coefRemplissageTablette si c'est le cas on enlève une boite qu'on met sur la tablette suivante
             *
             * @param versement
             * @param tablettes
             * @param nbBoites
             * @param tailleMoyBoite
             * @param callback
             * @constructor
             */


            self.setCotesParTablette = function (versement, tablettes, nbBoites, tailleMoyBoite, coteDebut) {


                function getTabletteNbBoites(dimTablette) {
                    // le taux d'occupation d'une tablette ne doit pas dépasser  config.coefRemplissageTablette si c'est le cas on enlève une boite qu'on met sur la tablette suivante

                    var tabletteNbBoites = dimTablette / tailleMoyBoite;
                    var decimalPart = tabletteNbBoites - Math.floor(tabletteNbBoites);
                    tabletteNbBoites = Math.floor(tabletteNbBoites);
                    if (decimalPart > (1 - config.coefRemplissageTablette))
                        tabletteNbBoites -= 1;
                    return tabletteNbBoites;
                }

                var boiteIndex = coteDebut;
                var totalBoites = 0;

                tablettes.forEach(function (tablette) {
                    var cotesParTablette = "";
                    var tabletteNbBoites = getTabletteNbBoites(tablette.DimTabletteMLineaire);
                    for (var i = 0; i < tabletteNbBoites; i++) {
                        var cote = versement.numVersement + "/" + util.integerToStringWithFixedLength(boiteIndex, config.coteBoiteNbDigits);
                        if (i > 0)
                            cotesParTablette += " ";
                        cotesParTablette += cote;
                        boiteIndex += 1;
                        totalBoites += 1
                        if (totalBoites >= nbBoites)
                            break;

                    }
                    tablette.cotesParTablette = cotesParTablette;
                })
                return tablettes;
            }


        /**
         *
         *  // le taux d'occupation d'une tablette ne doit pas dépasser  config.coefRemplissageTablette si c'est le cas on enlève une boite qu'on met sur la tablette suivante
         *
         * @param versement
         * @param tablettes
         * @param nbBoites
         * @param tailleMoyBoite
         * @param callback
         * @constructor
         */
        self.AttachTablettesToVersement = function (versement, tablettes, nbBoites, tailleMoyBoite, callback) {


            async.eachSeries(tablettes, function (tablette, callbackSeries) {

                //  var sql = "update magasin set numVersement='" + versement.numVersement + "',id_versement=" + versement.id + ",cotesParTablette='" + tablette.cotesParTablette + "' where magasin.coordonnees='" + tablette.coordonnees + "'";
                var sql = "update magasin set numVersement='" + versement.numVersement + "',id_versement=" + versement.id + ",cotesParTablette='" + tablette.cotesParTablette + "' where magasin.id='" + tablette.id + "'";

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


        self.chercherTablettes = function () {

            function useTablette(tablettes) {

                self.currentCandidateTablettes = tablettes;

                var html = Tablette.getTabletteProposeesHtml(tablettes);
                html += "<br><button onclick='Versement.entrerVersement()'>Entrer versement</button>"
                $("#popupD3DivOperationDiv_tablette").html(html);
            }


            var params = Tablette.getIntegrerVersementDialogParams();
            if (params.error)
                return alert(params.error);

            var tabletteDebutCoord = $("#popupD3DivOperationDiv_tabletteDebut").val();
            var tailleMoyBoite = params.metrage / params.nbBoites;
            if (tabletteDebutCoord && tabletteDebutCoord != "") {// chercher des tablettes depusi le début au à partir de coteDebutIndex
                var obj = {metrage: params.metrage, magasin: params.magasin}
                var sql = "select * from magasin where coordonnees='" + tabletteDebutCoord + "'";
                mainController.execSql(sql, function (err, result) {
                    if (err)
                        return alert(err)
                    if (result.length == 0)
                        return alert("cette tablette n'existe pas")
                    if (result[0].id_versement && result[0].id_versement != "")
                        return alert("cette tablette n'est pas vide")
                    var tabletteDebut = result[0];

                    magasinD3.chercherTablettesPourVersement(obj, tabletteDebut.coordonnees, function (err, result) {
                        if (err)
                            return alert(err);
                        useTablette(result)

                    })

                })
            }
            else {
                params.magasin = $("#popupD3DivOperationDiv_Magasin").val();
                var obj = {metrage: params.metrage, magasin: params.magasin}
                magasinD3.chercherTablettesPourVersement(obj, null, function (err, result) {
                    if (err)
                        return callback(err);
                    useTablette(result)
                })
            }


        }


        /*   var metrage = $("#attr_metrage").val()
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
       }*/


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

        self.setNewRecordDefaultValues = function (versement) {

            var userGroups = authentication.currentUserGroups;
            if (userGroups.indexOf("ADMIN") < 0) {
                $("#deleteRecordButton").css("display", "none")
            }


            if (!versement.id) {
                self.getNewNumVersement(function (err, numVersement) {
                    if (err)
                        return console.log(err);
                    $("#attr_numVersement").val(numVersement);
                    recordController.incrementChanges(attr_numVersement);
                })
            }
            if (versement.id) {
                $("#attr_numVersement").prop('readonly', true);
            }
            if (true || !versement.etatTraitementAuteur) {

                $("#attr_etatTraitementAuteur").val(authentication.currentUser);
                recordController.incrementChanges(attr_etatTraitementAuteur);
            }
            if (!versement.centreArchive)
                $("#attr_centreArchive").val("Baillet");
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
                var sql = "select * from  magasin where  id_versement=" + obj.id;
                mainController.execSql(sql, function (err, json) {
                    if (err)
                        return callback(err);

                    json.forEach(function (tablette) {
                        infos.tablettes.metrage += tablette.metrage;
                        infos.tablettes.tailleTotaleTablettes += tablette.DimTabletteMLineaire
                        var tabletteBoites = [];
                        if (tablette.cotesParTablette) {
                            tablette.cotesParTablette = tablette.cotesParTablette.replace(/\s+/g, " ");// si plusieurs blancs
                            tabletteBoites = tablette.cotesParTablette.split(" ");

                        }
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


        self.getTablettesCotesExtremes = function (tablettes) {
            var coteDebut = tablettes[0].cotesParTablette.substring(0, tablettes[0].cotesParTablette.indexOf(" "));
            var coteFin = tablettes[tablettes.length - 1].cotesParTablette.substring(tablettes[tablettes.length - 1].cotesParTablette.lastIndexOf(" "));
            return coteDebut + coteFin;
        }


        self.SetVersementCotesExtremesFromMagasin = function (versementId) {
            var sql = "select * from  magasin where  id_versement=" + versementId;
            mainController.execSql(sql, function (err, json) {
                var input = $("#attr_cotesExtremesBoites");
                var tablettesExtremes = "pas de cotes dans magasin";
                if (json.length > 0)
                    tablettesExtremes = self.getTablettesCotesExtremes(json);
                $(input).val(tablettesExtremes)
                recordController.incrementChanges(input);
            })
        }

        self.SetVersementnbBoitesFromMagasin = function (versementId) {
            self.getVersementMagasinInfos({id: versementId}, function (err, infos) {
                var input = $("#attr_nbBoites");
                $(input).val(infos.tablettes.coteBoites.length);
                recordController.incrementChanges(input);
            })
        }

        self.onAfterDelete = function (record, callback) {
            if (confirm("Supprimer aussi l'historique du versement " + record.numVersement + "?")) {
                if (confirm("Confirmer la suppression de l'historique du versement" + record.numVersement + "?")) {
                    var sql = "delete from versement_historique where id_versement=" + record.numVersement;
                    mainController.execSql(sql, callback);
                }
            }

        }


        return self;

    }
)
()