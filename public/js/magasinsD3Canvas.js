var magasinsD3Canvas = (function () {

        self.canvasData = null;
        self.magasins = [];

        self.highlighted = null;

        var onclickFn = null;

        var totalWidth;
        var totalHeight;

        var canvas;
        var context;
        var canvasData = [];
        var currentZoomTransform = {x: 0, y: 0, k: 1};
        var zoom = null;


        var drawEpis = true;
        var drawTravees = true;
        var drawTablettes = true;
        var drawBoites = true;
        var drawTraveeNumber = true;
        var drawTabletteNumber = true;
        var tabletteTextSpacing = 8;
        var nBoitesTablette = 13;
        var oldNumVersement = "";
        var nMagByLine = 10;

        var zoomExtent = [0.2, 10]

        self.magasinsToNotDraw = ["E", "F"];
        self.magasinsToDraw = [];
        self.currentMagasin = null;


        var currentBoiteColor = "#d5d7cc";
        self.colors = {
            "magasin": "#e8c8b3",
            "epi": "#e0d5ff",
            "travee": "#e8e6e8",
            "tablette": "#fff0f0",
            "tabletteIndisponible": "#666",
            "tabletteavecVersementSanscotes": "#8EE889",
            "tabletteavecCotesSansVersement": "#E820C9",
            "tabletteIsMateriel":"#333",
        }

        var highlightAttrs = {
            alpha: 0.1,
            strokeColor: "#c00000",
            lineWidth: 2

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





        function onClick(point, obj) {

            if (onclickFn )
                onclickFn(point, obj)
            if (obj.data) {
                $("#graphInfos").html(obj.data.name);
            }
        }

        var zoomed = function (transform) {
            if (!transform)
                transform = d3.event.transform;
            context.save();
            context.clearRect(0, 0, totalWidth, totalWidth);
            context.translate(transform.x, transform.y);
            context.scale(transform.k, transform.k);
            currentZoomTransform = transform
            self.draw();
            context.fill();
            context.restore();
        }

        function clicked() {
            var point = d3.mouse(this);
            var x = d3.event.pageX;
            var y = d3.event.pageY;
            var realPoint = [x, y];
            point[0] = (point[0] - currentZoomTransform.x) / currentZoomTransform.k
            point[1] = (point[1] - currentZoomTransform.y) / currentZoomTransform.k
            var node;
            canvasData.forEach(function (rect) {


                if (rect.x < point[0] && (rect.x + rect.w) > point[0]) {
                    if (rect.y < point[1] && (rect.y + rect.h) > point[1]) {
                        return node = rect;
                    }
                }
            })
            onClick(realPoint, node)
        }

        function moved() {
            //  $("#popupD3Div").css("visibility", "hidden")
        }


        function initCanvas(graphDiv) {
            currentZoomTransform = {x: 0, y: 0, k: 1};
            canvas = d3.select(graphDiv)
                .append('canvas')
                .attr('width', totalWidth)
                .attr('height', totalHeight);
            canvas.on('mousedown', clicked).on('mousemove', moved);
            context = canvas.node().getContext('2d');
            var customBase = document.createElement('custom');
            var custom = d3.select(customBase); // this is our svg replacement
            zoom = d3.zoom().scaleExtent(zoomExtent).on("zoom", zoomed);
            d3.select(context.canvas).call(zoom);

        }


        function clearCanvas() {
            context.clearRect(0, 0, totalWidth, totalHeight);
        }


        self.draw = function (data, options, callback) {
            clearCanvas();
            if (!data)
                data = canvasData;
            if (!options)
                options = {};


            data.forEach(function (d, index) {
                var lineWidth;
                var color;

                context.globalAlpha = 1.0;
                if (self.highlighted) {//opacity
                    if (self.highlighted.indexOf(index) < 0)
                        context.globalAlpha = highlightAttrs.alpha;
                    else {
                        lineWidth = highlightAttrs.lineWidth;
                        color = highlightAttrs.strokeColor
                    }

                }
                if (lineWidth)
                    context.lineWidth = lineWidth;
                else if (d.lineWidth)
                    context.lineWidth = d.lineWidth;

                else
                    context.lineWidth = 0;

                if (d.type == "rect") {
                    if (d.bgColor) {
                        context.fillStyle = d.bgColor
                        context.fillRect(d.x, d.y, d.w, d.h)
                    }
                    if (lineWidth || (d.lineWidth && d.lineWidth != 0)) {
                        if (color)
                            context.strokeStyle = color;
                        else if (d.color)
                            context.strokeStyle = d.color;

                        context.strokeRect(d.x, d.y, d.w, d.h);
                    }
                } else if (d.type = "text") {
                    if (d.color)
                        context.fillStyle = d.color;
                    context.font = d.font;
                    context.textAlign = "center";
                    context.fillText(d.text, d.x, d.y);
                }
            });
            if (callback)
                return callback(null)
        }


        self.setMagasinsButtons = function () {
            var strMagasins = ""
            var magasins = self.magasinsToDraw;
            magasins.splice(0, 0, "tous")
            magasins.forEach(function (magasin) {
                strMagasins += "<span style='font-size: 18px;font-weight: bold;margin: 3px;padding:3px;border-style: solid ; border-width: 1px' onclick=magasinsD3Canvas.zoomOnMagasin('" + magasin + "')>" + magasin + "</span>"

            })
            $("#magasinButtonsDiv").html(strMagasins)
        }


        self.zoomOnMagasin = function (magasin) {
            self.highlighted = null;
            if (magasin == "tous") {
                var transform = d3.zoomIdentity;
                transform.k = 0.3

                return zoomed(transform);
            }
            var selectedRectIndex = null
            canvasData.forEach(function (rect, index) {
                if (rect.nature == "magasin" && rect.data && rect.data.name == magasin)
                    return selectedRectIndex = index;

            })
            self.zoomOnObjectIndex(selectedRectIndex, 0.8, [100, 50])

        }

        self.zoomOnObjectIndex = function (index, zoomlevel, position) {
            var rect = canvasData[index]
            /*   var transform = {
                   x: (selectedRect.x - 100),
                   y: selectedRect.y,

               };*/
            d3.zoomIdentity.k = zoomlevel;

            zoomed(d3.zoomIdentity);
            zoom.translateTo(canvas, rect.x, rect.y, position)
        }


        self.zoomOut = function () {
            var transform = d3.zoomIdentity;
            transform.k = 0.3

            return zoomed(transform);
            //  zoom.translateTo(canvas, 0,0,[100,100] )
            //   zoom.scaleTo(canvas,zoomExtent[0])
        }

        self.drawAll = function (options, callback) {
            if (!options)
                options = {};

            if (options.onclickFn)
                onclickFn = options.onclickFn;
            d3.json("./magasinD3Tree").then(function (data) {

                totalWidth = $(graphDiv).width() - 50;
                totalHeight = $(graphDiv).height() - 50;
                canvasData = self.bindData(data);
                self.highlighted = null;
                self.canvasData = canvasData;
                initCanvas("#graphDiv");


                self.draw(canvasData, null, function (err, result) {
                    if (callback)
                        return callback(err)
                });
                self.setMagasinsButtons()


            })
        }


        /******************************************************************************************************************************/
        /*************************************************Bind data**************************************************************/
        /******************************************************************************************************************************/
        /******************************************************************************************************************************/

        self.bindData = function (data, options, callback) {

            if (!options)
                options = {}
            if (!options.magasinsToDraw)
                options.magasinsToDraw = self.magasinsToDraw;
            options.magasinsToDraw = [];
            data.children.forEach(function (magasin) {
                if (self.magasinsToNotDraw.indexOf(magasin.name) < 0)
                    options.magasinsToDraw.push(magasin.name)
            })
            self.magasinsToDraw = options.magasinsToDraw


            if (!options.filter) {
                ;//  self.initDrawMagasins(options);

            }

            var nMag = data.children.length;
            self.data = data;


            var magW = totalWidth / 2;
            var magH = totalHeight * 2;

            var magX = 50;
            var magY = 50;
            var drawObject = true;
            var canvasData = [];

            data.children.forEach(function (magasin, indexMagasin) {
                    self.magasins.push(magasin.name)
                    if (options.magasinsToDraw != null && options.magasinsToDraw.indexOf(magasin.name) < 0)
                        return;
                    if (magasin.name == "" || !magasin.name)
                        return;


                    var rect = {
                        type: "rect",
                        x: magX,
                        y: magY,
                        h: magH,
                        w: magW,
                        bgColor: "#e4e5e5",
                        lineWidth: 5,
                        color: "#390008",
                        data: magasin,
                        nature: "magasin",
                    }
                    var text = {
                        type: "text",
                        x: rect.x + (rect.w / 2),
                        y: rect.y - 20,
                        font: "32px verdana bold",
                        text: magasin.name,
                        color: "black"
                    }
                    canvasData.push(rect);
                    canvasData.push(text);


                    // draw epi
                    if (drawEpis) {

                        var epiYOffset = 20
                        var epiW = magW;
                        var epiH = (magH) / magasin.children.length;
                        epiH = epiH - epiYOffset - 1
                        var epiX = magX;
                        var epiY = magY;

                        magasin.children.forEach(function (epi, indexEpi) {
                                var rect = {
                                    type: "rect",
                                    x: epiX,
                                    y: epiY,
                                    h: epiH,
                                    w: epiW,
                                    //  bgColor: "#e4e5e5",
                                    color: "brown",
                                    lineWidth: 3,
                                    data: epi,
                                    nature: "epi"
                                }
                                var text = {

                                    type: "text",
                                    x: rect.x - 20,
                                    y: rect.y + (rect.h / 2) + 8,
                                    font: "16px verdana bold",
                                    text: epi.name,
                                    color: "brown"
                                }
                                canvasData.push(rect);
                                canvasData.push(text);


                                if (drawTravees) {
                                    // draw travee
                                    var traveeW = epiW / epi.children.length;
                                    var traveeH = epiH;
                                    var traveeX = epiX;
                                    var traveeY = epiY;
                                    epi.children.forEach(function (travee, indexTravee) {
                                        var rect = {
                                            type: "rect",
                                            x: traveeX,
                                            y: traveeY,
                                            h: traveeH,
                                            w: traveeW,

                                            lineWidth: 2,
                                            //  bgColor: "#e4e5e5",
                                            color: "blue",
                                            data: travee,
                                            nature: "travee",
                                        }

                                        var text = {
                                            type: "text",
                                            x: rect.x + (rect.w / 2),
                                            y: rect.y - 5,
                                            font: "12px verdana",
                                            text: "" + (indexTravee + 1),
                                            color: "blue"
                                        }
                                        canvasData.push(rect);
                                        canvasData.push(text);


                                        // draw tablettes
                                        var tabW = traveeW
                                        var tabH = traveeH / travee.children.length;
                                        var tabX = traveeX;
                                        var tabY = traveeY;
                                        var tabRectOffset = 10;

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

                                            travee.children.forEach(function (tablette, indexTablette) {

                                                var bgColor = self.colors["tablette"];
                                                if (tablette.indisponible)
                                                    bgColor = self.colors["tabletteIndisponible"];
                                                if (tablette.avecVersementSanscotes)
                                                    bgColor = self.colors["tabletteavecVersementSanscotes"];
                                                if (tablette.avecCotesSansVersement)
                                                    bgColor = self.colors["tabletteavecCotesSansVersement"];
                                                if(tablette.isMateriel)
                                                    bgColor = self.colors["tabletteIsMateriel"];

                                                var rect = {
                                                    type: "rect",
                                                    x: tabX + tabRectOffset,
                                                    y: tabY,
                                                    h: tabH,
                                                    w: tabW - tabRectOffset,
                                                    bgColor: bgColor,
                                                    lineWidth: 1,
                                                    color: "green",
                                                    data: tablette,
                                                    nature: "tablette",
                                                }

                                                var text = {
                                                    type: "text",
                                                    x: rect.x - 5,
                                                    y: rect.y + (rect.h / 2) + 4,
                                                    h: 30,
                                                    w: 30,
                                                    font: "8px verdana",
                                                    text: "" + (indexTablette + 1),
                                                    color: "green",
                                                    data: tablette,
                                                    nature: "tablette",
                                                }
                                                canvasData.push(rect);
                                                canvasData.push(text);


                                                // draw boites
                                                var bteW = (tabW - tabRectOffset) / nBoitesTablette // nBoitesTablette calcul de la taille des boites
                                                var bteH = tabH - 1;
                                                var bteX = tabX + tabRectOffset;
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

                                                    var allBoitesMemeVersement = true;
                                                    var boitesTablette = []
                                                    tablette.children.forEach(function (boite, boiteIndex) {
                                                        var rect = {
                                                            type: "rect",
                                                            x: bteX,
                                                            y: bteY,
                                                            h: bteH,
                                                            w: bteW,
                                                            lineWidth: 0.2,
                                                            // bgColor: "#e4e5e5",
                                                            color: "black",
                                                            data: boite,
                                                            nature: "boite",
                                                        }

                                                        if (oldNumVersement != boite.numVersement) {
                                                            if (boiteIndex > 0)
                                                                allBoitesMemeVersement = false;
                                                            oldNumVersement = boite.numVersement
                                                            currentBoiteColor = palette[Math.floor(Math.random() * palette.length)]
                                                        }
                                                        rect.bgColor = currentBoiteColor;
                                                        boitesTablette.push(rect)


                                                        bteX += bteW;
                                                    })
                                                    if (allBoitesMemeVersement) {//on groupe dan sun meme rectangle les boites du meme versement sur la tablettte

                                                        if (boitesTablette.length > 0) {
                                                            var rect = {
                                                                type: "rect",
                                                                x: tabX + tabRectOffset,
                                                                y: bteY,
                                                                h: bteH,
                                                                w: bteW * boitesTablette.length,
                                                                lineWidth: 0.2,
                                                                // bgColor: "#e4e5e5",
                                                                color: "black",
                                                                data: boitesTablette[0].data,
                                                                nature: "boite",
                                                            }
                                                            rect.bgColor = currentBoiteColor;
                                                            canvasData.push(rect);
                                                        }

                                                    } else {
                                                        canvasData = canvasData.concat(boitesTablette);

                                                    }
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

                    } else {
                        magX += magW + 50;
                    }


                }
            )


            return canvasData;


        }

        return self;
    }


)()

