var Tablette = (function () {
        var self = {};


        self.onTabletteOperationSelect = function (select) {
            var operation = $(select).val();

            $("#popupD3Div").css("visibility","hidden");
            $("#select").val("");


            if (operation == "createUnder") {
                //   return alert("en construction");
                if (!magasinD3.isTabletteLastInTravee(magasinD3.currentTablette)) {
                    return (alert("on ne peut creer de nouvelle tablette que sous la dernièer d'une travee"))
                } else {
                    context.currentTable = "magasin";
                    mainController.showNewRecordDialog();
                }
            }
            else if (operation == "split") {
                return alert("en construction");
                var html = "<br>Pourcentage restant sur l'ancienne tablette : <input size='3' id=tablette_percentageRemainingOnTopTablette value='50'> %";
                html += "<button onclick='Tablette.split();'>OK</button>";
                $("#popupD3DivOperationDiv").html(html);

            }
            else if (operation == "delete") {
                return alert("en construction");
                html = "<button onclick='Tablette.delete();'>OK</button>";
                $("#popupD3DivOperationDiv").html(html);

            }
            else if (operation == "setUnavailable") {
                var coordonnees=magasinD3.currentTablette.name
                var sql="select * from magasin where coordonnees='"+coordonnees+"'"
                mainController.execSql(sql, function(err, result) {
                    if (err)
                        return mainController.setErrorMessage(err);
                    if (result.length > 0) {
                        if (result[0].numVersement != null && result[0].numVersement != "")
                            return alert("une tablette occupée par un versement ne peut être marquee indisponible")
                    }
                    var sql = "update magasin set indisponible=1 where coordonnees='" + coordonnees + "'"
                    mainController.execSql(sql, function (err, result) {
                        if (err)
                            return mainController.setErrorMessage(err);

                        var options = {filter: {tablettes: [magasinD3.currentTablette.name]}}
                        magasinD3.drawMagasins(options);

                    })
                })

            }


            if (operation == "entrerVersementExistant") {


                var html = self.getEnterVersementExistantDialogHtml();
                html += "<br><button id='popupD3DivOperationDiv_okButtonExistant' onclick='Versement.doAfterEntrerVersementExistantDialogValidate();'>OK</button>";
                html += "<br><button style='visibility: hidden' id='popupD3DivOperationDiv_okButtonAll' onclick='Versement.doAfterEntrerVersementDialogValidate();'>OK</button>";

                $("#popupD3DivOperationDiv").html(html);
                $(".popupD3DivOperationDiv_hiddenInput").css("visibility", "hidden");
                $("#popupD3DivOperationDiv_numVersement").focus();


            }

            if (operation == "entrerNouveauVersement") {
                var html = "metrage <input style='width:30px' id='popupD3DivOperationDiv_metrage'><br>";
                html += "nombre de boites<input style='width:30px' id='popupD3DivOperationDiv_nbBoites'><br>";
                html += "index cote de début<input style='width:30px' id='popupD3DivOperationDiv_coteDebut' value='1'> ";
                html += "<br><button onclick='Versement.doAfterEntrerVersementDialogValidate();'>OK</button>";

                $("#popupD3DivOperationDiv").html(html);
                $("#popupD3DivOperationDiv_metrage").focus();

            }


        }

        self.getEnterVersementExistantDialogHtml = function () {
            var html = "<br>Numero du versement : <input size='4' id=popupD3DivOperationDiv_numVersement value=''> ";

            html += "<br>metrage <input  class='popupD3DivOperationDiv_hiddenInput' style='width:30px' id='popupD3DivOperationDiv_metrage'><br>";
            html += "nombre de boites<input class='popupD3DivOperationDiv_hiddenInput' style='width:30px' id='popupD3DivOperationDiv_nbBoites'><br>";
            html += "index cote de début<input class='popupD3DivOperationDiv_hiddenInput' style='width:30px' id='popupD3DivOperationDiv_coteDebut' value='1'> ";


            return html;

        }

        self.getIntegrerVersementDialogParams = function () {
            var metrageFromDialog = $("#popupD3DivOperationDiv_metrage").val();
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
            var sql = "update  magasin set commentaires='" + commentaires + "' where id=" + idMagasin;
            mainController.execSql(sql, callback);

        }

        self.locate = function () {

            var coordonnees = prompt("coordonnees :")
            if (coordonnees && coordonnees != "") {
                magasinD3.locate("tablette", "id", [coordonnees], 1);
            }
            // return alert("en construction");
        }

        self.onAfterSave = function (options) {

            var idMagasin = options.currentRecord.id;
            var coordonnees = options.changes.coordonnees || options.currentRecord.coordonnees;
            var elts = self.getCoordonneesElements(coordonnees);
            options.currentRecord.magasin = elts.magasin;
            options.currentRecord.epi = elts.epi;
            options.currentRecord.travee = elts.travee;
            options.currentRecord.tablette = elts.tablette;
            var sql = "update magasin set magasin='" + elts.magasin + "',epi='" + elts.epi + "',travee='" + elts.travee + "',tablette='" + elts.tablette + "' where id=" + idMagasin;
            mainController.execSql(sql);


            var options = {filter: {tablettes: [options.currentRecord.tablette]}}
            magasinD3.drawMagasins(options);


        }

        self.testRedraw = function () {
            var name = prompt("tablette", "A-02-11-5");
            if (name != null) {
                var options = {filter: {tablettes: [name]}}
                magasinD3.drawMagasins(options);


            }
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


        return self;
    }
)()