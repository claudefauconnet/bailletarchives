var Sortie=(function(){
    var self={};


    self.setNewRecordDefaultValues = function (sortie) {
        if(!sortie.sortieArchiviste) {
            $("#attr_sortieArchiviste").val(authentication.currentUser);
            recordController.incrementChanges(attr_sortieArchiviste);
        }
    }





    self.highlightSorties=function(){

        mainController.showInMainDiv("graph")
        var sql="select cotesBoites from sortie_boite where retourDate is null order by sortieDate desc"
        mainController.execSql(sql, function(err, result){
            if(err)
                return console.log(err);

            var boitesSorties=[]
            result.forEach(function(line){
                if(line && line.cotesBoites!=null) {
                    var boites = line.cotesBoites.split(" ");
                    boitesSorties = boitesSorties.concat(boites)
                }
            })
            magasinD3.initialZoom();
            magasinD3.locate ("boite","id",boitesSorties,.3) ;


        })


    }




    self.create=function(){
        context.currentTable="sortie_boite";
        mainController.showNewRecordDialog();

    }



    self.listActives=function(){
        context.currentTable="sortie_boite";
        var sql="select * from sortie_boite where retourDate is null order by sortieDate desc"
        listController.listRecords(sql)

    }
    self.listHistory=function(){
        context.currentTable="sortie_boite";
        var sql="select * from sortie_boite order by sortieDate desc"
        listController.listRecords(sql)


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
                html="<div style='display:block;width: 250px'><input type='checkbox' onchange=util.checkUncheckAllBoxes($(this),'.boite_cbx')><B>Toutes les boites</B><br><div>"
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