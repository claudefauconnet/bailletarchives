var Retraitement = (function () {
    var self = {};


    self.start=function(){
        var numVersement = $("#attr_numVersement").val();
        if( confirm("Confirmez la suppression des  boites de ce traitement et liberer les tablettes asscoiées ")){
            var nBoites=0;
            var tablettes=[];
            async.series([


                // vidage des tablettes du versement
                function (callbackSeries) {

                    var sql = "SELECT * from magasin  where numVersement='" + numVersement + "'";
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        if (result.length == 0)
                            return callbackSeries("le versement " + numVersement + " n'esxiste pas");

                        var magasinIds=[]
                        tablettes=result;
                        result.forEach(function(tablette) {
                            nBoites+=Tablette.getBoitesTablette(tablette).length
                            magasinIds.push(tablette.id)
                        })

                        Tablette.releaseTablettesById(magasinIds,function(err){
                            callbackSeries(err);
                        })

                    })
                },


                // update versement
                function (callbackSeries) {
                $("#attr_etatTraitement").val("retraitement/recondionnement");
                    var sql = "update versement set etatTraitement='retraitement/recondionnement', nbBoites=null,metrage=null where id="+context.currentRecord.id
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        callbackSeries();
                    })
                },

                // ajout record retraitment dans historique_versement
                function (callbackSeries) {
                    var commentaire = "suppression de "+nBoites+" boites "

                    Versement.updateRecordHistory(context.currentRecord.id, "retraitement/recondionnement", authentication.currentUser.nomComplet, commentaire, new Date(), function (err, result) {
                        callbackSeries();
                    })

                },


                //mise à jour dessin
                function (callbackSeries) {
                var travees=[];
                    if (tablettes) {
                        tablettes.forEach(function (tablette) {
                            var coordonneesObj = Tablette.getCoordonneesElements(tablette.coordonnees);
                            if (travees.indexOf(coordonneesObj.travee) < 0)
                                travees.push(coordonneesObj.travee);
                        })
                    }
                    var options = {filter: {travees: travees}}
                    magasinD3.drawMagasins(options);
                    callbackSeries();
                }
                    //mise à jour record form
                , function (callback) {

                    var sql = "select * from versement where id=" + context.currentRecord.id;
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return callback(err);
                        recordController.displayRecordData(result[0]);
                        callback(null);
                    })

                }

            ],function(err){
                if(err)
                    return mainController.setErrorMessage(err);
                return mainController.setMessage("opération terminée");

            })

        }



    }



  /*

    self.start = function () {
        var numVersement = $("#attr_numVersement").val();
        Tablette.showVersementBoitesCbx(numVersement, function (err, htmlBoites) {
            var html = "<div style='background: white'>";
            html += "versement source " + numVersement;
            html += "versement cible " + "<input id='retraitement_numVersementCible'>";
            html += "<button onclick='Retraitement.execute()'>Reconditionner</button>"
            html += "<button onclick=' $(\"#dialogDiv\").dialog(\"close\");'>Annuler</button>"
            html += htmlBoites;
            html += "</div>"
            $("#dialogDiv").html(html)
            $("#dialogDiv").dialog("open");
        });

    }




    self.onAllCbxChanged = function (cbx, tabletteCoords) {
        var checked = $(cbx).prop("checked")
        $(".retraitementCbx").each(function () {
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
        var numVersementCible = $("#retraitement_numVersementCible").val();

        if (numVersementCible == "") {
            if (!confirm("supprimer les boites sélectionnées de ce versement ?")) {
                return;
            } else
                numVersementCible = null;
        }


        var boitesEnMouvement = [];
        var versementCible = null;
        var versementSource = null;
        var longueurBoitesSource = 0;
        var longueurCibleDisponible = 0;
        var tablettesCible = [];
        var tablettesSourceApresOperation = [];
        var tablettesCibleAvantOperation = [];
        var tablettesCibleApresOperation = [];
        var derniereTabletteVersemntCibleAvantOperation=null;
        var tailleMoyenneBoites = config.tailleMoyenneBoite

        $(".retraitementCbx").each(function () {
            if ($(this).prop("checked")) {

                var value = $(this).val();
                boitesEnMouvement.push(value)

            }
        })

        if (boites.length == 0) {
            message = "aucune boite selectionnée";
            return;
        }
        async.series([


                // recherche versement source et longueur des boites à deplacer
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

                // vidage des tablettes sources et ecriture  des tablettes sources restantes
                function (callbackSeries) {
                    var sql = "SELECT * from magasin where id_versement=" + versementSource.id + "";
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        result.forEach(function (tablette) {
                            var boitesTabletteSource = tablette.cotesParTablette.split(" ");
                            var cotesParTabletteNew = "";
                            boitesTabletteSource.forEach(function (boiteSource) {
                                if (boitesEnMouvement.indexOf(boiteSource) < 0) {
                                    if (cotesParTabletteNew != "")
                                        cotesParTabletteNew += " ";
                                    cotesParTabletteNew += boiteSource
                                }
                            })

                            tablettesSourceApresOperation.push({id: tablette.id, id_versement: tablette.id_versement, cotesParTablette: cotesParTabletteNew})

                        });


                        async.eachSeries(tablettesSourceApresOperation, function (tablette, callbackEach) {
                            var sql = "";
                            if (tablette.cotesParTablette == "")// on deaffecte le tablette du versment
                                var sql = "Update magasin  set id_versement==null,numVersement=null, cotesParTablette='" + tablette.cotesParTablette + "' where id" + tablette.id + "";
                            else
                                var sql = "Update magasin  set  cotesParTablette='" + tablette.cotesParTablette + "' where id" + tablette.id + "";
                            mainController.execSql(sql, function (err, result) {
                                if (err)
                                    return callbackEach(err);
                                return callbackEach()

                            })
                        })
                    })
                }

                ,
                // renumerotation  des boites transportées a la fin des boites du versement cible;
                function (callbackSeries) {
                    if (!versementCible)
                        return callbackSeries();

                    var numDebutNouvellesBoites = 1
                    var sql = "SELECT * from magasin where id_versement=" + versementCible.id + "";
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        if (result.length > 0) {
                            var lastTablette = result[result.length - 1];
                            derniereTabletteVersemntCibleAvantOperation=lastTablette;

                            var boitesDerniereTablette = Tablette.getBoitesTablette(lastTablette);
                            if (boitesDerniereTablette.length > 0) {

                                var str = boitesDerniereTablette[boitesDerniereTablette.length] - 1;
                                numDebutNouvellesBoites = str.split("/")[1] + 1
                            }
                        }
                        var numBoite = numDebutNouvellesBoites;
                        boitesEnMouvement.forEach(function (boite, indexBoite) {
                            var strBoite = versementCible.numVersement + "/" + numBoite
                            numBoite += 1;
                            boitesEnMouvement[indexBoite] = strBoite;

                        })
                        return callbackSeries();
                    })
                }
                ,
            // verifier si il y a de la place sur le derniere tablette cible et lui affecter le nombre de boites possible
            function (callbackSeries) {
                if (!derniereTabletteVersemntCibleAvantOperation || Tablette.getBoitesTablette(derniereTabletteVersemntCibleAvantOperation).length == 0)
                    return callbackSeries();

            },

                // ajout des boites   des  tablettes cibles  dans magasin
                function (callbackSeries) {
                    if (!versementCible)
                        return callbackSeries();






                    return callbackSeries();
                },


            ],

            function (err) {
                if (err)
                    return alert(err);
                $("#dialogDiv").dialog("close")
                return alert(" operation terminée : déplacé "+boitesEnMouvement.length)+" boites de versement "+versementSource.numVersement+" vers "+versementCible.numVersement+""
            }
        )


    }*/


    return self;


})()
