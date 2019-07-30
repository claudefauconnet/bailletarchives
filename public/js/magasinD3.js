var magasinD3 = (function () {
    var self = {};
    self.currentVersement = {}
    self.currentTablette = {}
    self.currentBoite = {}
    self.currentVersementSansBoites =null;
    self.data = {};
    var cachedHtml = null;


    var magasinData;
    var svg;
    var totalWidth;
    var totalHeight;
    var svgWidth;
    var svgHeight;
    var nBoitesTablette = 13;
    var tabletteTextSpacing = 8;
    var oldNumVersement = "";
    var currentBoiteColor = "#ddd";
    var currentBoiteColor = "#d5d7cc";

    var boiteColor = "";
    var containerDiv = null;
    var zoom;
    self.minZoom = .28
    self.maxZoom = 3
    self.avgZoom = 0.6
    var nMagByLine = 10;
    var drawEpis = true;
    var drawTravees = true;
    var drawTablettes = true;
    var drawBoites = true;
    var drawTraveeNumber = true;
    var drawTabletteNumber = true;

    self.magasinsToDraw = ["A", "B", "C", "D", "G", "H"];
    self.colors = {
        "magasin": "#e8c8b3",
        "epi": "#e0d5ff",
        "travee": "#e8e6e8",
        "tablette": "#fff0f0",
        "tabletteIndisponible": "#666",
        "tabletteavecVersementSanscotes": "#8EE889",
        "tabletteavecCotesSansVersement": "#E820C9"
    }

    var palette = [
        "#0072d5",
        '#FF7D07',
        "#c00000",
        '#FFD900',
        '#B354B3',
        "#a6f1ff",
        "#007aa4",
        "#584f99",
        "#cd4850",
        "#005d96",
        "#ffc6ff",
        '#007DFF',
        "#ffc36f",
        "#ff6983",
        "#7fef11",
        '#B3B005',
    ]
    var tabletteFillColor = "#d5d7cc"


    self.getTabletteObject = function (coordonnees) {
        if (!magasinData)
            return "data non chargées";
        var array = coordonnees.split("-");
        if (array.length != 4)
            return "coordonnees invalides";
        var tabletteOK = null;

        magasinData.children.forEach(function (magasin,) {
            if (array[0] == magasin.name)
                magasin.children.forEach(function (epi) {
                    if (array[0] + "-" + array[1] == epi.name)
                        epi.children.forEach(function (travee) {
                            if (array[0] + "-" + array[1] + "-" + array[2] == travee.name)
                                travee.children.forEach(function (tablette) {
                                    if (coordonnees == tablette.name){

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

    self.init = function (_containerDiv, callback) {
        // return;
        containerDiv = _containerDiv;

        var height = $("#" + containerDiv).height() - 120

        var startTime = new Date();
        var endTime = new Date();

        $("#magasinD3MessageDiv").html("Chargement du graphe en cours...")
        magasinD3.drawMagasins(null, function () {
            $("#magasinD3MessageDiv").html("")

            self.initialZoom();
            if (callback)
                return callback();
            //   zoom.translateTo(svg, 0, 0)


        })


    }
    self.initialZoom = function () {
        //  zoom.translateBy(svg, -1300, -600)
        //  self.avgZoom=1

        //  zoom.translateTo(svg,(svgWidth/2)*1, -(svgHeight/2)*1)

        //  zoom.scaleTo(svg, self.avgZoom);
        //  zoom.translateTo(d3.select(".viewport"),0, 0);
        zoom.scaleTo(svg, 1);
        // zoom.translateTo(svg, svgWidth, svgHeight)
        zoom.translateBy(svg, -svgWidth, -svgHeight)
        zoom.scaleTo(svg, self.minZoom);

        //  zoom.translateTo(svg,-(svgWidth/2)/self.avgZoom, -(svgHeight/2)/self.avgZoom)
    }


    self.initDrawMagasins = function (options) {

        var strMagasins = " Magasin :<span style='display: flex;flex-direction: row'>";
        strMagasins += "</span>";

        if (!options.magasinsToDraw)
            options.magasinsToDraw = self.magasinsToDraw;
        options.magasinsToDraw.forEach(function (magasin) {
            strMagasins += "<span style='font-size: 18px;font-weight: bold;margin: 3px;padding:3px;border-style: solid ; border-width: 1px' onclick=magasinD3.zoomOnMagasin('" + magasin + "')>" + magasin + "</span>"
        })

        var htmlStr = "<br><div><button onclick='magasinD3.clearHighlights()'>retour</button> " +
            "<button onclick='magasinD3.initialZoom()'>zoom out</button>" +
            // "<button onclick='magasinD3.zoomOnMagasin()'>zoom on Magasin</button>" +
            strMagasins +
            "<span id='magasind3MouseInfo'></span></div> " +

            "<div style=' z-index:100 ' id='graphDiv'  class='myDatatable cell-border display nowrap'></div>"


        $("#" + containerDiv).html(htmlStr);
        $('#' + containerDiv).css("font-size", "10px");

        d3.select("svg").remove();
        $("#graphDiv").html("");


        totalWidth = $("#mainDiv").width() - 50;
        totalHeight = $("#mainDiv").height() - 50;

        svgWidth = totalWidth
        svgHeight = totalHeight //* .8
        $("#graphDiv").width(svgWidth)
        $("#graphDiv").height(svgHeight)


        zoom = d3.zoom().on("zoom", function () {
            svg.attr("transform", d3.event.transform)

        }).scaleExtent([self.minZoom, self.maxZoom])

        svg = d3.select('#graphDiv')
            .append('svg')
            .attrs({width: svgWidth, height: svgHeight})
            .on("click", function () {
                $("#popupD3Div").css("visibility", "hidden")
            })
            .call(zoom)
            .append("g").attr("class", "viewport")

        ;

    }


    self.shouldDrawObject = function (options, type, obj) {
        if (options.filter) {
            if (!options.filter[type])
                return false;
            var index = options.filter[type].indexOf(obj.name);
            if (index < 0)
                return false;
            return true;
        }
        return true;
    }


    self.drawMagasins = function (options, callback) {
        $("#waitImg").show();
        if (!options)
            options = {}


        if (!options.filter) {
            self.initDrawMagasins(options);

        }


        d3.json(mainController.urlPrefix + "/magasinD3Tree", function (data) {
            var nMag = data.children.length;
            magasinData = data;
            self.data = data;


            var magW = totalWidth / 2;
            var magH = totalHeight * 2;

            var magX = 10;
            var magY = 10;
            var drawObject = true;
            data.children.forEach(function (magasin, indexMagasin) {
                    if (options.magasinsToDraw != null && options.magasinsToDraw.indexOf(magasin.name) < 0)
                        return;

                    if (magasin.name == "" || !magasin.name)
                        return;


                    magasin.x = magX;
                    magasin.y = magY;
                    magasin.h = magH;
                    magasin.w = magW;

                    drawObject = self.shouldDrawObject(options, "magasins", magasin);
                    var gMag;
                    if (!drawObject)
                        gMag = d3.selectAll("#" + magasin.name);
                    else {
                        gMag = self.drawMagasin(magasin, svg, options);
                    }

                    // draw epi
                    if (drawEpis) {
                        var epiYOffset = 20
                        var epiW = magW;
                        var epiH = (magH) / magasin.children.length;
                        epiH = epiH - epiYOffset - 1
                        var epiX = magX;
                        var epiY = magY;


                        magasin.children.forEach(function (epi, indexEpi) {


                                epi.x = epiX;
                                epi.y = epiY;
                                epi.w = epiW;
                                epi.h = epiH;

                                drawObject = drawObject | self.shouldDrawObject(options, "epis", epi);
                                var gEpi;
                                if (!drawObject)
                                    gEpi = d3.selectAll("#" + epi.name);
                                else {
                                    gEpi = self.drawEpi(epi, gMag, options);
                                }


                                if (drawTravees) {
                                    // draw travee
                                    var traveeW = epiW / epi.children.length;
                                    var traveeH = epiH;
                                    var traveeX = epiX + 10;
                                    var traveeY = epiY;
                                    epi.children.forEach(function (travee, indexTravee) {


                                        travee.x = traveeX;
                                        travee.y = traveeY;
                                        travee.w = traveeW;
                                        travee.h = traveeH;
                                        travee.indexEpi = indexEpi;
                                        travee.indexTravee = indexTravee;
                                        if (indexTravee == epi.children.length - 1)
                                            travee.w -= 30;

                                        drawObject = drawObject | self.shouldDrawObject(options, "travees", travee);
                                        var gTravee;
                                        if (!drawObject)
                                            gTravee = d3.selectAll("#" + epi.name);
                                        else {
                                            gTravee = self.drawTravee(travee, gEpi, options);
                                        }


                                        // draw tablettes
                                        var tabW = traveeW
                                        var tabH = traveeH / travee.children.length;
                                        var tabX = traveeX;
                                        var tabY = traveeY;

                                        if (drawTablettes) {
                                            // sort tablette 10>9 for alpha
                                            travee.children.sort(function (a, b) {
                                                if (!a.name.split || !b.name.split)
                                                    return 0;
                                                var aNum = parseInt(a.name.split("-")[3])
                                                var bNum = parseInt(b.name.split("-")[3])
                                                if (aNum > bNum)
                                                    return 1;
                                                if (aNum < bNum)
                                                    return -1;
                                                return 0;

                                            })

                                            travee.children.forEach(function (tab, indexTab) {

                                                tab.x = tabX;
                                                tab.y = tabY;
                                                tab.h = tabH;
                                                tab.w = tabW;
                                                tab.index = indexTab;
                                                drawObject = drawObject | self.shouldDrawObject(options, "tablettes", tab);
                                                var gTablette;
                                                if (!drawObject)
                                                    gTablette = d3.selectAll("#" + tab.name);
                                                else {
                                                    gTablette = self.drawTablette(tab, gTravee, options);
                                                }


                                                // draw boites
                                                var bteW = (tabW - tabletteTextSpacing) / nBoitesTablette // nBoitesTablette calcul de la taille des boites
                                                var bteH = tabH - 1;
                                                var bteX = tabX;
                                                var bteY = tabY + 1;

                                                if (drawBoites) {
                                                    function getRandomColor() {
                                                        var letters = '0123456789ABCDEF';
                                                        var color = '#';
                                                        for (var i = 0; i < 6; i++) {
                                                            color += letters[Math.floor(Math.random() * 16)];
                                                        }
                                                        return color;
                                                    }

                                                    tab.children.forEach(function (boite, boiteIndex) {
                                                        boite.tablette = tab;
                                                        boite.x = bteX;
                                                        boite.y = bteY;
                                                        boite.w = bteW;
                                                        boite.h = bteH;

                                                        if (oldNumVersement != boite.numVersement) {
                                                            oldNumVersement = boite.numVersement
                                                            // boiteColor = getRandomColor();
                                                            currentBoiteColor = palette[Math.floor(Math.random() * palette.length)]
                                                        }
                                                        boite.color = currentBoiteColor;
                                                        var gBoite = self.drawBoite(boite, gTablette);

                                                        bteX += bteW;
                                                    })
                                                }
                                                tabY += tabH;
                                            })
                                        }
                                        traveeX += traveeW;
                                    })
                                }
                                epiY += epiH + epiYOffset;
                            }
                        )
                    }

                    //  magY += magH + 20;
                    if (indexMagasin > 0 && indexMagasin % nMagByLine == 0) {
                        magX = 50;
                        magY += magH + 50;

                    }
                    else {
                        magX += magW + 50;
                    }


                }
            )
            $("#waitImg").hide();
            if (callback)
                callback();


        })
    }


    self.drawMagasin = function (magasin, parentG, options) {

        d3.selectAll("#" + magasin.name).remove();
        var gMag = parentG.append("g").attr("class", "magasin").attr("id", magasin.name);


        gMag.append("text")
            .attr("x", magasin.x + (magasin.w / 2))
            .attr("y", magasin.y - 20)
            .attr("dy", ".35em")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text(function (d) {
                return magasin.name
            });
        gMag.append('rect')
            .attrs({
                x: magasin.x,
                y: magasin.y,
                width: magasin.w,
                height: magasin.h,
                fill: magasinD3.colors["magasin"],
                stroke: "black",
                "stroke-width": "3"
            })
            .on("click", function () {
                $("#popupD3Div").css("visibility", "hidden")
            }).on("mouseover", function () {
            magasinD3.onMouseOver(magasin)

        });
        ;
        return gMag;
    }


    self.drawEpi = function (epi, parentG, options) {
        d3.selectAll("#" + epi.name);

        var gEpi = parentG.append("g").attr("class", "epis").attr("id", epi.name);

        gEpi.append("text")
            .attr("x", epi.x - 20)
            .attr("y", epi.y + (epi.h / 2))
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function (d) {
                return epi.name
            })

        gEpi.append('rect')
            .attrs({
                x: epi.x,
                y: epi.y,
                width: epi.w,
                height: epi.h,
                fill: magasinD3.colors["epi"],
                stroke: "black",
                "stroke-width": "3"
            }).on("mouseover", function () {
            magasinD3.onMouseOver(epi)

        });
        ;
        return gEpi;

    }


    self.drawTravee = function (travee, parentG, options) {
        d3.selectAll("#" + travee.name).remove();


        var gTravee = parentG.append("g").attr("class", "travee").attr("id", travee.name);

        if (drawTraveeNumber) {
            gTravee.append("text")
                .attr("x", travee.x + (travee.w / 2))
                .attr("y", travee.y - 10)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function (d) {
                    return travee.indexTravee + 1
                })
        }
        gTravee.append('rect')
            .attrs({
                x: travee.x,
                y: travee.y,
                width: travee.w,
                height: travee.h,
                fill: magasinD3.colors["travee"],
                stroke: "black",
                "stroke-width": "1"
            })
            .on("mouseover", function () {
                magasinD3.onMouseOver(travee)

            });
        ;
        return gTravee;
    }

    self.drawTablette = function (tablette, parentG, options) {

        d3.selectAll("#" + tablette.name);


        var gTablette = parentG.append("g").attr("class", "tablette").attr("id", tablette.name).attr("name", tablette.name).attr("longueurM", tablette.longueurM).attr("commentaires", tablette.commentaires);
        var color = magasinD3.colors["tablette"];
        if (tablette.indisponible)
            color = magasinD3.colors["tabletteIndisponible"];
        if (tablette.avecVersementSanscotes)
            color = magasinD3.colors["tabletteavecVersementSanscotes"];
        if (tablette.avecCotesSansVersement)
            color = magasinD3.colors["tabletteavecCotesSansVersement"];
        if (drawTabletteNumber) {
            gTablette.append("text")
                .attr("x", tablette.x - 1)
                .attr("y", tablette.y + (tablette.h / 2))
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .style("font-size", "8px")
                .text(function (d) {
                    return tablette.index + 1;
                })
        }


        gTablette.append('rect')
            .attrs({
                x: tablette.x,
                y: tablette.y,
                width: tablette.w - tabletteTextSpacing,
                height: tablette.h,
                name: tablette.name,
                isEmpty: tablette.isEmpty,
                avecVersementSanscotes: tablette.avecVersementSanscotes,
                indisponible: tablette.indisponible,

                class: "tablette",
                fill: color,
                stroke: "blue",
                "stroke-width": "1"
            });
        gTablette.on("click", function (e) {
            d3.event.stopPropagation();
            var coords = d3.event;
            self.currentTablette = tablette;
            self.currentTablette.d3Id = $(this).attr("id");
            var xxx = this;
            onTabletteClick(tablette, coords.x, coords.y);
            return false;


        }).on("mouseover", function () {
            magasinD3.onMouseOver(tablette)

        })


        function onTabletteClick(obj, x, y) {
            self.currentTablette = obj;
            self.currentVersement = null;
            self.currentBoite = null;

            var html = "";

            if (obj.avecVersementSanscotes) {
                self.currentVersementSansBoites = obj.versements[0];
                html = "tablette " + obj.name + "<br>avec versement sans boites cotées : " + obj.avecVersementSanscotes;
                html += "<br>operations tablette :<select onchange='Tablette.onTabletteOperationSelect(this)'>" +
                    Tablette.getOperationSelectOptions(obj) +

                    /*     " <option></option>" +
                         "<option value='releaseTablette'> liberer tablette</option>" +
                         "<option value='commentaire'> commentaire...</option>" +
                         "<option value='voirVersement'> voir versement</option>" +*/
                    "</select>";

            }
            else if (tablette.avecCotesSansVersement) {

                html = "tablette " + obj.name + "<br> sans versement mais avec des boites cotées : ";
                html += "<br>operations tablette :<select onchange='Tablette.onTabletteOperationSelect(this)'>" +
                    Tablette.getOperationSelectOptions(obj) +
                    /*  " <option></option>" +
                      "<option value='releaseTablette'> liberer tablette</option>" +
                      "<option value='voirTablette'> voir tablette...</option>" +
                      "<option value='commentaire'> commentaire...</option>" +
                      //   "<option value='entrerVersementExistant'> entrer versement existant</option>" +*/
                    "</select>";


            } else if (obj.indisponible) {
                html = "tablette  " + obj.name + "indisponible : ";
                html += "<br>commentaires : " + obj.commentaires;
                html += "<br>operations tablette :<select onchange='Tablette.onTabletteOperationSelect(this)'>" +
                    Tablette.getOperationSelectOptions(obj) +
                    /*  " <option></option>" +
                      "<option value='voirTablette'> voir tablette...</option>" +
                      "<option value='releaseTablette'> liberer tablette</option>" +
                      "<option value='commentaire'> commentaire...</option>" +*/
                    "</select>";
            }
            else {
                html += "tablette " + tablette.name + "<br>"
                html += "<br>operations tablette :<select onchange='Tablette.onTabletteOperationSelect(this)'>" +

                    Tablette.getOperationSelectOptions({})
                /*  " <option></option>" +
                  //   "<option value='entrerNouveauVersement'> entrer nouveau versement</option>" +
                  "<option value='entrerVersementExistant'> entrer versement existant</option>" +
                  "<option value='voirTablette'> voir tablette...</option>" +
                  "<option value='setUnavailable'> rendre indisponible</option>" +
                  "<option value='createUnder'> creer nouvelle</option>" +
                  "<option value='split'> diviser </option>" +
                  "<option value='delete'> supprimer </option>"+
              "<option value='commentaire'> commentaire...</option>"*/


                html += "</select>";
                html += "<div id='popupD3DivOperationDiv'></div>"

            }


            $("#popupD3Div").html(html);
            $("#popupD3Div").css("top", y - 20);
            $("#popupD3Div").css("left", x + 20)
            $("#popupD3Div").css("visibility", "visible")

        }

        return gTablette;
    }

    self.drawBoite = function (boite, parentG) {
        var gBoite = parentG.append("g").attr("class", "boite").attr("id", boite.name);
        gBoite.append('rect')
            .attrs({
                x: boite.x,
                y: boite.y,
                width: boite.w,
                height: boite.h,

                fill: function (d) {
                    return boite.color
                },
                numVersement: boite.numVersement,
                id_versement: boite.id_versement,
                name: boite.name,
                coordonnees: boite.tablette.coordonnees,
                nBoites: boite.tablette.nBoites,
                class: "boite",
                stroke: "black",
                "stroke-width": 0.5
            })
            .on("click", function () {
                d3.event.stopPropagation();
                var coords = d3.event;
                self.currentBoite = boite;
                onBoiteClick(boite, coords.x, coords.y);
                return false;


            });

        onBoiteClick = function (boite, x, y) {
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

        return gBoite;
    }


    self.centerOnElt = function (elt, zoomLevel) {
        if (!zoomLevel)
            var zoomLevel = d3.zoomTransform(elt).k;
        /*  var w = $(window).width() / 2;
          var h = $(window).height() / 2;
          var xx = w - d3.select(elt).attr("x") * zoomLevel


          var yy = h - d3.select(elt).attr("y") * zoomLevel*/


        zoom.scaleTo(svg, zoomLevel);
        var x = d3.select(elt).attr("x");
        var y = d3.select(elt).attr("y");
        zoom.translateTo(svg, x, y)


        //   d3.select(".viewport").attr("transform", "translate(" + (xx) + "," + (yy) + ") scale(" + zoomLevel + ")")


        /*    d3.select(".viewport").transition()
                .duration(10)

                .attr("transform", "translate(" + (xx) + "," + ( yy) + ")")//scale(" + 1 + ")")*/
        // .on("end", function(){ svg.call(zoom.transform, d3.zoomIdentity.translate((totalWidth/2 - xx),(totalHeight/2 - yy)).scale(1))});
    }

    self.locate = function (classe, property, array, zoomLevel) {

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
        magasinData.children.forEach(function (mag, indexMag) {
            if (coordonneesArray[0] == mag.name) {
                indexArray.push(indexMag);
                if (!obj && coordonneesArray.length == 1)
                    obj = magasinData.children[indexMag];


                mag.children.forEach(function (epi, indexEpi) {
                    if (coordonneesArray[0] + "-" + coordonneesArray[1] == epi.name) {
                        indexArray.push(indexEpi);
                        if (!obj && coordonneesArray.length == 2)
                            obj = magasinData.children[indexMag].children[indexEpi];

                        epi.children.forEach(function (travee, indexTravee) {
                            if (coordonneesArray[0] + "-" + coordonneesArray[1] + "-" + coordonneesArray[2] == travee.name) {
                                indexArray.push(indexTravee);
                                if (!obj && coordonneesArray.length == 3)
                                    obj = magasinData.children[indexMag].children[indexEpi].children[indexTravee];

                                travee.children.forEach(function (tablette, indexTablette) {
                                    if (!obj && coordonnees == tablette.name) {
                                        indexArray.push(indexEpi);
                                        obj = magasinData.children[indexMag].children[indexEpi].children[indexTravee].children[indexTablette];
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

    self.onMouseOver = function (obj) {
        var array = obj.name.split("-");
        var str = ""
        array.forEach(function (elt, index) {
            if (index == 0)
                str += " magasin : " + elt;
            if (index == 1)
                str += " epi : " + elt;
            if (index == 2)
                str += " travee : " + elt;
            if (index == 3)
                str += " tablette : " + elt;

        })

        $("#magasind3MouseInfo").html(str)
    }


    self.getTablettesContigues = function (tabletteDepart, metrage, tailleMoyBoite, callback) {
        var tablettesContigues = [];


        if (tabletteDepart.longueurM < metrage) {

            var sumLength = 0;
            var started = false;
            var stop = false;
            d3.selectAll("g .tablette").each(function (d, i) {
                if (stop == false) {
                    var name = d3.select(this).attr("name");
                    var longueurM = parseInt(d3.select(this).attr("longueurM"));
                    longueurM = longueurM - (config.coefRemplissageTablette * tailleMoyBoite)
                    if (name == tabletteDepart.name) {
                        started = true;
                        sumLength += longueurM;
                        tablettesContigues.push(name)

                    }
                    else if (started && longueurM && sumLength < metrage) {
                        var isEmpty = d3.select(this).attr("isEmpty");
                        if (isEmpty == false) {
                            stop = true;
                            return alert("la tablette n'est pas vide");

                        }
                        sumLength += longueurM;
                        tablettesContigues.push(name)
                    }
                }

            })
        } else
            tablettesContigues.push(tabletteDepart.name);

        if (stop)
            return callback("pas de tablettes contigues  vides a partir de la tablette " + tabletteDepart.name + " et la longueur " + metrage);
        return callback(null, tablettesContigues);

        return
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
                                        }
                                        else {
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
    self.zoomOnMagasin = function (magasin) {
        if (!magasin)
            var magasin = prompt("magasin");
        if (magasin && self.magasinsToDraw.indexOf(magasin.toUpperCase()) > -1) {
            magasin = magasin.toUpperCase();

            var magasinD3 = d3.select("#" + magasin);

            d3.selectAll(".magasin").each(function (d, i) {
                if (d3.select(this).attr("id") == magasin) {
                    var xx = parseInt(d3.select(this).select("rect").attr("x"));
                    var yy = parseInt(d3.select(this).select("rect").attr("y"));

                    zoom.translateTo(svg, xx + 300, 400)
                    zoom.scaleTo(svg, self.avgZoom);
                }
            })


        } else {
            alert("le magasin n'existe pas")
        }


    }

    self.isTabletteLastInTravee = function (tablette) {
        var ok = false;
        var tabletteElts = Tablette.getCoordonneesElements(tablette.name)
        magasinData.children.forEach(function (magasin) {
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


// var blob = new Blob([html], {type: "image/svg+xml"});


    return self;
})
()



