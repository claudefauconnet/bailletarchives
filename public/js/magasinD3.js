var magasinD3 = (function () {
    var self = {};

    self.currentVersement = {}
    self.currentTablette = {}
    self.currentBoite = {}
    self.currentVersementSansBoites = null;


    self.init = function (containerDiv, callback) {
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
        if (obj.nature == "tablette") {
            self.onTabletteClick(obj.data, point[0], point[1])
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
                if (rect.nature == nature && rect.data ) {
                    if(value.exec  && value.test(rect.data[property]))//regex
                    highlighted.push(rectIndex)
                    else
                        if(rect.data[property] == value)
                            highlighted.push(rectIndex)
                }
            })

        })
        if (highlighted.length == 0)
            return alert("aucune object correspondant")

        magasinsD3Canvas.highlighted = highlighted;

        if(highlighted.length==1)
        magasinsD3Canvas.zoomOnObjectIndex(highlighted[0],1.0)
        else
            magasinsD3Canvas.zoomOut()

    }


    /*********************************************************************************************************************************************/


    self.getTabletteObject = function (coordonnees) {
        if (!magasinsD3Canvas.canvasData)
            return "data non chargées";
        var array = coordonnees.split("-");
        if (array.length != 4)
            return "coordonnees invalides";
        var tabletteOK = null;

        magasinsD3Canvas.canvasData.children.forEach(function (magasin,) {

            if (array[0] == magasin.name)
                magasin.children.forEach(function (epi) {
                    if (array[0] + "-" + array[1] == epi.name)
                        epi.children.forEach(function (travee) {
                            if (array[0] + "-" + array[1] + "-" + array[2] == travee.name)
                                travee.children.forEach(function (tablette) {
                                    if (coordonnees == tablette.name) {

                                        self.currentTablette = tablette;
                                        self.currentVersement = null;
                                        self.currentBoite = null;
                                        return tabletteOK = tablette;
                                    }

                                })
                        })
                })
        })
        return tabletteOK;

    }


    self.centerOnElt = function (elt, zoomLevel) {
        if (!zoomLevel)
            var zoomLevel = d3.zoomTransform(elt).k;

    }

    self.locateOld = function (classe, property, array, zoomLevel) {

        self.clearHighlights();
        var found = 0;
        var firstBoiteName = ""
        var coordonnees = "";
        var ok = false;
        $("#popupD3Div").css("visibility", "hidden")
        d3.selectAll(".tablette rect").classed("unselected", true)
        d3.selectAll("." + classe + " rect").classed("unselected", true).each(function (d, i) {

            var firstbox = true;
            var d3Prop = d3.select(this.parentNode).attr(property);

            if (d3Prop != null && d3Prop != "") {

                if (array.indexOf(d3Prop) > -1) {
                    d3.select(this).classed("unselected", false);
                    var parent = d3.select(this.parentNode.parentNode)
                    parent.classed("unselected", false);

                    ok = true;
                    found += 1
                    if (firstbox) {
                        firstbox = false
                        //  zoom.scaleTo(svg, zoomLevel);
                        self.centerOnElt(this, zoomLevel)

                    }
                }
            }
        })

        //
        if (!ok)
            return alert("aucun element trouvé");
        d3.selectAll(".unselected").style("opacity", 0.1)
        return;


    }


    self.clearHighlights = function () {
        $("#popupD3Div").css("visibility", "hidden")
        //   d3.selectAll(".tablette rect").style("opacity", 1)
        d3.selectAll(".unselected").style("opacity", 1)
        d3.selectAll(".unselected").classed("unselected", false);
    }


    self.refreshDrawingElement = function (subTree) {
        var d3Obj = d3.select("#" + subTree.name);

        d3Obj.selectAll("g").remove()


        var children = d3Obj.select(function () {
            return this.childNodes;
        })
        subTree.children.forEach(function (child) {

        })
        vd3Obj.remove();


    }


    self.findElementInDataTree = function (coordonnees) {
        var indexArray = [];
        var obj = null;
        var coordonneesArray = coordonnees.split("-");
        magasinsD3Canvas.canvasData.children.forEach(function (mag, indexMag) {
            if (coordonneesArray[0] == mag.name) {
                indexArray.push(indexMag);
                if (!obj && coordonneesArray.length == 1)
                    obj = magasinsD3Canvas.canvasData.children[indexMag];

                mag.children.forEach(function (epi, indexEpi) {
                    if (coordonneesArray[0] + "-" + coordonneesArray[1] == epi.name) {
                        indexArray.push(indexEpi);
                        if (!obj && coordonneesArray.length == 2)
                            obj = magasinsD3Canvas.canvasData.children[indexMag].children[indexEpi];

                        epi.children.forEach(function (travee, indexTravee) {
                            if (coordonneesArray[0] + "-" + coordonneesArray[1] + "-" + coordonneesArray[2] == travee.name) {
                                indexArray.push(indexTravee);
                                if (!obj && coordonneesArray.length == 3)
                                    obj = magasinsD3Canvas.canvasData.children[indexMag].children[indexEpi].children[indexTravee];

                                travee.children.forEach(function (tablette, indexTablette) {
                                    if (!obj && coordonnees == tablette.name) {
                                        indexArray.push(indexEpi);
                                        obj = magasinsD3Canvas.canvasData.children[indexMag].children[indexEpi].children[indexTravee].children[indexTablette];
                                    }

                                })
                            }
                        })
                    }
                })
            }
        })
        return obj;
    }


    /**
     *
     * si tabletteDepartCoordonnees on ne commence que lorsqu'on la trouve
     *
     *
     * @param obj
     * @param callback
     * @returns {*}
     */
    self.chercherTablettesPourVersement = function (obj, tabletteDepartCoords, callback) {
        if (!obj.metrage || obj.metrage == null)
            return alert("metrage non spécifié");
        //obj.metrage = parseFloat(obj.metrage.replace(",", "."));
        var longueurCumulee = 0;
        var tablettesOK = [];
        var done = false;
        var start = false;
        if (!tabletteDepartCoords)
            start = true;
        magasinsD3Canvas.canvasData.children.forEach(function (magasin) {

            if (obj.magasin && obj.magasin != "")
                if (magasin.name != obj.magasin)
                    return;
            if (!done)
                magasin.children.forEach(function (epi) {
                    if (!done)
                        epi.children.forEach(function (travee) {
                            if (!done)
                                travee.children.forEach(function (tablette) {
                                    if (!start && tablette.name == tabletteDepartCoords)// si tabletteDepartCoords on ne commence que lorsqu'on la trouve
                                        start = true;

                                    if (!done && start)
                                        if ((!tablette.numVersement || tablette.numVersement == 0) && tablette.children.length == 0) {// tablette vide
                                            if (tablettesOK.length > 0 && !Tablette.areTablettesContigues(tablettesOK[tablettesOK.length - 1], tablette.name)) {
                                                tablettesOK = []// on recommence si tablettes pas contigues
                                                longueurCumulee = 0;
                                            }
                                            longueurCumulee += tablette.longueurM;
                                            tablettesOK.push(tablette.name)
                                            if (longueurCumulee >= obj.metrage)
                                                done = true;
                                        } else {
                                            tablettesOK = []// on recommence si uen tablette est occuppée
                                            longueurCumulee = 0;
                                        }


                                })
                        })
                })

        })
        if (tablettesOK.length == 0)
            return callback("aucune tablette disponible")

        return callback(null, tablettesOK);

    }


    self.isTabletteLastInTravee = function (tablette) {
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



