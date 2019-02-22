var versement = (function () {

    var self = {};
    self.updateRecordHistory = function (id) {


        var sql = "select * from versement where id=" + id;
        mainController.execSql(sql, function (err, result) {
            if (err)
                return console.log(err);
            var versement = result[0];


              var sql2 = " insert into versement_historique (etat,etatAuteur, etatDate,dateModification,id_versement) values (" +
                  "'" + versement.etatTraitement + "'," +
                  "'" + versement.etatTraitementAuteur + "'," +
                  "'" +   util.longDateStrToShortDateStr(versement.etatTraitementDate) + "'," +
                  "'" + util.dateToMariaDBString (new Date())+ "'," +
                  "" + versement.id + ")"
              mainController.execSql(sql2, function (err, result) {
                  if (err)
                      return console.log(err);
              })


        })
        var xx = id;


    }


    return self;

})()