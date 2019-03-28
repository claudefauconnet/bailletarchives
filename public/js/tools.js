var tools = (function () {
    var self = {}


    self.init = function () {
        var toolnames = Object.keys(config.tools);
        mainController.fillSelectOptions("toolsSelect", toolnames, true);
    }


    self.execTool = function (toolName) {
        var tool = config.tools[toolName];

        if (tool && tool.htmlPage) {
            dialog3.dialog("open");
            $("#dialog3Div").attr("title", toolName);
            $("#dialog3Div").load("./htmlSnippets/" + tool.htmlPage), function () {

            }


        }
        else if (tool && tool.loadMagasinD3) {
            dialogCarte.dialog("open")
            $("#dialogCarte").load("magasinD3.html"), function () {

            }

        }
    }

    self.findTablettes = function (magasin, searchLimit, metrage, callback) {
        var sql = "SELECT coordonnees,DimTabletteMLineaire from magasin where cotesParTablette =\"\" and numVersement =\"\" and magasin=\"" + magasin + "\"  order by tablette, travee, epi limit " + searchLimit;
        mainController.execSql(sql, function (err, json) {
            if (err)
                return callback(err);
            var sum = 0;
            var tablettes = [];
            var stop = false;
            json.forEach(function (tablette, indice) {
                if (stop)
                    return;
                tablettes.push(tablette);
                sum += tablette.DimTabletteMLineaire;
                if (sum > metrage) {

                    stop = true;
                }
            })
            return callback(null, tablettes);
        })
    }


    self.deplacerBoites = function (numVersement, targetMagasin, callback) {
    }




    self.getTablettesVidesContigues = function (tablettes, nombre) {
        tablettesContigues = [];
        var done = false;
        tablettes.forEach(function (tablettes, index) {
            if (tablettesContigues.length >= nombre)
                return;

            var tabletteArray = tablette.coordonnees.split("-");


        })


    }




    return self;
})()