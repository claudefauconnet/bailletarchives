var magasinD3 = (function () {
    var self = {};

    self.currentVersement = {}
    self.currentTablette = {}
    self.currentBoite = {}
    self.currentVersementSansBoites = null;


    self.drawAll = function (containerDiv, callback) {

        if (!containerDiv)
            containerDiv = "graphWrapperDiv";
        var w = $("#" + containerDiv).width() - 5;
        var h = $("#" + containerDiv).height() - 35;

        var html = '<br>&nbsp;Magasins<span id="magasinButtonsDiv"></span>&nbsp;<span id="graphInfos"></span>'
        html += "<hr>"
        html += "<div style='margin: 3px;border:#f1d3c7 2px none; z-index:100 ;width:" + w + "px;height: " + h + "px' id='graphDiv'   class='myDatatable cell-border display nowrap'></div>"


        $("#" + containerDiv).html(html);


        $('#' + containerDiv).css("font-size", "10px");

        magasinsD3Canvas.drawAll({onclickFn: magasinD3.onCanvasClick}, function (err, result) {
            $("#magasinD3MessageDiv").html("")
            magasinsD3Canvas.zoomOnMagasin("tous")
            if (callback)
                return callback();
        });

    }


    self.onCanvasClick = function (point, obj) {
        $("#popupD3Div").css("visibility", "hidden")
        if (!obj)
            return;
        if (obj.nature == "tablette") {
            self.onTabletteClick(obj.data, point[0], point[1]);

        } else if (obj.nature == "boite") {
            self.onBoiteClick(obj.data, point[0], point[1]);

        }
    }


    self.onTabletteClick = function (tablette, x, y) {
        self.currentTablette = tablette;
        self.currentVersement = null;
        self.currentBoite = null;
        if (!tablette.commentaires)
            tablette.commentaires = "";
        var html = "";
        if (tablette.avecVersementSanscotes) {
            self.currentVersementSansBoites = tablette.versements[0];
            html = "tablette " + tablette.name + "<br>avec versement sans boites cotées : " + tablette.avecVersementSanscotes;
            html += "<br>commentaires : " + tablette.commentaires;
            html += "<br>operations tablette :<select onchange='Tablette.onTabletteOperationSelect(this)'>" +
                Tablette.getOperationSelectOptions(tablette) +
                "</select>";
        } else if (tablette.avecCotesSansVersement) {

            html = "tablette " + tablette.name + "<br> sans versement mais avec des boites cotées : ";
            html += "<br>commentaires : " + tablette.commentaires;
            html += "<br>operations tablette :<select onchange='Tablette.onTabletteOperationSelect(this)'>" +
                Tablette.getOperationSelectOptions(tablette) +
                "</select>";
        } else if (tablette.indisponible) {
            html = "tablette  " + tablette.name + "indisponible : ";
            html += "<br>commentaires : " + tablette.commentaires;
            html += "<br>operations tablette :<select onchange='Tablette.onTabletteOperationSelect(this)'>" +
                Tablette.getOperationSelectOptions(tablette) +
                "</select>";
        } else {
            html += "tablette " + tablette.name + "<br>"
            html += "<br>commentaires : " + tablette.commentaires;
            html += "<br>operations tablette :<select onchange='Tablette.onTabletteOperationSelect(this)'>" +
                Tablette.getOperationSelectOptions({})
            html += "</select>";
            html += "<div id='popupD3DivOperationDiv'></div>"

        }


        $("#popupD3Div").html(html);
        $("#popupD3Div").css("top", y - 20);
        $("#popupD3Div").css("left", x + 20)
        $("#popupD3Div").css("visibility", "visible")

    }

    self.onBoiteClick = function (boite, x, y) {
        self.currentTablette = null;
        self.currentVersement = null;
        self.currentBoite = boite;

        Versement.getBoiteVersement(boite, function (err, obj) {
            if (err)
                return console.log(err)

            var html = "boite " + boite.name + "<br>"
            html += "<table>"
            var keys = ["numVersement", "cotesExtremeBoites", "nbBoites", "metrage", "theme"];
            for (var key in obj) {
                if (keys.indexOf(key) > -1)
                    html += "<tr><td>" + key + "</td><td>" + obj[key] + "</td>"
            }
            html += "operations boite:<select onchange='Boite.onBoiteOperationSelect(this)'>"

                // html += Boite.getOperationSelectOptions();
                + " <option></option>" +
                "<option value='voirVersement'> voir versement</option>" +
                // "<option value='decalerBoite'> décaler</option>" +
                //   "<option value='supprimerBoite'> supprimer  </option>" +
                "</select>";
            html += "<div id='popupD3DivOperationDiv'></div>"
            html += "</table>"
            $("#popupD3Div").html(html);
            $("#popupD3Div").css("top", y - 20);
            $("#popupD3Div").css("left", x + 20)
            $("#popupD3Div").css("visibility", "visible")

        })

    }


    self.locate = function (nature, property, data, zoomLevel) {
        if (!Array.isArray(data))
            data = [data];
        var highlighted = [];
        magasinsD3Canvas.canvasData.forEach(function (rect, rectIndex) {
            data.forEach(function (value) {
                if (rect.nature == nature && rect.data) {
                    if (value.exec && value.test(rect.data[property]))//regex
                        highlighted.push(rectIndex)
                    else if (rect.data[property] == value)
                        highlighted.push(rectIndex)
                }
            })

        })
        if (highlighted.length == 0)
            return alert("aucune object correspondant")

        magasinsD3Canvas.highlighted = highlighted;

        if (highlighted.length == 1)
            magasinsD3Canvas.zoomOnObjectIndex(highlighted[0], 1.0)
        else
            magasinsD3Canvas.zoomOut()

    }


    self.getTabletteObject = function (coordonnees) {
        if (!magasinsD3Canvas.canvasData)
            return "data non chargées";
        var data;
        magasinsD3Canvas.canvasData.forEach(function (rect) {
            if (!data && rect.nature == "tablette" && rect.data.name == coordonnees)
                data = rect.data;
        })
        return data;


    }

    /*********************************************************************************************************************************************/


    self.chercherTablettesPourVersement = function (demande, tabletteDepartCoords, callback) {
        if (!demande.metrage || demande.metrage == null)
            return alert("metrage non spécifié");

        var tailleMoyenneBoite = demande.metrage / demande.nbBoites

        var longueurCumulee = 0;
        var tablettesOK = [];
        var done = false;
        var start = false;
        if (!tabletteDepartCoords)
            start = true;
        var magasinDepartOK = false
        var tabletteDepartOK = false




        magasinsD3Canvas.canvasData.forEach(function (rect) {
            if (rect.type == "text")
                return;
            if (done)
                return;
            // contraintes sur la tablette de début
            if (!magasinDepartOK && demande.magasin && demande.magasin != "") {
                if (rect.nature != "magasin" || rect.data.name != demande.magasin)
                    return;
                else
                    magasinDepartOK = true

            }

            if (!tabletteDepartOK && tablettesOK.length == 0 && tabletteDepartCoords && tabletteDepartCoords != "") {
                if (rect.nature != "tablette" || rect.data.name != tabletteDepartCoords)
                    return;
                else
                    tabletteDepartOK = true

            }

            if (rect.nature == "tablette") {
                var tablette = rect.data;
                var longueurDisponible=Tablette.getLongueurDisponibleSurTablette(tablette,tailleMoyenneBoite);
                if (longueurDisponible>0) {// tablette vide
                    if (tablettesOK.length > 0) {
                        if (!tablette.isEmpty || !Tablette.areTablettesContigues(tablettesOK[tablettesOK.length - 1], tablette.name)){
                            tablettesOK = []// on recommence si tablettes pas contigues
                            longueurCumulee = 0;
                        }
                    }
                    longueurCumulee += longueurDisponible;
                    tablette.longueurDisponible=longueurDisponible
                    tablettesOK.push(tablette.name)
                    if (longueurCumulee >= demande.metrage)
                        done = true;
                } else {
                    tablettesOK = []// on recommence si une tablette est occuppée
                    longueurCumulee = 0;
                }

            }

        })
        if (tablettesOK.length == 0)
            return callback("aucune tablette disponible")
        if (longueurCumulee < demande.metrage)
            return callback("aucune tablette disponible")

        return callback(null, tablettesOK);


    }


    self.isTabletteLastInTravee = function (tablette) {

        var ok = false;
        var start = false;

        magasinsD3Canvas.canvasData.forEach(function (rect, index) {
            if (start)
                return;
            if (rect.type == "text")
                return;
            if (rect.nature == "tablette" && rect.data.name == tablette.name) {
                start = true;
                if (index >= magasinsD3Canvas.canvasData.length - 2)
                    ok = true;
                if (magasinsD3Canvas.canvasData[index + 2].nature != "tablette")
                    ok = true;
            }

        })
        return ok;

    }


    self.isTabletteLastInTraveeOld = function (tablette) {
        var ok = false;
        var tabletteElts = Tablette.getCoordonneesElements(tablette.name)
        magasinsD3Canvas.canvasData.children.forEach(function (magasin) {
            if (magasin.name == tabletteElts.magasin) {
                magasin.children.forEach(function (epi) {
                    if (epi.name == tabletteElts.epi) {
                        epi.children.forEach(function (travee) {
                            if (travee.name == tabletteElts.travee) {
                                travee.children.forEach(function (tablette, index) {
                                    if (tablette.name == tabletteElts.tablette) {
                                        if (index >= travee.children.length - 1)
                                            ok = true;

                                    }
                                })

                            }
                        })
                    }
                })
            }
        })
        return ok;
    }


    return self;
})
()



