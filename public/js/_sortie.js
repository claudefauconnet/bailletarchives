var Sortie = (function () {
    var self = {};


    self.onBeforeEditing = function (sortie) {
        if (!sortie.sortieArchiviste) {
            $("#attr_sortieArchiviste").val(authentication.currentUser.nomComplet);
            recordController.incrementChanges(attr_sortieArchiviste);

        }
     //   $("#attr_id_versement").prop('readonly', true);
        $("#recordLinkedDivs").html("");
    }



    self.onBeforeSave=function(options,callback){
        if( !options.currentRecord.id_versement){
            var sql="select id from versement where numVersement='"+options.changes.numVersement+"'";
            mainController.execSql(sql,function(err, result){
                if(err){
                    mainController.setErrorMessage(err)
                   return  callback(err)
                }
               else if(result.length==0){
                    return  callback("Ce versement n'existe pas")
                }
                else{
                    var idVersement=result[0].id;
                    recordController.currentRecordChanges.id_versement=idVersement;
                    context.currentRecord.id_versement=idVersement;
                    $("#attr_id_versement").val(idVersement)
                    return callback(null);
                }

            })
        }else
            callback(null);



    }

    self.locateCurrentSortie = function () {

        var str = $("#attr_cotesBoites").val();
        var boites = str.split(" ");
        if (boites.length > 0) {
            $("#dialogDiv").dialog("close");
            mainController.showInMainDiv("graph")
            magasinD3.initialZoom();
            magasinD3.locate("boite", "id", boites, 1);
        }

    }


    self.highlightSorties = function () {

        mainController.showInMainDiv("graph")
        var sql = "select cotesBoites from sortie_boite where retourDate is null order by sortieDate desc"
        mainController.execSql(sql, function (err, result) {
            if (err)
                return console.log(err);

            var boitesSorties = []
            result.forEach(function (line) {
                if (line && line.cotesBoites != null) {
                    var boites = line.cotesBoites.split(" ");
                    boitesSorties = boitesSorties.concat(boites)
                }
            })
            magasinD3.initialZoom();
            magasinD3.locate("boite", "id", boitesSorties, .3);


        })


    }


    self.create = function () {
        context.currentTable = "sortie_boite";
        mainController.showNewRecordDialog();

    }


    self.listActives = function () {
        context.currentTable = "sortie_boite";
        var sql = "select * from sortie_boite where retourDate is null order by sortieDate desc"
        listController.listRecords(sql)

    }
    self.listHistory = function () {
        context.currentTable = "sortie_boite";
        var sql = "select * from sortie_boite order by sortieDate desc"
        listController.listRecords(sql)


    }

    self.sortiesShowBoitesCbx = function () {
        var numVersement = $("#attr_numVersement").val();
        if (!numVersement || numVersement == "")
            return mainController.setRecordErrorMessage("saisissez un versement")
        var sql = "select * from magasin, versement where versement.id=magasin.id_versement and versement.numVersement=" + numVersement;
        mainController.execSql(sql, function (err, json) {
            if (err)
                return mainController.setRecordErrorMessage(err);
            var html = "";
            if (json.length == 0)
                html = " pas de boites correspondantse";
            else {

             /*   $('#attr_id_versement').val(json[0].id_versement)
                recordController.incrementChanges(document.getElementById("attr_id_versement"));*/
                var allBoites = [];
                json.forEach(function (tablette) {
                    var boitesStr = tablette.cotesParTablette;
                    if (boitesStr != null && boitesStr != "") {
                       var boites = boitesStr.split(" ");
                        allBoites = allBoites.concat(boites)
                    }
                })
                html = "<div style='display:block;width: 250px'><input type='checkbox' onchange=Sortie.onCbxChanged($(this),'all')><B>Toutes les boites</B><br><div>"
                allBoites.sort();
                allBoites.forEach(function (boite) {
                    html += "<input type='checkbox'  id='" + boite + "'class='boite_cbx'>" + boite + "<br>"
                })
                html += "</div></div>"

                html += "<script>$('.boite_cbx').on('click', function(){Sortie.onCbxChanged ($(this))});</script>"


            }

            $("#recordLinkedDivs").css("overflow", "auto")
            $("#recordLinkedDivs").html(html);

        })


    }

    self.onCbxChanged = function (cbxId, mode) {
        if (mode == "all") {
            var checked = $(cbxId).prop("checked");
            var str = "";
            $(".boite_cbx").each(function (index, val) {

                $(this).prop("checked", checked)
                if (checked)
                    str += " " + $(this).attr('id')


            })
            $('#attr_cotesBoites').val(str)


        } else {
            var str = $('#attr_cotesBoites').val();
            str = str.replace(/\s+/g, " ");
            var cote = $(cbxId).attr('id');
            str=str +(" " + cote);
//console.log(str);
            $('#attr_cotesBoites').val(str)


        }

        recordController.currentRecordChanges["cotesBoites"] = $('#attr_cotesBoites').val();
        $("#saveRecordButton").removeAttr("disabled");


    }


    return self;

})()
