var boite=(function(){
    var self={}

    self.onBoiteOperationSelect = function (select) {
        var operation = $(select).val();

        if (operation == "decalerBoite") {
         alert("en construction")

        }
        else if (operation == "supprimerBoite") {
            alert("en construction")

        }




    }

    self.locate=function(){
        return alert("en construction");
    }


    return self;

})()