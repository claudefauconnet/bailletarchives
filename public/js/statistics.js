var statistics = (function () {
    var self = {};









    self.stats = {

        "prochain numero de versement": {
            sql: "select MAX( numVersement+1) as prochainNumeroVersement from versement where numVersement<>9999" // 9999 es tun versement fictif utilisé pour des sorties de boites ans versement
        //   sql: "select concat('0',MAX( CONVERT(numVersement, SIGNED INTEGER)+1)) as prochainNumeroVersement from versement"
          //  sql: "select concat('',MAX( CONVERT(numVersement, SIGNED INTEGER)+1)) as prochainNumeroVersement from versement"
        },
        "versements par année et etatTraitement": {
            //    sql:"select YEAR(vh.etatDate) as annee, count(*) as  nombre,vh.etat,sum(v.nbBoites) as nbreBoites,sum(v.metrage) as totalMetrage, sum(v.volumeGO) as volumeTotalGO,sum(v.nbreElements) as nbreTotalElements from versement as v,versement_historique as vh where v.id=vh.id  group by annee,etat",
          sql: "select YEAR(dateVersement) as annee,etatTraitement,sum(nbBoites) nbreBoites,sum(metrage)totalMetrage, count(*) as nbreVersements, sum(volumeGO) as volumeTotalGO,sum(nbreElements) nbreTotalElements from versement group by annee,etatTraitement"
        },
        "versements par année": {
            //    sql:"select YEAR(vh.etatDate) as annee, count(*) as  nombre,vh.etat,sum(v.nbBoites) as nbreBoites,sum(v.metrage) as totalMetrage, sum(v.volumeGO) as volumeTotalGO,sum(v.nbreElements) as nbreTotalElements from versement as v,versement_historique as vh where v.id=vh.id and vh.etat='décrit' group by annee",
           sql: "select YEAR(dateVersement) as annee,sum(nbBoites) nbreBoites,sum(metrage)totalMetrage, count(*) as nbreVersements, sum(volumeGO) as volumeTotalGO,sum(nbreElements) nbreTotalElements from versement group by annee"

        },
        "versements par etatTraitement": {
            //  sql:"select YEAR(vh.etatDate) as annee,count(*) as  nombre,vh.etat,sum(v.nbBoites) as nbreBoites,sum(v.metrage) as totalMetrage,  sum(v.volumeGO) as volumeTotalGO,sum(v.nbreElements) as nbreTotalElements from versement as v,versement_historique as vh where v.id=vh.id  group by etat",
           sql: "select etatTraitement,sum(nbBoites) nbreBoites,sum(metrage)totalMetrage, count(*) as nbreVersements, sum(volumeGO) as volumeTotalGO,sum(nbreElements) nbreTotalElements from versement group by etatTraitement"
        },
        "versements dans plusieurs epi...": {
            sql: " select distinct numVersement from magasin where  numVersement in (select numVersement from magasin group by numVersement having count(distinct magasin) >1)"
        },
        "metrage total materiel": {
            sql: " select sum( magasin.DimTabletteMLineaire) as espaceOccupeMateriel from magasin,espace_occupe where magasin.id_espace_occupe=espace_occupe.id and espace_occupe.nature=\"matériel\""
        },  "metrage espace occupé par nature": {
            sql: " select  nature,sum( magasin.DimTabletteMLineaire) as espaceOccupeMateriel from magasin,espace_occupe where magasin.id_espace_occupe=espace_occupe.id group by nature"
        },
        "metrage materiel par magasin": {
            sql: " select magasin,sum( magasin.DimTabletteMLineaire) as espaceOccupeMateriel from magasin,espace_occupe where magasin.id_espace_occupe=espace_occupe.id and espace_occupe.nature=\"matériel\" group by magasin"
        },  "metrage espace occupé par nature et magasin": {
            sql: " select  magasin,nature,sum( magasin.DimTabletteMLineaire) as espaceOccupeMateriel from magasin,espace_occupe where magasin.id_espace_occupe=espace_occupe.id group by magasin,nature"
        }
        , "metrage patrimoine total": {
           sql: "select 'non côté' as nature,sum( magasin.DimTabletteMLineaire) as total from magasin,espace_occupe where magasin.id_espace_occupe=espace_occupe.id and espace_occupe.nature<>\"matériel\" UNION select 'versement' as nature, sum( versement.metrage) as total from versement "
        }
    }


    self.displayStat = function (statName) {
        mainController.showInMainDiv("list")
        var stat = self.stats[statName];
        if (!stat)
            return mainController.setErrorMessage(statName + " does not exist")
        console.log(stat.sql);
        mainController.execSql(stat.sql, function (err, json) {
            if (err)
                mainController.setErrorMessage(err)
           if (!context.dataTables["stats"])
                context.dataTables["stats"] = new dataTable();
            context.dataTables["stats"].loadJson(null,"listWrapperDiv", json, {})

           // listController.loadLinkedRecords("stats", "stats", function(){

         //   })



        })
    }


    return self;
})()
