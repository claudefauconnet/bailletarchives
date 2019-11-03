var Tablette = (function () {
        var self = {};


        self.getOperationSelectOptions = function (obj) {
            var html = ""
            context.currentTable = "magasin";
            if (obj.prompt) {
                var oldTablette = $("#currentMainMenuTabletteSpan").html();

                var coordonneesTablette = prompt("coordonnées tablette :", oldTablette)
                if (!coordonneesTablette || coordonneesTablette == "")
                    return "";
                var tabletteObj = magasinD3.getTabletteObject(coordonneesTablette);
                if (typeof tabletteObj === "string")// error
                    return alert(tabletteObj)
                if (!tabletteObj)
                    return alert("Tablette non trouvée :" + coordonneesTablette)
                obj = tabletteObj;
                $("#currentMainMenuTabletteSpan").html(coordonneesTablette)
            }


            if (obj.avecVersementSanscotes) {
                html += " <option></option>" +
                    "<option value='releaseTablette'> liberer tablette</option>" +
                    "<option value='commentaire'> commentaire...</option>" +
                    "<option value='voirVersement'> voir versement</option>"
            } else if (obj.avecCotesSansVersement) {
                html += " <option></option>" +
                    "<option value='releaseTablette'> liberer tablette</option>" +
                    "<option value='voirTablette'> voir tablette...</option>" +
                    "<option value='commentaire'> commentaire...</option>"
                //   "<option value='entrerVersementExistant'> entrer versement existant</option>" +
            } else if (obj.indisponible) {
                html += " <option></option>" +
                    "<option value='voirTablette'> voir tablette...</option>" +
                    "<option value='releaseTablette'> liberer tablette</option>" +
                    "<option value='commentaire'> commentaire...</option>"
            } else {
                html += " <option></option>" +
                    //   "<option value='entrerNouveauVersement'> entrer nouveau versement</option>" +
                    "<option value='entrerVersementExistant'> entrer/refouler versement existant</option>" +
                    "<option value='voirTablette'> voir tablette...</option>" +
                    "<option value='setUnavailable'> rendre indisponible</option>" +
                    "<option value='createUnder'> creer nouvelle</option>" +
                    /* "<option value='split'> diviser </option>" +*/
                    "<option value='delete'> supprimer </option>" +
                    "<option value='commentaire'> commentaire...</option>" +
                    "<option value='reDrawTravees'>reDrawTravees</option>"
            }
            if (obj.prompt)
                html += "<option value='locate'> localiser</option>"
            return html;
        }


        self.onTabletteOperationSelect = function (select) {
            var operation = $(select).val();

            if (operation == "reDrawTravees") {
                magasinD3.reDrawTravees("B-05-03")
            }
            /*  $("#popupD3Div").css("visibility","hidden");
              $("#select").val("");*/
            if (operation == "commentaire") {
                var oldCommentaires = magasinD3.currentTablette.commentaires
                var commentaire = prompt("entrer un commentaire pour la  tablette " + magasinD3.currentTablette.name, oldCommentaires);
                if (commentaire != null && commentaire != "") {
                    commentaire = recordController.escapeMySqlChars(commentaire);
                    var sql = "update magasin set commentaires='" + commentaire + "' where coordonnees='" + magasinD3.currentTablette.name + "'";
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            mainController.setErrorMessage(err);
                        $("#popupD3Div").css("visibility", "hidden");
                        var d3Id = magasinD3.currentTablette.d3Id;
                        var options = {filter: {tablettes: [magasinD3.currentTablette.d3Id]}}
                        magasinD3.drawMagasins(options);

                    })
                }
            }

            if (operation == "voirTablette") {
                var sql = "select * from magasin where coordonnees='" + magasinD3.currentTablette.name + "'";
                mainController.execSql(sql, function (err, result) {
                    if (err)
                        mainController.setErrorMessage(err);
                    context.currentTable = "magasin"
                    recordController.displayRecordData(result[0])
                })

            }
            if (operation == "createUnder") {
                //   return alert("en construction");
                if (!magasinD3.isTabletteLastInTravee(magasinD3.currentTablette)) {
                    return (alert("on ne peut creer de nouvelle tablette que sous la dernièer d'une travee"))
                } else {
                    context.currentTable = "magasin";
                    mainController.showNewRecordDialog();
                }
                $("#popupD3Div").css("visibility", "hidden");
            } else if (operation == "split") {
                var coordonnees = magasinD3.currentTablette.name
                self.splitTablette(coordonnees)
            } else if (operation == "delete") {
                var message = "Voulez vous supprimer la tablette " + magasinD3.currentTablette.name + "";
                /*if (tablette.isEmpty == false) {
                    message+=" bien qu'elle ne soit pas vide"
                }*/
                message += " ?"
                if (confirm(message)) {
                    var sql = "delete from magasin where coordonnees='" + magasinD3.currentTablette.name + "'"
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return mainController.setErrorMessage(err);
                        var coordonneesObj = self.getCoordonneesElements(magasinD3.currentTablette.name);
                        var options = {filter: {travees: [coordonneesObj.travee]}}
                        magasinD3.drawMagasins(options);
                        $("#popupD3Div").css("visibility", "hidden");

                    })
                }

            } else if (operation == "setUnavailable") {
                var coordonnees = magasinD3.currentTablette.name;
                var coordonneesObj = Tablette.getCoordonneesElements(coordonnees)
                var sql = "select * from magasin where coordonnees='" + coordonnees + "'"
                mainController.execSql(sql, function (err, result) {
                    if (err)
                        return mainController.setErrorMessage(err);
                    if (result.length > 0) {
                        if (result[0].numVersement != null && result[0].numVersement != "" && result[0].numVersement != "0")
                            return alert("une tablette occupée par un versement ne peut être marquee indisponible")
                    }

                    var commentaire = prompt("Entrer un commentaire");
                    commentaire = recordController.escapeMySqlChars(commentaire);
                    var commentaireStr = "";
                    if (commentaire && commentaire != "")
                        commentaireStr = ", commentaires='" + commentaire + "'"


                    var sql = "update magasin set indisponible=1" + commentaireStr + " where coordonnees='" + coordonnees + "'"
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return mainController.setErrorMessage(err);

                        var options = {filter: {travees: [coordonneesObj.travee]}}
                        magasinD3.drawMagasins(options);
                        $("#popupD3Div").css("visibility", "hidden");

                    })
                })

            } else if (operation == "releaseTablette") {
                if (confirm("Confirmez la libereration de  la tablette")) {
                    self.releaseTablettes(magasinD3.currentTablette.name, function (err) {
                            if (err)
                                mainController.setErrorMessage(err);
                            var coordonneesObj = Tablette.getCoordonneesElements(magasinD3.currentTablette.name);
                            var options = {filter: {travees: [coordonneesObj.travee]}}
                            magasinD3.drawMagasins(options);
                            $("#popupD3Div").css("visibility", "hidden");
                        }
                    )
                }
            } else if (operation == "entrerVersementExistant") {


                var html = self.getEnterVersementExistantDialogHtml();
                html += "<br><button id='popupD3DivOperationDiv_okButtonExistant' onclick='Versement.doAfterEntrerVersementExistantDialogValidate();'>OK</button>";
                html += "<br><button style='visibility: hidden' id='popupD3DivOperationDiv_okButtonAll' onclick='Versement.doAfterEntrerVersementDialogValidate();'>Entrer versement</button>";

                $("#popupD3DivOperationDiv").html(html);
                $(".popupD3DivOperationDiv_hiddenInput").css("visibility", "hidden");
                $("#popupD3DivOperationDiv_numVersement").focus();


            } else if (operation == "voirVersement") {
                Boite.onBoiteOperationSelect(select)

            }
            if (operation == "entrerNouveauVersement") {
                var html = "metrage <input style='width:30px' id='popupD3DivOperationDiv_metrage'><br>";
                html += "nombre de boites<input style='width:30px' id='popupD3DivOperationDiv_nbBoites'><br>";
                html += "index cote de début<input style='width:30px' id='popupD3DivOperationDiv_coteDebut' value='1'> ";
                html += "<br><button onclick='Versement.doAfterEntrerVersementDialogValidate();'>OK</button>";

                $("#popupD3DivOperationDiv").html(html);
                $("#popupD3DivOperationDiv_metrage").focus();

            }

            if (operation == "locate") {
                self.locate(magasinD3.currentTablette.name)
            }

            $('#operationTabletteSelect').find('option').remove().end()


        }

        self.getEnterVersementExistantDialogHtml = function () {
            var html = "<br>Numero du versement : <input size='4' id=popupD3DivOperationDiv_numVersement value=''> ";

            html += "<br>metrage <input  class='popupD3DivOperationDiv_hiddenInput' style='width:30px' id='popupD3DivOperationDiv_metrage'><br>";
            html += "nombre de boites<input class='popupD3DivOperationDiv_hiddenInput' style='width:30px' id='popupD3DivOperationDiv_nbBoites'><br>";
            html += "index cote de début<input class='popupD3DivOperationDiv_hiddenInput' style='width:30px' id='popupD3DivOperationDiv_coteDebut' value='1'> ";


            return html;

        }

        self.getIntegrerVersementDialogParams = function () {
            var metrageFromDialog = $("#popupD3DivOperationDiv_metrage").val().replace(",", ".");
            var nbBoitesFromDialog = $("#popupD3DivOperationDiv_nbBoites").val();
            var coteDebutFromDialog = $("#popupD3DivOperationDiv_coteDebut").val();
            var error = ""
            if (metrageFromDialog == "" || isNaN(metrageFromDialog))
                error += "Le format du  métrage n'est pas correct.";
            var metrage = parseFloat(metrageFromDialog.replace(",", "."));
            if (nbBoitesFromDialog == "" || isNaN(nbBoitesFromDialog))
                error += "Le format du  nombre de boites n'est pas correct.";
            var nbBoites = parseInt(nbBoitesFromDialog);
            if (coteDebutFromDialog == "" || isNaN(coteDebutFromDialog))
                error += "Le format de  la cote de début n'est pas correct.";
            var coteDebutIndex = parseInt(coteDebutFromDialog);

            return {error: error, metrage: metrage, nbBoites: nbBoites, coteDebutIndex: coteDebutIndex};

        }

        self.getTabletteProposeesHtml = function (tablettes) {
            var html = "";

            html += "<br>tablettes proposées<div id='popupD3DivOperationDivTablettesProposees' style='height: 200px;overflow: auto'><ul>"
            tablettes.forEach(function (tablette) {
                html += "<li>" + tablette + "</li>"
            })
            return html;
        }


        self.split = function () {
            if (!magasinD3.currentTablette)
                return;
            /*  var percentage = parseInt($("#tablette_percentageRemainingOnTopTablette").val())
              var payload = {
                  operation: "split",
                  tablette: JSON.stringify(self.currentTablette),
                  options: JSON.stringify({splitPercentage: percentage})

              }
              self.executeOnServer("modifytravee", payload, function (err, result) {
                  if (err) {
                      return mainController.setErrorMessage(err);
                  }
                  $("#popupD3Div").css("visibility", "hidden");
                  magasinD3.drawMagasins();
              })*/

        }
        self.decalerBoites = function () {

        }


        self.delete = function () {
            if (!magasinD3.currentTablette)
                return;
            var payload = {
                operation: "delete",
                tablette: JSON.stringify(self.currentTablette),
                options: JSON.stringify({})

            }
            self.executeOnServer("modifytravee", payload, function (err, result) {
                if (err) {
                    return mainController.setErrorMessage(err);
                }
                $("#popupD3Div").css("visibility", "hidden");
                //   magasinD3.drawMagasins()
            })

        }
        self.create = function (callback) {

            return;


            var payload = {
                operation: "create",
                tablette: JSON.stringify(magasinD3.currentTablette),
                options: JSON.stringify({})

            }
            self.executeOnServer("modifytravee", payload, function (err, result) {
                if (err) {
                    return mainController.setErrorMessage(err);
                }
                $("#popupD3Div").css("visibility", "hidden");
                //  magasinD3.drawMagasins()
            })
        }


        self.executeOnServer = function (urlSuffix, payload, callback) {
            $.ajax({
                type: "POST",
                url: mainController.urlPrefix + "/" + urlSuffix,
                data: payload,
                dataType: "json",
                success: function (json) {
                    return callback(null, json);
                },
                error: function (err) {
                    console.log(err.responseText)
                    return callback(err.responseText);
                }
            })
        }

        self.getPremiereCoteTablettes = function (tablettes) {
            if (!Array.isArray(tablettes)) {
                tablettes = [tablettes];
            }

            if (!tablettes || tablettes.length == 0)
                return 1;
            var cotesFirstTablette = tablettes[0].cotesParTablette;
            if (cotesFirstTablette && cotesFirstTablette != "")
                var array = /[0-9]{4}\/([0-9]{3})/.exec(cotesFirstTablette);
            if (array.length > 1) {
                try {
                    return parseInt(array[1])
                } catch (err) {
                    return 1;
                }
            }
            return 1;
        }

        self.areTablettesContigues = function (a, b) {

            arrayA = a.split("-");
            arrayB = b.split("-");
            if (arrayA.length != 4 || arrayB.length != 4)
                return null;
            for (var i = 1; i < 4; i++) {
                arrayA[i] = parseInt(arrayA[i])
                arrayB[i] = parseInt(arrayB[i])
            }

            if (arrayB[3] - arrayA[3] == 1)//mema travee
                return true;
            else {// changement de travee
                if (arrayB[2] - arrayA[2] == 1)
                    return true;
                else {
                    if ((arrayB[1] - arrayA[1]) == 1 && (arrayB[2] - arrayA[2]) > 0)//changement d'épi
                        return true;
                    else
                        return false;
                }
            }


        }
        self.setNewTabletteCoordonnees = function () {
            if (!context.currentRecord.id && ($("#attr_coordonnees").val() == null || $("#attr_coordonnees").val() == "")) {
                if (magasinD3.currentTablette) {
                    var newCoordonnees = self.getCoordonneesElements(magasinD3.currentTablette.name, 1).tablette;

                    $("#attr_coordonnees").val(newCoordonnees);
                    recordController.incrementChanges(attr_coordonnees);
                    $("#attr_DimTabletteMLineaire").val(magasinD3.currentTablette.longueurM);
                    recordController.incrementChanges(attr_DimTabletteMLineaire);
                }
            }
        }


        self.updateCotesParTablette = function (cotes, idMagasin, callback) {
            var sql = "update  magasin set cotesParTablette='" + cotes + "' where id=" + idMagasin;
            mainController.execSql(sql, callback);
        }
        self.updateCommentaireParTablette = function (commentaires, idMagasin, callback) {
            commentaires = recordController.escapeMySqlChars(commentaires);
            var sql = "update  magasin set commentaires='" + commentaires + "' where id=" + idMagasin;
            mainController.execSql(sql, callback);

        }

        self.locate = function (coordonnees) {

            if (!coordonnees)
                coordonnees = prompt("coordonnees :")
            if (coordonnees && coordonnees != "") {
                magasinD3.locate("tablette", "id", [coordonnees], 1);
                mainController.showInMainDiv('graph');

            }
            // return alert("en construction");
        }

        self.onAfterSave = function (options) {

            var idMagasin = options.currentRecord.id;
            var coordonnees = options.changes.coordonnees || options.currentRecord.coordonnees;
            var coordonneesObj = self.getCoordonneesElements(coordonnees);
            options.currentRecord.magasin = coordonneesObj.magasin;
            options.currentRecord.epi = coordonneesObj.epi;
            options.currentRecord.travee = coordonneesObj.travee;
            options.currentRecord.tablette = coordonneesObj.tablette;
            var sql = "update magasin set magasin='" + coordonneesObj.magasin + "',epi='" + coordonneesObj.epi + "',travee='" + coordonneesObj.travee + "',tablette='" + coordonneesObj.tablette + "' where id=" + idMagasin;
            mainController.execSql(sql, function (err, result) {
                if (err)
                    return mainController.setErrorMessage(err);
                var options = {filter: {travees: [coordonneesObj.travee]}}
                magasinD3.drawMagasins(options);

            });


        }


        self.getCoordonneesElements = function (coordonnees, increment) {

            var array = coordonnees.split("-");
            if (array.length != 4)
                return null;
            var obj = {};
            obj.magasin = array[0];
            obj.epi = obj.magasin + "-" + array[1];
            obj.travee = obj.epi + "-" + array[2];
            var numTablette = parseInt(array[3])
            if (increment)
                numTablette += increment;
            obj.tablette = obj.travee + "-" + numTablette;
            return obj;

        }
        self.releaseTablettes = function (tablettesCoordonnees, callback) {
            if (!Array.isArray(tablettesCoordonnees))
                tablettesCoordonnees = [tablettesCoordonnees];
            var sql = "update magasin set numVersement=null, id_versement=null, cotesParTablette=null,metrage=0, indisponible=null,commentaires=null where coordonnees in (" + tablettesCoordonnees.toString() + ")";
            mainController.execSql(sql, function (err, result) {
                if (err)
                    mainController.setErrorMessage(err);
                if (callback)
                    return callback(err);
            })


        }
        self.releaseTablettesById = function (magasinIds, callback) {
            if (!Array.isArray(magasinIds))
                magasinIds = [magasinIds];
            var sql = "update magasin set numVersement=null, id_versement=null, cotesParTablette=null,metrage=0, indisponible=null,commentaires=null where id in (" + magasinIds.toString() + ")";
            mainController.execSql(sql, function (err, result) {
                if (err)
                    mainController.setErrorMessage(err);
                if (callback)
                    return callback();
            })


        }

        self.onAfterEditTaletteTableCell = function (tablette, datatable, rowIndex, colIndex) {
            function updateGraph() {
                var coordonneesObj = Tablette.getCoordonneesElements(tablette.coordonnees);
                var options = {filter: {travees: [coordonneesObj.travee]}}
                magasinD3.drawMagasins(options);
            }

            if (tablette.cotesParTablette == "" && confirm("liberer la tablette (supprimer le lien avec le versement")) {
                self.releaseTablettes(tablette.name, function (err) {
                        if (err)
                            mainController.setErrorMessage(err);
                        datatable.row(rowIndex).remove().draw();
                        updateGraph();
                    }
                )


            } else {
                updateGraph();
            }
        }

        self.splitTablette = function (coordonnees, callback) {

            var sql = "select * from magasin where coordonnees='" + coordonnees + "'"
            mainController.execSql(sql, function (err, result) {
                if (err)
                    return mainController.setErrorMessage(err);
                if (result.length > 0) {
                    var tablette = result[0];
                    var coordonneesObj = self.getCoordonneesElements(coordonnees);
                    var sql2 = "insert into magasin  (coordonnees,DimTabletteMLineaire,magasin,epi,travee,tablette)" +
                        " values (" +
                        "'" + tablette.coordonnees + "'," +
                        "" + tablette.DimTabletteMLineaire + "," +
                        "'" + coordonneesObj.magasin + "'," +
                        "'" + coordonneesObj.epi + "'," +
                        "'" + coordonneesObj.travee + "'," +
                        "'" + coordonneesObj.tablette + "'" +
                        ")"


                    mainController.execSql(sql2, function (err, result) {
                        if (err)
                            mainController.setErrorMessage(err);
                        if (callback)
                            return callback(err, result.insertId);

                        /*    var options = {filter: {travees: [coordonneesObj.travee]}}
                            magasinD3.drawMagasins(options);*/
                        $("#popupD3Div").css("visibility", "hidden");


                    })
                }
            })
        }

            , self.updateCotesParTabletteZeros = function () {// check cotesParTablette and add zeros to box number if box number length <4


            var sql = "select id, cotesParTablette from magasin where cotesParTablette is not null and cotesParTablette!=''"
            mainController.execSql(sql, function (err, result) {

                result.forEach(function (line, lineIndex) {
                    var newCotesParTablette = ""
                    var boitesArray = self.getBoitesTablette(line)
                    boitesArray.forEach(function (boite, indexBoites) {
                        var p = boite.indexOf("/")
                        if (p > 0) {
                            var numVersement = boite.substring(0, p)
                            while ((boite.length - p - 1) < 3) {
                                boite = boite.substring(0, p + 1) + "0" + boite.substring(p + 1)
                            }
                        }
                        if (indexBoites > 0)
                            newCotesParTablette += " ";
                        newCotesParTablette += boite;
                    })
                    result[lineIndex].cotesParTablette = newCotesParTablette;


                })


                var str = ""

                var count = 1
                async.eachSeries(result, function (line, callbackEach) {
                    var sql = "update magasin set cotesParTablette='" + line.cotesParTablette + "' where id=" + line.id + ";";
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return callbackEach(err)
                        console.log("" + (count++))
                        callbackEach();
                    })

                }, function (err) {
                    console.log("done");
                })


            })


        }

        self.getBoitesTablette = function (tablette) {
            if (tablette && tablette.cotesParTablette && tablette.cotesParTablette != "") {
                var regex = /[.*^\s]\s*/gm
                var boitesArray = tablette.cotesParTablette.trim().split(regex);
                return boitesArray;
            } else
                return [];
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
                    context.retraitementBoites = {}
                    json.forEach(function (line) {
                        var tablette = {coordonnees: line.coordonnees, boites: [], id_tablette: line.id};
                        var boitesStr = line.cotesParTablette;
                        if (boitesStr != null && boitesStr != "") {
                            var boites = boitesStr.split(" ");
                            var maxBoitesTablette = Math.max(maxBoitesTablette, boites.length)
                            boites.forEach(function (boite) {
                                tablette.boites.push(boite)
                                context.retraitementBoites[tablette.coordonnees + "_" + boite] = {
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
                        html += "<td>" + tablette.coordonnees + "</td><td><input type='checkbox' onchange=retraitement.onAllCbxChanged($(this),'" + tablette.coordonnees + "')>Toutes</td>";
                        html += "<td>"
                        tablette.boites.forEach(function (boite) {
                            html += "<input type='checkbox'  class='retraitementCbx' value='" + tablette.coordonnees + "_" + boite + "'style='width: auto''><span style='font-size: 10px'>" + boite + "</span>"
                        })
                        html += "</td>"
                        html += "<tr>"
                    })
                    html += "</table>"


                    return callback(null, html);

                }


            })


        }


        self.showCreateTableDialog = function () {
            var jsonSchema = {
                "tablettes": {
                    "type": "object",
                    "name": "tablettes",
                    "title": " creer tablettes",
                    "properties": {
                        "magasin": {
                            "type": "string",
                            "title": "magasin",
                            "required": true
                        },
                        "nbEpis": {
                            "type": "integer",
                            "title": "nbre d'épis",
                            "required": true
                        }, "nbTravees": {
                            "type": "integer",
                            "title": "nbre de travées/epi",
                            "required": true
                        },
                        "nbTablettes": {
                            "type": "integer",
                            "title": "nbre de tablettes/travee",
                            "required": true
                        },
                        "largeurTablette": {
                            "type": "number",
                            "title": "largeur tablette (m)",
                            "default": 1.15,
                            "required": true
                        },
                    }
                }
            }


            var formStr = "<div style='width: 200px'><form id='shemaForm'></form></div>"
            $("#dialog3Div").html(formStr);
            $("#dialog3Div").dialog('open');

            var options = {
                "schema": jsonSchema,
                "onSubmit": Tablette.createTablettes
            }

            $("#shemaForm").jsonForm(options);


        }
        self.createTablettes = function (err, data) {
            $("#dialog3Div").dialog('close');
            if (err)
                return

            if (magasinD3.magasins.indexOf(data.tablettes.magasin) > -1)
                return alert("Le magasin " + data.tablettes.magasin + " existe déjà")
            var insertStr = "insert into magasin (coordonnees,DimTabletteMLineaire,magasin,epi,travee,tablette) values \n";
            for (var i = 1; i < data.tablettes.nbEpis + 1; i++) {
                for (var j = 1; j < data.tablettes.nbTravees + 1; j++) {
                    for (var k = 1; k < data.tablettes.nbTablettes + 1; k++) {
                        var epiStr = i < 10 ? ("0" + i) : ("" + i);
                        var traveeStr = j < 10 ? ("0" + j) : ("" + j);
                        var tabletteStr = ("" + k);
                        var coordonnees = data.tablettes.magasin + "-" + epiStr + "-" + traveeStr + "-" + tabletteStr;

                        insertStr += "('" + coordonnees + "'," + data.tablettes.largeurTablette +",'" + data.tablettes.magasin+ "','" + epiStr + "','" + traveeStr + "','" + tabletteStr + "'),\n"

                    }

                }

            }
            insertStr=insertStr.substring(0,(insertStr.length-2))
            mainController.execSql(insertStr, function (err, result) {
                if (err)
                    return alert(err.toString())
                return alert("tablettes créees rechergez la page pour les voir apparaitre")


            })


        }

        return self;
    }


)()
