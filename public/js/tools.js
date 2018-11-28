var tools = (function () {
    var self = {}


    self.init = function () {
        var toolnames = Object.keys(config.tools);
        mainController.fillSelectOptions("toolsSelect", toolnames, true);
    }


    self.execTool = function (toolName) {
        var tool = config.tools[toolName];

        if (tool && tool.htmlPage) {
            $("#dialog3Div").dialog("open");
            $("#dialog3Div").attr("title", toolName);
            $("#dialog3Div").load("./htmlSnippets/" + tool.htmlPage), function () {

            }


        }


    }

    self.findTablettes = function (magasin, searchLimit, metrage, callback) {
        var sql = "SELECT coordonnees,DimTabletteMLineaire from magasin where cotesParTablette =\"\" and magasin=\"" + magasin + "\"  order by coordonnees limit " + searchLimit;
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


    self.getVersementMagasinInfos = function (obj, callback) {

        var infos = {
            versement: {
                numVersement: null,
                id: null,
                metrage: 0,
                nbreBoites: 0
            },
            tablettes: {
                metrage: 0,
                coteBoites: [],
                tailleTotaleTablettes: 0

            }
        }

        // infos sur le versement
        var key = Object.keys(obj)[0];
        var sql = "select * from versement where " + key + "=" + obj[key];
        mainController.execSql(sql, function (err, json) {
            var numVersement = json[0].numVersement;
            var idVersement = json[0].id;
            if (err)
                return callback(err);
            if (json.length == 0)
                return callback({message: "ce versement n'existe pas"})
            if (json.length > 1)
                return callback({message: "ce numero de versement a plusieurs entrées , operation impossible "})
            infos.versement.metrage = json[0].metrage;
            infos.versement.nbreBoites = json[0].nbBoites;
            infos.versement.numVersement = numVersement;
            infos.versement.id = json[0].id;


// cherche les tablettes   actuelles du versement
            var sql = "select magasin.* from  versement,magasin,r_versement_magasin where  magasin.id=r_versement_magasin.id_magasin and r_versement_magasin.id_versement=versement.id  and versement.id=" + idVersement;
            mainController.execSql(sql, function (err, json) {
                if (err)
                    return callback(err);

                json.forEach(function (tablette) {
                    infos.tablettes.metrage += tablette.metrage;
                    infos.tablettes.tailleTotaleTablettes += tablette.DimTabletteMLineaire
                    var tabletteBoites = [];
                    if (tablette.cotesParTablette)
                        tabletteBoites = tablette.cotesParTablette.split(" ");
                    infos.tablettes.coteBoites.push.apply(infos.tablettes.coteBoites, tabletteBoites);

                })
                infos.tablettes.tailleTotaleTablettes = (Math.round(infos.tablettes.tailleTotaleTablettes * 100)) / 100
                return callback(null, infos);


            })
        })

    }
    self.SetVersementCotesExtremesFromMagasin = function (versementId) {
        tools.getVersementMagasinInfos({id: versementId}, function (err, infos) {
            var input = $("#attr_cotesExtremesBoites");
            var tablettesExtremes = "pas de cotes dans magasin";
            if (infos.tablettes.coteBoites.length > 0)
                tablettesExtremes = infos.tablettes.coteBoites[0] + " - " + infos.tablettes.coteBoites[infos.tablettes.coteBoites.length - 1]
            $(input).val(tablettesExtremes)
            recordController.incrementChanges(input, 'table');
        })
    }

    self.SetVersementnbBoitesFromMagasin = function (versementId) {
        tools.getVersementMagasinInfos({id: versementId}, function (err, infos) {
            var input = $("#attr_nbBoites");
            $(input).val(infos.tablettes.coteBoites.length);
            recordController.incrementChanges(input, 'table');
        })
    }

    self.getTablettesVidesContigues=function(){


    }


    return self;
})()