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
                    tabletteBoites.forEach(function (boite, index) {
                        var p = boite.indexOf("/");
                        if (p > -1)
                            tabletteBoites[index] = parseInt(boite.substring(p + 1))

                    })
                    infos.tablettes.coteBoites.push.apply(infos.tablettes.coteBoites, tabletteBoites);
                    infos.tablettes.coteBoites.sort();


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

    self.getTablettesVidesContigues = function (tablettes, nombre) {
        tablettesContigues = [];
        var done = false;
        tablettes.forEach(function (tablettes, index) {
            if (tablettesContigues.length >= nombre)
                return;

            var tabletteArray = tablette.coordonnees.split("-");


        })


    }

    self.sortiesShowBoitesCbx = function () {
        var numVersement = $("#attr_numVersement").val();
        if (!numVersement || numVersement == "")
            mainController.setRecordErrorMessage("saisissez un versement")
        var sql = "select * from magasin, versement where versement.id=magasin.id_versement and versement.numVersement="+ numVersement;
        mainController.execSql(sql, function (err, json) {
            if (err)
                return mainController.setRecordErrorMessage(err);
            var html = "";
            if (json.length == 0)
                html = " pas de boites correspondantse";
            else {

                $('#attr_id_versement').val(json[0].id_versement)
                recordController.incrementChanges(document.getElementById("attr_id_versement"));
                var allBoites=[];
                json.forEach(function (tablette) {
                    var boitesStr=tablette.cotesParTablette;
                    if(boitesStr!=null && boitesStr!="")
                    boites=boitesStr.split(" ");
                    allBoites=allBoites.concat(boites)
                })
                html="<div style='display:block;width: 250px'><input type='checkbox' onchange=util.checkUncheckAllBoxes($(this),'.boite_cbx')><B>Boites</B><br><div>"
                allBoites.sort();
                allBoites.forEach(function(boite){
                    html+="<input type='checkbox'  id='"+boite+"'class='boite_cbx'>"+boite+"<br>"
                })
                html+="</div></div>"

                html+="<script>$('.boite_cbx').on('click',function(){$('#attr_cotesBoites').append(' '+$(this).attr('id'));  recordController.incrementChanges(document.getElementById(\"attr_cotesBoites\"));})"




            }

            $("#recordLinkedDivs").css("overflow","auto")
            $("#recordLinkedDivs").html(html);

        })


    }


    return self;
})()