var magasinD3 = (function () {
    var self = {};
    self.currentVersement = {}

    var urlPrefix = "."
    var magasinData;
    var svg;
    var totalWidth;
    var totalHeight;
    var svgWidth;
    var svgHeight;
    var nBoitesTablette = 13;
    var oldNumVersement = "";
    var boiteColor = "";
    var containerDiv = null;
    var zoom;
    var minZoom = .2
    var maxZoom = 2
    var nMagByLine = 3
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
    self.init = function (_containerDiv) {
        containerDiv = _containerDiv;

        var htmlStr = "<table style=' z-index:100 ' id='graphDiv'  class='myDatatable cell-border display nowrap'></table>"

        $("#" + containerDiv).html(htmlStr);
        $('#' + containerDiv).css("font-size", "10px");
        var height = $("#" + containerDiv).height() - 120
        magasinD3.drawMagasins(function () {
            zoom.scaleTo(svg, minZoom);
        })


    }


    self.drawMagasins = function (callback) {
        //d3.json("./js/d3/magasin.json", function (data) {
        d3.select("svg").remove();
        $("#graphDiv").html("");
        d3.json(urlPrefix + "/magasinD3Tree", function (data) {
            var nMag = data.children.length;
            magasinData = data;
            totalWidth = $('#' + containerDiv).width() - 50
            totalHeight = $('#' + containerDiv).height - 50;
            totalHeight = $(window).height() - 150;
            if (!totalHeight)
                totalHeight = 800
            $("#graphDiv").width(totalWidth)
            $("#graphDiv").height(totalHeight)

            svgWidth = totalWidth
            svgHeight = totalHeight
            zoom = d3.zoom().on("zoom", function () {
                svg.attr("transform", d3.event.transform)

            }).scaleExtent([minZoom, maxZoom])

            svg = d3.select('#graphDiv')
                .append('svg')
                .attrs({width: svgWidth, height: svgHeight})
                .call(zoom)
                .append("g").attr("class", "viewport");
            var magW = totalWidth / 2;
            var magH = totalHeight * 2;
            var magX = 50;
            var magY = 50;


            data.children.forEach(function (magasin, indexMagasin) {
                //  console.log(magasin.name + "  " + magasin.children.length)
                if (magasin.name == "" || !magasin.name)
                    return;
                d3.select("g").append("text")
                    .attr("x", magX + (magW / 2))
                    .attr("y", magY - 20)
                    .attr("dy", ".35em")
                    .style("font-size", "18px")
                    .style("font-weight", "bold")
                    .text(function (d) {
                        return magasin.name
                    });
                d3.select("g").append('rect')
                    .attrs({
                        x: magX,
                        y: magY,
                        width: magW,
                        height: magH,
                        fill: '#ddd',
                        stroke: "black",
                        "stroke-width": "3"
                    }).on("click", function () {
                    $("#popupD3Div").css("visibility", "hidden")
                });
                ;

                var epiYOffset = 10
                var epiW = magW;
                var epiH = (magH) / magasin.children.length;
                epiH = epiH - epiYOffset - 1
                var epiX = magX;
                var epiY = magY;

                magasin.children.forEach(function (epi, indexEpi) {
                    d3.select("g").append("text")
                        .attr("x", epiX - 20)
                        .attr("y", epiY + (epiH / 2))
                        .attr("dy", ".35em")
                        .style("text-anchor", "end")
                        .text(function (d) {
                            return epi.name
                        })

                    d3.select("g").append('rect')
                        .attrs({
                            x: epiX,
                            y: epiY,
                            width: epiW,
                            height: epiH,
                            fill: 'none',
                            stroke: "black",
                            "stroke-width": "3"
                        });
                    var traveeW = epiW / epi.children.length;
                    var traveeH = epiH;
                    var traveeX = epiX;
                    var traveeY = epiY;

                    epi.children.forEach(function (travee, indexTravee) {


                        if (indexEpi == 0) {
                            d3.select("g").append("text")
                                .attr("x", traveeX + (traveeW / 2))
                                .attr("y", traveeY - 10)
                                .attr("dy", ".35em")
                                .style("text-anchor", "end")
                                .text(function (d) {
                                    return indexTravee + 1
                                })
                        }
                        d3.select("g").append('rect')
                            .attrs({
                                x: traveeX,
                                y: traveeY,
                                width: traveeW,
                                height: traveeH,
                                fill: 'none',
                                stroke: "black",
                                "stroke-width": "1"
                            });
                        var tabW = traveeW
                        var tabH = traveeH / travee.children.length;
                        ;
                        var tabX = traveeX;
                        var tabY = traveeY;

                        travee.children.forEach(function (tab, indexTab) {
                            var tabletteCoordonnees = tab.name;
                            var nBoites = tab.children.length;
                            if (indexTravee == 0) {
                                d3.select("g").append("text")
                                    .attr("x", tabX - 5)
                                    .attr("y", tabY + (tabH / 2))
                                    .attr("dy", ".35em")
                                    .style("text-anchor", "end")
                                    .style("font-size", "10px")
                                    .text(function (d) {
                                        return indexTab + 1
                                    })
                            }
                            var tablette = d3.select("g").append('rect')
                                .attrs({
                                    x: tabX,
                                    y: tabY,
                                    width: tabW,
                                    height: tabH,
                                    name: tab.name,
                                    class: "tablette",
                                    fill: 'none',
                                    stroke: "blue",
                                    "stroke-width": "1"
                                });
                            var bteW = tabW / nBoitesTablette
                            var bteH = tabH - 1;
                            var bteX = tabX;
                            var bteY = tabY + 1;


                            function getRandomColor() {
                                var letters = '0123456789ABCDEF';
                                var color = '#';
                                for (var i = 0; i < 6; i++) {
                                    color += letters[Math.floor(Math.random() * 16)];
                                }
                                return color;
                            }


                            tab.children.forEach(function (boite, boiteIndex) {

                                if (oldNumVersement != boite.numVersement) {
                                    oldNumVersement = boite.numVersement
                                    // boiteColor = getRandomColor();
                                    boiteColor = palette[Math.floor(Math.random() * palette.length)]
                                }


                                d3.select("g").append('rect')
                                    .attrs({
                                        x: function (d) {
                                            return bteX
                                        },

                                        y: function (d) {
                                            return bteY
                                        },

                                        width: bteW,
                                        height: bteH,

                                        fill: function (d) {
                                            return boiteColor
                                        },
                                        numVersement: boite.numVersement,
                                        name: boite.name,
                                        coordonnees: tabletteCoordonnees,
                                        nBoites: nBoites,
                                        class: "boite",
                                        stroke: "#ddd",
                                        "stroke-width": 0.5
                                    })
                                    .on("click", function () {
                                        var position = d3.mouse(this);
                                        onBoiteClick(boite, position[0], position[1]);
                                        return false;


                                    });
                                bteX += bteW

                            })
                            tabY += tabH

                        })
                        traveeX += traveeW


                    })
                    epiY += epiH + epiYOffset


                })

                //  magY += magH + 20;
                if (indexMagasin > 0 && indexMagasin % nMagByLine == 0) {
                    magX = 50;
                    magY += magH + 50;

                }
                else {
                    magX += magW + 50;
                }


            })
            callback();

            function onBoiteClick(boite, x, y) {

                var urlPrefix = "."
                var sql = "select * from versement where numVersement='" + boite.numVersement + "'"
                var payload = {
                    exec: 1,
                    sql: sql
                }

                $.ajax({
                    type: "POST",
                    url: urlPrefix + "/mysql",
                    data: payload,
                    dataType: "json",
                    success: function (data) {
                        var obj = data[0];
                        var html = "<table>"
                        var keys = ["numVersement", "cotesExtremeBoites", "nbBoites", "metrage", "theme"];
                        for (var key in obj) {
                            if (keys.indexOf(key) > -1)
                                html += "<tr><td>" + key + "</td><td>" + obj[key] + "</td>"
                        }
                        html += "</table>"
                        $("#popupD3Div").html(html);
                        $("#popupD3Div").css("top", y - 20);
                        $("#popupD3Div").css("left", x + 20)
                        $("#popupD3Div").css("visibility", "visible")
                        /*  $("#popupD3Div").dialog("open");
                      $("#dialogContentDiv").html(html);*/
                    },
                    error: function (err) {
                        console.log(err.responseText)

                    }
                })

            }


        })
    }

    self.centerOnElt = function (elt) {
        var currentZoom = d3.zoomTransform(elt).k;
        var w = $(window).width() / 2;
        var h = $(window).height() / 2;
        var xx = w - d3.select(elt).attr("x") * currentZoom

        var yy = h - d3.select(elt).attr("y") * currentZoom
        d3.select(".viewport").attr("transform", "translate(" + (xx) + "," + (yy) + ") scale(" + 1 + ")")
        /*    d3.select(".viewport").transition()
                .duration(10)

                .attr("transform", "translate(" + (xx) + "," + ( yy) + ")")//scale(" + 1 + ")")*/
        // .on("end", function(){ svg.call(zoom.transform, d3.zoomIdentity.translate((totalWidth/2 - xx),(totalHeight/2 - yy)).scale(1))});
    }

    self.searchVersement = function (versement) {
        versement = prompt("numero de versement")
        var found = 0;
        var firstBoiteName = ""
        var coordonnees = "";
        if (versement && versement != "") {
            $("#popupD3Div").css("visibility", "hidden")
            d3.selectAll(".boite").each(function (d, i) {
                d3.select(this).style("opacity", 0.1)
                var x = d;
                var numVersement = d3.select(this).attr("numVersement");

                var firstbox = true;
                if (versement == numVersement) {
                    found += 1
                    if (firstbox) {
                        firstBoiteName = d3.select(this).attr("name");
                        coordonnees = d3.select(this).attr("coordonnees");


                        $("#messageSpan").html(message)
                        firstbox = false
                        self.centerOnElt(this)

                    }
                    d3.select(this).style("opacity", 1)
                    d3.select(this).style("stroke", "red")


                }

            })
            if (found > 0) {
                var message = "versement " + versement + " , localisation : " + coordonnees + " nombre de boites +" + found + "+ première boite " + firstBoiteName;
                $("#messageSpan").html(message);
                zoom.scaleTo(svg, minZoom);
            }
            else
                $("#messageSpan").html("aucune boite correspond au versement " + versement)
        }
    }

    self.clearHighlights = function () {
        $("#popupD3Div").css("visibility", "hidden")
        d3.selectAll(".boite").style("opacity", 1)
        d3.selectAll(".tablette").style("fill", "none").style(" stroke", "blue");
    }

    self.showDialogChercherTablettesPourVersement = function () {

        $("#dialogD3").attr("title", "chercher des tablettes");
        dialogD3.dialog("open")
        $("#dialogD3").load("./htmlSnippets/" + "findTablettesDialogD3.html"), function () {

        }
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
                    self.centerOnElt(this)
                    first = false;
                }


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

    return self;
})()
