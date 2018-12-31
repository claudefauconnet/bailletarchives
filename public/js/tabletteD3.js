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


    return self;
})()