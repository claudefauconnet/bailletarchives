var statistics = (function () {
    var self = {};

    self.stats = {

        "prochain numero de versement": {
           // sql: "select concat('0',MAX( CONVERT(numVersement, SIGNED INTEGER)+1)) as prochainNumeroVersement from versement"
            sql: "select concat('',MAX( CONVERT(numVersement, SIGNED INTEGER)+1)) as prochainNumeroVersement from versement"
        },
        "versements par année et etatTraitement": {
            sql:"select YEAR(vh.etatDate) as annee, count(*) as  nombre,vh.etat,sum(v.nbBoites) as nbreBoites,sum(v.metrage) as totalMetrage, sum(v.volumeGO) as volumeTotalGO,sum(v.nbreElements) as nbreTotalElements from versement as v,versement_historique as vh where v.id=vh.id  group by annee,etat",
         //   sql: "select YEAR(dateArrivee) as annee,etatTraitement,sum(nbBoites) nbreBoites,sum(metrage)totalMetrage, count(*) as nbreVersements, sum(volumeGO) as volumeTotalGO,sum(nbreElements) nbreTotalElements from versement group by annee,etatTraitement"
        },
        "versements par année": {
            sql:"select YEAR(vh.etatDate) as annee, count(*) as  nombre,vh.etat,sum(v.nbBoites) as nbreBoites,sum(v.metrage) as totalMetrage, sum(v.volumeGO) as volumeTotalGO,sum(v.nbreElements) as nbreTotalElements from versement as v,versement_historique as vh where v.id=vh.id and vh.etat='décrit' group by annee",
         //   sql: "select YEAR(dateArrivee) as annee,sum(nbBoites) nbreBoites,sum(metrage)totalMetrage, count(*) as nbreVersements, sum(volumeGO) as volumeTotalGO,sum(nbreElements) nbreTotalElements from versement group by annee"

        },
        "versements par etatTraitement": {
            sql:"select YEAR(vh.etatDate) as annee,count(*) as  nombre,vh.etat,sum(v.nbBoites) as nbreBoites,sum(v.metrage) as totalMetrage,  sum(v.volumeGO) as volumeTotalGO,sum(v.nbreElements) as nbreTotalElements from versement as v,versement_historique as vh where v.id=vh.id  group by etat",
         //   sql: "select etatTraitement,sum(nbBoites) nbreBoites,sum(metrage)totalMetrage, count(*) as nbreVersements, sum(volumeGO) as volumeTotalGO,sum(nbreElements) nbreTotalElements from versement group by etatTraitement"
        },
        "versements dans plusieurs epi...": {
            sql: " select distinct numVersement from magasin where  numVersement in (select numVersement from magasin group by numVersement having count(distinct magasin) >1)"
        }
    }


    self.displayStat = function (statName) {
        var stat = self.stats[statName];
        if (!stat)
            return mainController.setErrorMessage(statName + " does not exist")
        console.log(stat.sql);
        mainController.execSql(stat.sql, function (err, json) {
            if (err)
                mainController.setErrorMessage(err)
           if (!context.dataTables["stats"])
                context.dataTables["stats"] = new dataTable();
            context.dataTables["stats"].loadJson(null,"listWrapperDiv", json, {dom: "ltiB",noFixedColumns:true,})

           // listController.loadLinkedRecords("stats", "stats", function(){

         //   })



        })
    }


    return self;
})()