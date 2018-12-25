var tabletteD3 = (function () {
    var self = {};
    self.currentTablette = null;


    self.ontabletteOperationSelect = function (select) {
        var operation = $(select).val();
        if (operation == "createUnder") {
            html = "<button onclick='tabletteD3.createUnder();'>OK</button>";
            $("#popupD3DivOperationDiv").html(html);

        }
        else if (operation == "split") {
            var html = "<br>Pourcentage restant sur l'ancienne tablette : <input id=tablette_percentageRemainingOnTopTablette value='50'> %";
            html += "<button onclick='tabletteD3.split();'>OK</button>";
            $("#popupD3DivOperationDiv").html(html);

        }
        else if (operation == "delete") {
            html = "<button onclick='tabletteD3.delete();'>OK</button>";
            $("#popupD3DivOperationDiv").html(html);

        }


    }


    self.split = function () {

        var tablette = self.currentTablette;
        magasinD3.modifyDrawing(tablette.name)


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
            $("#popupD3Div").css("visibility", "hidden")
            magasinD3.drawMagasins()

        });


    }
    self.createUnder = function () {
        if (!self.currentTablette)
            return;
        var array= self.currentTablette.name.split("-");
        if(array.length<4)
            return;

        var magasin=array[0];
        var epi=array[0]+"-"+array[1];
        var travee=array[0]+"-"+array[1]+"-"+array[2];
        var coordonnees=array[0]+"-"+array[1]+"-"+array[2]+"-"+(parseInt(array[3])+1);


        var newTablette= {
            "coordonnees":coordonnees,
            "commentaires": null,
            "numVersement":null,
            "cotesParTablette": "",
            "metrage": 0,
            "id_versement": null,
            "pretsSorties": null,
            "DimTabletteCm": self.currentTablette.longueurM*100,
            "DimTabletteMLineaire": self.currentTablette.longueurM,
            "magasin": magasin,
            "epi": epi,
            "travee": travee,
            "tablette": coordonnees
        }

        recordController.execSqlCreateRecord("magasin",newTablette,function(err, result){
            if (err)
                return;
            $("#popupD3Div").css("visibility", "hidden");
            magasinD3.drawMagasins()
        })

    }


    return self;
})()