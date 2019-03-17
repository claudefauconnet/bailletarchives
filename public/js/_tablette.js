var tablette = (function () {
    var self = {};
    self.currentTablette = null;


    self.onTabletteOperationSelect = function (select) {
        var operation = $(select).val();

        if (operation == "createUnder") {
            return alert("en construction");
            html = "<button onclick='tablette.create();'>OK</button>";
            $("#popupD3DivOperationDiv").html(html);

        }
        else if (operation == "split") {
            return alert("en construction");
            var html = "<br>Pourcentage restant sur l'ancienne tablette : <input size='3' id=tablette_percentageRemainingOnTopTablette value='50'> %";
            html += "<button onclick='tablette.split();'>OK</button>";
            $("#popupD3DivOperationDiv").html(html);

        }
        else if (operation == "delete") {
            return alert("en construction");
            html = "<button onclick='tablette.delete();'>OK</button>";
            $("#popupD3DivOperationDiv").html(html);

        }
        if (operation == "entrerVersementExistant") {

            var html = "<br>Numero du versement : <input size='3' id=tablette_numeroVersementIntegrer value=''> ";

            html += "<br><button onclick='versement.entrerVersementExistantFromD3Tablette();'>OK</button>";

            $("#popupD3DivOperationDiv").html(html);
            $("#tablette_numeroVersementIntegrer").focus();


        }

        if (operation == "entrerNouveauVersement") {
            var html = "metrage du versement <input id='popupD3DivOperationDiv_metrage'><br>";
            html+= "nombre de boites<input id='popupD3DivOperationDiv_nbBoites'>";
            html += "<br><button onclick='versement.entrerNouveauVersementFromD3Tablette();'>OK</button>";

            $("#popupD3DivOperationDiv").html(html);
            $("#popupD3DivOperationDiv_metrage").focus();

        }


    }


    self.split = function () {
        if (!self.currentTablette)
            return;
       var percentage=parseInt($("#tablette_percentageRemainingOnTopTablette").val())
        var payload={
            operation: "split",
            tablette:JSON.stringify(self.currentTablette),
            options:JSON.stringify({splitPercentage:percentage})

        }
        self.executeOnServer("modifytravee",payload, function(err,result){
            if(err){
                return  mainController.setErrorMessage(err);
            }
            $("#popupD3Div").css("visibility","hidden");
            magasinD3.drawMagasins();
        })

    }
    self.decalerBoites = function () {

    }
    self.delete = function () {
        if (!self.currentTablette)
            return;
        var payload={
            operation: "delete",
            tablette:JSON.stringify(self.currentTablette),
            options:JSON.stringify({})

        }
        self.executeOnServer("modifytravee",payload, function(err,result){
            if(err){
                return  mainController.setErrorMessage(err);
            }
            $("#popupD3Div").css("visibility","hidden");
            magasinD3.drawMagasins()
        })

    }
    self.create = function (callback) {
        if (!self.currentTablette)
            return;
        var payload={
            operation: "create",
            tablette:JSON.stringify(self.currentTablette),
            options:JSON.stringify({})

        }
        self.executeOnServer("modifytravee",payload, function(err,result){
            if(err){
               return  mainController.setErrorMessage(err);
            }
            $("#popupD3Div").css("visibility","hidden");
            magasinD3.drawMagasins()
        })
    }





    self.executeOnServer=function(urlSuffix,payload,callback){
        $.ajax({
            type: "POST",
            url: mainController.urlPrefix+"/"+urlSuffix,
            data: payload,
            dataType: "json",
            success: function (json) {
                return callback(null,json);
            },
            error: function (err) {
                console.log(err.responseText)
                return callback(err.responseText);
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

    self.updateCotesParTablette=function(cotes, idMagasin,callback){
            var sql ="update  magasin set cotesParTablette='"+cotes+"' where id="+idMagasin;
            mainController.execSql(sql,callback);
    }
    self.updateCommentaireParTablette=function(commentaires, idMagasin,callback){
        var sql ="update  magasin set commentaires='"+commentaires+"' where id="+idMagasin;
        mainController.execSql(sql,callback);

    }

    self.locate=function(){

        var coordonnees =prompt("coordonnees :")
        if(coordonnees && coordonnees!=""){
            magasinD3.locate("tablette", "id", [coordonnees], 1);
        }
       // return alert("en construction");
    }


    return self;
})()