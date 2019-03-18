var magasinD3 = (function () {
    var self = {};
    self.currentVersement = {}
    self.currentTablette = {}
    self.currentBoite = {}
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
    self.minZoom = .2
    self.maxZoom = 3
    self.avgZoom = 0.3
    var nMagByLine = 10;
    var drawEpis = true;
    var drawTravees = true;
    var drawTablettes = true;
    var drawBoites = true;
    var drawTraveeNumber = true;
    var drawTabletteNumber = true;


    self.colors = {
        "magasin": "#e8c8b3",
        "epi": "#e0d5ff",
        "travee": "#e8e6e8",
        "tablette": "#fff0f0",
        //  "tablette": "#e8c8b3",

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


    self.init = function (_containerDiv) {
        containerDiv = _containerDiv;

        var height = $("#" + containerDiv).height() - 120

        var startTime = new Date();
        var endTime = new Date();
        console.log("duration " + Math.floor((endTime - startTime) / 1000));
        // magasinD3.drawBoites(["A"], function () {
        // magasinD3.drawBoites(null, function () {
        $("#magasinD3MessageDiv").html("Chargement du graphe en cours...")
        magasinD3.drawMagasins(null, function () {
            $("#magasinD3MessageDiv").html("")
            cachedHtml = $("#graphDiv").html();

            var zzz = d3.select("svg")

            self.initialZoom()


        })


    }
    self.initialZoom = function () {
        //  zoom.translateBy(svg, -1300, -600)
        //  self.avgZoom=1

        //  zoom.translateTo(svg,(svgWidth/2)*1, -(svgHeight/2)*1)

        //  zoom.scaleTo(svg, self.avgZoom);
        //  zoom.translateTo(d3.select(".viewport"),0, 0);
        zoom.scaleTo(svg, 1);
        zoom.translateTo(svg, svgWidth, svgHeight)
        zoom.scaleTo(svg, self.minZoom);

        //  zoom.translateTo(svg,-(svgWidth/2)/self.avgZoom, -(svgHeight/2)/self.avgZoom)
    }


    self.drawMagasins = function (magasinsToDraw, callback) {


        var htmlStr = "<div><button onclick='magasinD3.clearHighlights()'>retour</button> " +
            "<button onclick='magasinD3.initialZoom()'>zoom out</button><span id='magasind3MouseInfo'></span></div> " +
            "<div style=' z-index:100 ' id='graphDiv'  class='myDatatable cell-border display nowrap'></div>"


        $("#" + containerDiv).html(htmlStr);
        $('#' + containerDiv).css("font-size", "10px");

        d3.select("svg").remove();
        $("#graphDiv").html("");


        d3.json(mainController.urlPrefix + "/magasinD3Tree", function (data) {
            var nMag = data.children.length;
            magasinData = data;

            totalWidth = $("#mainDiv").width() - 50;
            totalHeight = $("#mainDiv").height() - 50;
            svgWidth = totalWidth
            svgHeight = totalHeight * .8
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
            var magW = totalWidth / 2;
            var magH = totalHeight * 2;

            var magX = 50;
            var magY = 50;


            data.children.forEach(function (magasin, indexMagasin) {
                    if (magasinsToDraw != null && magasinsToDraw.indexOf(magasin.name) < 0)
                        return;

                    if (magasin.name == "" || !magasin.name)
                        return;
                    magasin.x = magX;
                    magasin.y = magY;
                    magasin.h = magH;
                    magasin.w = magW;
                    var gMag = self.drawMagasin(magasin, svg);


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
                                var gEpi = self.drawEpi(epi, gMag);


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

                                        var gTravee = self.drawTravee(travee, gEpi);


                                        // draw tablettes
                                        var tabW = traveeW
                                        var tabH = traveeH / travee.children.length;
                                        var tabX = traveeX;
                                        var tabY = traveeY;
                                        if (drawTablettes) {
                                            travee.children.forEach(function (tab, indexTab) {
                                                tab.x = tabX;
                                                tab.y = tabY;
                                                tab.h = tabH;
                                                tab.w = tabW;
                                                tab.index = indexTab
                                                var gTablette = self.drawTablette(tab, gTravee)

                                                // draw boites
                                                var bteW = (tabW - tabletteTextSpacing) / nBoitesTablette
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


            if (callback)
                callback();


        })
    }


    self.drawMagasin = function (magasin, parentG) {
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


    self.drawEpi = function (epi, parentG) {
        var gEpi = parentG.append("g").attr("class", "epi");

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

    self.drawTravee = function (travee, parentG) {
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

    self.drawTablette = function (tablette, parentG) {
        var gTablette = parentG.append("g").attr("class", "tablette").attr("id", tablette.name).attr("longueurM", tablette.longueurM);

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
                isEmpty:tablette.isEmpty,
                class: "tablette",
                fill: magasinD3.colors["tablette"],
                stroke: "blue",
                "stroke-width": "1"
            }).on("click", function (e) {
            d3.event.stopPropagation();
            var coords = d3.event;
            self.currentTablette = tablette;
            onTabletteClick(tablette, coords.x, coords.y);
            return false;


        }).on("mouseover", function () {
            magasinD3.onMouseOver(tablette)

        })


        function onTabletteClick(obj, x, y) {
            self.currentTablette = obj;

            var html = "tablette " + tablette.name + "<br>"
            html += "operations tablette :<select onchange='Tablette.onTabletteOperationSelect(this)'>" +
                " <option></option>" +
                "<option value='entrerNouveauVersement'> entrer nouveau versement</option>" +
                "<option value='entrerVersementExistant'> entrer versement existant</option>" +
                "<option value='createUnder'> creer nouvelle</option>" +
                "<option value='split'> diviser </option>" +
                "<option value='delete'> supprimer </option>"


            html += "</select>";
            html += "<div id='popupD3DivOperationDiv'></div>"


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

            versement.getBoiteVersement(boite, function (err, obj) {
                if (err)
                    return console.log(err)

                var html = "boite " + boite.name + "<br>"
                html += "<table>"
                var keys = ["numVersement", "cotesExtremeBoites", "nbBoites", "metrage", "theme"];
                for (var key in obj) {
                    if (keys.indexOf(key) > -1)
                        html += "<tr><td>" + key + "</td><td>" + obj[key] + "</td>"
                }
                html += "operations boite:<select onchange='boite.onBoiteOperationSelect(this)'>"
                    + " <option></option>" +

                    "<option value='voirVersement'> voir versement</option>" +
                    "<option value='decalerBoite'> décaler</option>" +
                    "<option value='supprimerBoite'> supprimer  </option>" +
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

        $("#popupD3Div").css("visibility", "hidden")
        d3.selectAll("." + classe + " rect").classed("unselected", true).each(function (d, i) {
            var ok = false;
            var firstbox = true;
            var d3Prop = d3.select(this.parentNode).attr(property);

            if (d3Prop != null && d3Prop != "") {

                if (array.indexOf(d3Prop) > -1) {
                    d3.select(this).classed("unselected", false);


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


        var xxx = d3.selectAll(".unselected");
        d3.selectAll(".unselected").style("opacity", 0.1)
        return;


    }


    self.clearHighlights = function () {
        $("#popupD3Div").css("visibility", "hidden")

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

    self.modifyDrawing = function (operation, coordonnees, newObj) {

        var d3Obj = svg.select("#" + coordonnees);
        var parentCoords = coordonnees.substring(0, coordonnees.lastIndexOf("-"));
        var parentObj = svg.select("#" + parentCoords);
        var siblings = parentObj.select(function () {
            return this.childNodes;
        })
        if (operation == "delete") {

            siblings.each(function (sibling) {
                var xx = d3.select(this);
            })
            svg.select("#" + coordonnees).remove();
        }


        var d3Obj = svg.select("#" + coordonnees)
        var xxx = d3Obj.attr('class');
        if (d3Obj.length > 0) {
            d3Obj = d3Obj[0]

            var type = d3Obj.attr("id")
            var classed = d3Obj.classed()


        }

        //  svg.selectAll("#" + coordonnees).remove()

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

    self.getTablettesContigues=function(tabletteDepart, metrage,tailleMoyBoite,callback){
        var tablettesContigues=[];
        if (tabletteDepart.longueurM < metrage) {

            var sumLength = 0;
            var started = false;
            var stop=false;
            d3.selectAll("g .tablette").each(function (d, i) {
                if(stop==false) {
                    var name = d3.select(this).attr("id");
                    var longueurM = parseInt(d3.select(this).attr("longueurM"));
                    longueurM=longueurM-(config.coefRemplissageTablette*tailleMoyBoite)
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

        if( stop)
            return callback("pas de tablettes contigues  vides a partir de la tablette "+tabletteDepart.name+" et la longueur "+metrage);
        return callback(null,tablettesContigues);

        return
    }


// var blob = new Blob([html], {type: "image/svg+xml"});


    return self;
})
()



