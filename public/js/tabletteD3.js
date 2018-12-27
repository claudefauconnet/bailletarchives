var tabletteD3 = (function () {
    var self = {};
    self.currentTablette = null;


    self.ontabletteOperationSelect = function (select) {
        var operation = $(select).val();

        if (operation == "createUnder") {
            html = "<button onclick='tabletteD3.create();'>OK</button>";
            $("#popupD3DivOperationDiv").html(html);

        }
        else if (operation == "split") {
            var html = "<br>Pourcentage restant sur l'ancienne tablette : <input size='3' id=tablette_percentageRemainingOnTopTablette value='50'> %";
            html += "<button onclick='tabletteD3.split();'>OK</button>";
            $("#popupD3DivOperationDiv").html(html);

        }
        else if (operation == "delete") {
            html = "<button onclick='tabletteD3.delete();'>OK</button>";
            $("#popupD3DivOperationDiv").html(html);

        }


    }


    self.split = function () {

        req.body.operation, req.body.tablette, req.body.options,

        var tablette = self.currentTablette;
        var percentage = parseInt($("#tablette_percentageRemainingOnTopTablette").val());
        self.createUnder(function(err, newTablette){
var xx=newTablette;

        })


    }
    self.decalerBoites = function () {

    }
    self.delete = function () {
        var tablette = self.currentTablette;
        if (!tablette)
            return;
        if (tablette.children.length > 0)
            alert("on ne peut pas supprimer une tablette non vide")

        recordController.execSQLDeleteRecord("magasin", tablette.id, function (err, result) {
            if (err)
                return;
            $("#popupD3Div").css("visibility", "hidden");
            magasinD3.drawMagasins()


            /*    var travee = tablette.name.substring(0, tablette.name.lastIndexOf("-"))
                var subTree = magasinD3.findElementInDataTree(travee);
                var toRemoveIndex = -1;
                subTree.children.forEach(function (tabletteOld, index) {
                    if (tablette.name == tabletteOld.name)
                        toRemoveIndex = index;
                })
                subTree.children.splice(toRemoveIndex, 1);

                magasinD3.drawTravee(subTree, epiG);*/

        });


    }
    self.create = function (callback) {
        if (!self.currentTablette)
            return;
        var array = self.currentTablette.name.split("-");
        if (array.length < 4)
            return;

        var magasin = array[0];
        var epi = array[0] + "-" + array[1];
        var travee = array[0] + "-" + array[1] + "-" + array[2];
        var coordonnees = array[0] + "-" + array[1] + "-" + array[2] + "-" + (parseInt(array[3]) + 1);


        var newTablette = {
            "coordonnees": coordonnees,
            "commentaires": null,
            "numVersement": null,
            "cotesParTablette": "",
            "metrage": 0,
            "id_versement": null,
            "pretsSorties": null,
            "DimTabletteCm": self.currentTablette.longueurM * 100,
            "DimTabletteMLineaire": self.currentTablette.longueurM,
            "magasin": magasin,
            "epi": epi,
            "travee": travee,
            "tablette": coordonnees
        }

        recordController.execSqlCreateRecord("magasin", newTablette, function (err, result) {
            if (err)
                if(callback)
                    return callback(err);
                return;
            $("#popupD3Div").css("visibility", "hidden");
            if(callback)
                return callback(null,newTablette);
            magasinD3.drawMagasins()
        })

    }


    return self;
})()