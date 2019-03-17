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