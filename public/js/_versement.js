var Versement = (function () {

        var self = {};
        self.currentCandidateTablettes = []
        //   self.updateRecordHistory = function (id, etat, commentaire) {


        self.onAfterSave = function (options, callback) {
            $("#versementEntrerEnMagasinButton").removeAttr("disabled");
            $("#versementLocaliserButton").removeAttr("disabled");
            $("#versementRefoulerButton").removeAttr("disabled");
            $("#versementAjouterTabletteButton").removeAttr("disabled");


            var idVersement = options.currentRecord.id;
            var etatTraitement = options.changes.etatTraitement || options.currentRecord.etatTraitement;
            var etatTraitementDate = util.uiStrDateToDate(options.changes.etatTraitementDate || options.currentRecord.etatTraitementDate);
            var etatTraitementAuteur = options.changes.etatTraitementAuteur || options.currentRecord.etatTraitementAuteur;

            self.updateRecordHistory(idVersement, etatTraitement, etatTraitementAuteur, null, etatTraitementDate, function (err, result) {
                if (err)
                    return callback(err);
                listController.loadLinkedDivs();
                callback()
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

            var sql = "select numVersement from versement where id=" + idVersement;
            mainController.execSql(sql, function (err, result) {
                if (err) {
                    if (callback)
                        return callback(err)
                    else
                        return console.log(err);
                }

                var numVersement = result[0].numVersement;


                var sql2 = " insert into versement_historique (etat,etatAuteur, etatDate,dateModification,commentaire,id_versement,numVersement) values (" +
                    "'" + etatTraitement + "'," +
                    "'" + etatTraitementAuteur + "'," +
                    "'" + date + "'," +
                    "'" + util.dateToMariaDBString(new Date()) + "'," +
                    commentaireStr + "," +
                    idVersement + "," +
                    numVersement + ")"
                mainController.execSql(sql2, function (err, result) {
                    if (err) {
                        if (callback)
                            return callback(err)
                        else
                            return console.log(err);
                    }
                    if (callback) return callback(null)


                })
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
            $("#dialogD3").dialog("close");
            mainController.showInMainDiv("graph");
            var highlighted = [new RegExp(context.currentRecord.numVersement + "\\/\\d+")]
            magasinD3.locate("boite", "name", highlighted, 1.0)

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
            // get tablettes ot this versement
            var sql = "select * from magasin where id_versement=" + context.currentRecord.id;
            mainController.execSql(sql, function (err, result) {
                if (err)
                    return callback(err);
                if (result.length > 0) {
                    var coteDebutIndex = Tablette.getPremiereCoteTablettes(result);
                    $("#popupD3DivOperationDiv_coteDebut").val(coteDebutIndex);
                }

            })

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


                        callback();
                    })

                },


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
                    if (confirm("\"cette tablette est déja occupée  mais peut accueillir ce versement, confirmer l'ajout\"")) {
                        Tablette.splitTablette(tablette.name, null, function (err, newTabletteId) {

                            Versement.entrerVersement({useTabletteId: newTabletteId});


                        })
                        return;

                    } else {
                        return;
                    }
                }

            }

            var tailleMoyBoite = params.metrage / params.nbBoites;
            var coordonnees = tablette.name;
            params.tailleMoyBoite = tailleMoyBoite;
            magasinD3.chercherTablettesPourVersement(params, coordonnees, function (err, tablettesContigues) {
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
                    buttonTitle = " entrer"

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
                etatTraitement: "référencement",
                metrage: params.metrage,
                nbBoites: params.nbBoites,
                cotesExtremesBoites: ""
            };
            async.series([
                    function (callback) {// set new numero de versement
                        if (numVersement) {
                            versement.numVersement = numVersement;
                            callback()
                        } else {
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
                        } else {
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
                                        if (tablettesaRefouler.length > 0) {
                                            params.coteDebutIndex = Tablette.getPremiereCoteTablettes(tablettesaRefouler);
                                        }

                                        callback();
                                    } else {
                                        callback("refoulement abandonné");
                                    }

                                } else {
                                    callback();
                                }


                            })
                        }

                    },

                    function (callback) {// pour mise à jour à la fin  et calcul recherche tablettes contigues
                        mainController.showInMainDiv("graph");
                        callback();

                    },


                    function (callback) {// process refoulement : libere les tablettes du versement : numVersement et cotesParTablette vides
                        if (!tablettesaRefouler)
                            callback();
                        else {
                            versement.etatTraitementAuteur = authentication.currentUser.nomComplet;
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

                        } else if (coordonneesTablettes) {
                            var tablettesStr = ""
                            coordonneesTablettes.forEach(function (coordonnee, index) {
                                if (index > 0)
                                    tablettesStr += ",";
                                tablettesStr += '"' + coordonnee + '"';

                            })
                            var sql = "select id, coordonnees,DimTabletteMLineaire,cotesParTablette from magasin where coordonnees in (" + tablettesStr + ") order by coordonnees";
                            mainController.execSql(sql, function (err, result) {
                                if (err)
                                    return callback(err);

                                tablettes = result;
                                tablettes = self.setCotesParTablette(versement, tablettes, params.nbBoites, tailleMoyBoite, params.coteDebutIndex);
                                if (tablettes.duplicateTablette) {
                                    var duplicate = tablettes.duplicateTablette;
                                    var options={idVersement:versement.id,numVersement:versement.numVersement,cotesParTablette:duplicate.cotesParTablette}
                                    Tablette.splitTablette(duplicate.tablette.coordonnees, options, function (err, result) {
                                        if (err) {
                                            return callback(err);
                                        }
                                        return callback();

                                    })
                                } else {
                                    callback();
                                }


                                versement.cotesExtremesBoites = self.getTablettesCotesExtremes(tablettes);


                            })
                        } else
                            callback();
                    },
                    function (callback) {//create coordonnees tablettes
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
                        if (tablettesaRefouler)
                            return callback();
                        Versement.updateRecordHistory(versement.id, "entree en magasin", authentication.currentUser.nomComplet, "", new Date(), function (err, result) {
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
                            magasinD3.drawAll();

                        }
                        callback(null);
                    }
                    , function (callback) {// display record
                        // listController.listRecords("select * from versement where id=" + versement.id);
                        var sql = "select * from versement where id=" + versement.id;
                        mainController.execSql(sql, function (err, result) {
                            if (err)
                                return callback(err);
                            dialogD3.dialog("close");
                            recordController.displayRecordData(result[0]);
                            callback(null);
                        })

                    }
                ]
                ,
                function (err) {// at the end dispalay  versement and tablettes
                    tablettesaRefouler = null;

                    $("#popupD3Div").css("visibility", "hidden");
                    $("#popupD3DivOperationDiv").html("");
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

                    var sql = "update magasin set id_versement=null, numVersement='',commentaires='', cotesParTablette='' where coordonnees in (" + tablettesStr + ") and id_versement=" + versement.id;
                    //and versement.id="+versement.id;  pour prendre en compte les tablettes avec plusieurs versements !!
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        callbackSeries();
                    })
                },

                function (callbackSeries) {

                    var sql = "update versement set etatTraitement='référencement',etatTraitementAuteur='" + versement.etatTraitementAuteur + "', etatTraitementDate='" + util.dateToMariaDBString(new Date()) + "' where id=" + versement.id;
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
                    Versement.updateRecordHistory(versement.id, "refoulement", authentication.currentUser.nomComplet, commentaire, new Date());
                    callbackSeries();
                }
            ], function (err) {
                if (err) {
                    return callback(err);
                }
                dialogD3.dialog("close");
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
                var tabletteOccupeeDone = false;
                var tablettes2=[];

                // *************************traitement pour aggreger les tablettes avec les memes coordonnées
                var tablettesMap={}
                tablettes.forEach(function (tablette) {
                    if(!tablettesMap[tablette.coordonnees])
                        tablettesMap[tablette.coordonnees]=tablette
                    else
                        tablettesMap[tablette.coordonnees].cotesParTablette+","+tablette.cotesParTablette;
                })
                tablettes=[]
                for (var key in tablettesMap){
                    tablettes.push(tablettesMap [key])
                }
                // *************************fin traitement pour aggreger les tablettes avec les memes coordonnées

                var boiteIndex = coteDebut;
                var totalBoites = 0;

                var newSplittedTabletteId =
                    tablettes.forEach(function (tablette) {
                        var cotesParTablette = "";
                      //  var tabletteNbBoites = getTabletteNbBoites(tablette);
                        var longueurDisponible=Tablette.getLongueurDisponibleSurTablette(tablette,tailleMoyBoite);;
                        var tabletteNbBoites = Math.floor(longueurDisponible/ (tailleMoyBoite));
//console.log(tablette.coordonnees+"  "+longueurDisponible+" "+tabletteNbBoites)
                        for (var i = 0; i < tabletteNbBoites; i++) {
                            var cote = versement.numVersement + "/" + util.integerToStringWithFixedLength(boiteIndex, config.coteBoiteNbDigits);
                            if (cotesParTablette != "")
                                cotesParTablette += " ";
                            cotesParTablette += cote;
                            boiteIndex += 1;
                            totalBoites += 1
                            if (totalBoites >= nbBoites)
                                break;

                        }
                   //     console.log(tablette.coordonnees+"  "+longueurDisponible+" "+tabletteNbBoites+"  "+cotesParTablette)

                        if (tablette.cotesParTablette && tablette.cotesParTablette != "" ) {
                            if(!tablettes2.duplicateTablette)
                            tablettes2.duplicateTablette = {tablette: tablette, cotesParTablette: cotesParTablette}

                        } else {
                            tablette.cotesParTablette =cotesParTablette;
                            tablettes2.push(tablette)
                        }
                    })
                return tablettes2;
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

            //    console.log(sql)
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
            params.magasin = $("#popupD3DivOperationDiv_Magasin").val().toUpperCase();
            if (params.error)
                return alert(params.error);
            var tabletteDebutCoord = $("#popupD3DivOperationDiv_tabletteDebut").val();
            var tailleMoyBoite = params.metrage / params.nbBoites;


            async.series([
                    function (callbackSeries) {

                        if (!tabletteDebutCoord || tabletteDebutCoord == "") {// chercher des tablettes depusi le début au à partir de coteDebutIndex)
                            return callbackSeries();
                        }

                        var sql = "select magasin.* from magasin where coordonnees='" + tabletteDebutCoord + "'"
                        //il peut y avoir plusieurs versement sur les memes coordonnées donc plusieurs id magasin correspondant

                        mainController.execSql(sql, function (err, result) {

                            if (err)
                                return alert(err)
                            if (result.length == 0)
                                return alert("cette tablette n'existe pas")
                            var tabletteCible = result[0];

                            var obj = {metrage: params.metrage, magasin: params.magasin}

                            // tablette deja occupee
                            if (tabletteCible.id_versement && tabletteCible.id_versement != "") {
                                var metrageOccupe = 0;
                                if (tabletteCible.cotesParTablette)
                                    metrageOccupe = (tabletteCible.cotesParTablette.split(" ").length) * config.tailleMoyenneBoite;


                                // petites versements à mettre sur la meme tablette: duplication des coordonnées de tablette dans deux entrees magasin (marge margeAjoutVersementSurTabletteOccupee)
                                if ((tabletteCible.DimTabletteMLineaire - metrageOccupe) > (obj.metrage + config.margeAjoutVersementSurTabletteOccupee)) {
                                    if (confirm("cette tablette est déja occupée  mais peut accueillir ce versement, confirmer l'ajout")) {
                                        Tablette.splitTablette(tabletteCible.coordonnees, null, function (err, newTabletteId) {
                                            Versement.entrerVersement({useTabletteId: newTabletteId});
                                        })

                                    } else {
                                        alert("cherchez un autre emplacement...")

                                    }
                                } else{
                                    //  alert(" pas assez de place sur cette tablette pour y ajouter le versement");
                                    var obj = {metrage: params.metrage, magasin: params.magasin, nbBoites: params.nbBoites}

                                    magasinD3.chercherTablettesPourVersement(obj, tabletteCible.coordonnees, function (err, result) {
                                        if (err)
                                            return alert(err);
                                        useTablette(result)
                                        return callbackSeries();
                                    })
                                }



                                return callbackSeries();


                            } else {
                                var obj = {metrage: params.metrage, magasin: params.magasin, nbBoites: params.nbBoites}
                                magasinD3.chercherTablettesPourVersement(obj, tabletteCible.coordonnees, function (err, result) {
                                    if (err)
                                        return alert(err);
                                    useTablette(result)
                                    return callbackSeries();
                                })
                            }
                        })
                    },


                    // cas recherche sans tablette initiale et avec ou sans magasin
                    function (callbackSeries) {

                        if (tabletteDebutCoord && tabletteDebutCoord != "")
                            return callbackSeries();

                        var obj = {metrage: params.metrage, magasin: params.magasin, nbBoites: params.nbBoites}
                        magasinD3.chercherTablettesPourVersement(obj, null, function (err, result) {
                            if (err)
                                return alert(err);
                            useTablette(result)
                        })

                        return callbackSeries();
                    }


                ], function (err) {
                }
            )


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
                $("#versementEntrerEnMagasinButton").attr("disabled", true);
                $("#versementLocaliserButton").removeAttr("disabled")
                $("#versementRefoulerButton").removeAttr("disabled")


            } else {
                $("#versementEntrerEnMagasinButton").removeAttr("disabled");
                $("#versementLocaliserButton").attr("disabled", true);
                $("#versementRefoulerButton").attr("disabled", true);
            }


        }

        self.onBeforeEditing = function (versement) {

            var userGroups = authentication.currentUser.groupes;
            if (!userGroups)
                userGroups = "NONE";
            /*  if (userGroups.indexOf("ADMIN") < 0) {
                  $("#deleteRecordButton").css("display", "none")
              }*/


            if (!versement.id) {

                $("#versementEntrerEnMagasinButton").attr("disabled", true);
                $("#versementLocaliserButton").attr("disabled", true);
                $("#versementRefoulerButton").attr("disabled", true);
                $("#versementAjouterTabletteButton").attr("disabled", true);
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

                $("#attr_etatTraitementAuteur").val(authentication.currentUser.nomComplet);
                //   recordController.incrementChanges(attr_etatTraitementAuteur);
            }
            if (!versement.centreArchive)
                $("#attr_centreArchive").val("Baillet");

            if (versement.etatTraitement)//reinitilaiser etat traitement lorsqu'on ouvre un versement (demande juillet 2019)
                $("#attr_etatTraitement").val("");

            if (versement.etatTraitementDate)//reinitilaiser etat traitement lorsqu'on ouvre un versement (demande juillet 2019)
                $("#attr_etatTraitementDate").val("");

            if (versement.etatTraitement == "retraitement/reconditionnement") {
                $("#retraitementButton").attr("disabled", true);
                $("#versementEntrerEnMagasinButton").removeAttr("disabled");

            }
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

                    var cotesBoitesStr = "";
                    var regex = /[.*^\s]\s*/gm;
                    var error=null;
                    json.forEach(function (tablette) {
                        infos.tablettes.metrage += tablette.metrage;
                        infos.tablettes.tailleTotaleTablettes += tablette.DimTabletteMLineaire
                        var tabletteBoites = [];
                        if (tablette.cotesParTablette) {
                            cotesBoitesStr += " " + tablette.cotesParTablette;

                            tablette.cotesParTablette = tablette.cotesParTablette.trim().replace(/\s+/g, " ");// si plusieurs blancs
                            //  tabletteBoites = tablette.cotesParTablette.split(" ");
                            tabletteBoites = cotesBoitesStr.trim().split(regex);


                        }
                        tabletteBoites.forEach(function (boite, index) {
                            var array=boite.split("/")
                            if(array.length!=2){
                               if( error==null)
                                   error="Erreur dans les cotes par tablette : ";
                                error+=tablette.coordonnees+" / "+boite+" ,  "
                            }
                            var p = boite.indexOf("/");
                            if (p > -1)
                                tabletteBoites[index] = parseInt(boite.substring(p + 1))

                        })
                        infos.tablettes.coteBoites.push.apply(infos.tablettes.coteBoites, tabletteBoites);


                    })

                    if( error)
                        return callback(error);
                    infos.tablettes.coteBoites.sort();

                    var regex = /[.*^\s]\s*/gm
                    var boitesArray = cotesBoitesStr.trim().split(regex);

                    var coteDebut = boitesArray[0];
                    var coteFin = boitesArray[boitesArray.length - 1];

                    infos.tablettes.cotesExtremes = coteDebut + "-" + coteFin;
                    infos.tablettes.nbreTotalBoites = boitesArray.length;


                    infos.tablettes.tailleTotaleTablettes = (Math.round(infos.tablettes.tailleTotaleTablettes * 100)) / 100
                    return callback(null, infos);


                })
            })

        }


        self.getTablettesCotesExtremes = function (tablettes) {

            var cotesBoitesStr = "";
            tablettes.forEach(function (tablette) {
                cotesBoitesStr += " " + tablette.cotesParTablette;
            })
            var regex = /[.*^\s]\s*/gm
            var boitesArray = cotesBoitesStr.trim().split(regex);
            var coteDebut = boitesArray[0];
            var coteFin = boitesArray[boitesArray.length - 1];
            return coteDebut + "-" + coteFin;


            /*   var coteDebut = tablettes[0].cotesParTablette.substring(0, tablettes[0].cotesParTablette.indexOf(" "));
               var coteFin = tablettes[tablettes.length - 1].cotesParTablette.substring(tablettes[tablettes.length - 1].cotesParTablette.lastIndexOf(" "));
               return coteDebut + coteFin;*/
        }


        self.SetVersementCotesExtremesFromMagasin = function (versementId) {
            var sql = "select * from  magasin where  id_versement=" + versementId + " order by coordonnees ";
            mainController.execSql(sql, function (err, json) {
                var input = $("#attr_cotesExtremesBoites");
                var tablettesExtremes = "pas de cotes dans magasin";
                if (json.length > 0)
                    tablettesExtremes = self.getTablettesCotesExtremes(json);
                $(input).val(tablettesExtremes)
                recordController.incrementChanges("#attr_cotesExtremesBoites");
            })
        }

        self.SetVersementnbBoitesFromMagasin = function (versementId) {


            self.getVersementMagasinInfos({id: versementId}, function (err, infos) {
                if (err)
                    return alert(err);
                $("#attr_nbBoites").val(infos.tablettes.nbreTotalBoites);
                recordController.incrementChanges("#attr_nbBoites");
            })
        }

        self.onBeforeDelete = function (record, callback) {
            var versementTablette = [];
            var redrawTablettes = false;
            async.series([

                    function (callbackSeries) {// identification  des tablettes liees
                        var sql = "select * from magasin where id_versement=" + record.id;
                        mainController.execSql(sql, function (err, result) {
                            if (err)
                                return callbackSeries(err);
                            result.forEach(function (tablette) {
                                versementTablette.push(tablette);
                            })
                            return callbackSeries();
                        })

                    },


                    function (callbackSeries) {// reinitialisation des tablettes
                        if (versementTablette.length == 0)
                            return callbackSeries();
                        if (confirm("Liberer aussi les tablettes  du versement " + record.numVersement + "?")) {
                            redrawTablettes = true;
                            var sql2 = "update magasin set cotesParTablette='',numVersement='', commentaires='', id_versement =null where id_versement=" + record.id;
                            mainController.execSql(sql2, callbackSeries);
                        } else {
                            return callbackSeries();
                        }
                    },

                    function (callbackSeries) {// redraw tablettes
                        if (versementTablette.length == 0 || !redrawTablettes)
                            return callbackSeries();
                        var travees = [];
                        versementTablette.forEach(function (tablette) {
                            var coordonneesObj = Tablette.getCoordonneesElements(tablette.coordonnees);
                            if (travees.indexOf(coordonneesObj.travee) < 0)
                                travees.push(coordonneesObj.travee);
                        })

                        var options = {filter: {travees: travees}}
                        magasinD3.drawAll();
                        return callbackSeries();

                    }


                    , function (callbackSeries) {// suppression historique
                        if (confirm("Supprimer aussi l'historique du versement " + record.numVersement + "?")) {
                            var sql = "delete from versement_historique where id_versement=" + record.id;
                            mainController.execSql(sql, callbackSeries);
                        } else {
                            return callbackSeries();
                        }
                    }
                ],

                function (err) {
                    callback(err);
                }
            )
        }
        self.onAfterDelete = function (record, callback) {
            callback();
        }


        self.onBeforeSave = function (options, callback) {
            recordController.incrementChanges(attr_etatTraitementAuteur);
            return callback();
        }

        return self;

    }
)
()
