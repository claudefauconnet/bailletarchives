var statistics=(function(){
    var self={};

    self.stats= {
        "versements par année et etatTraitement": {
            sql: "select YEAR(dateArrivee) as annee,etatTraitement,sum(nbBoites) nbreBoites,sum(metrage)totalMetrage, count(*) as nbreVersements, sum(volumeGO) as volumeTotalGO,sum(nbreElements) nbreTotalElements from versement group by annee,etatTraitement"
        },
        "versements par année": {
            sql: "select YEAR(dateArrivee) as annee,sum(nbBoites) nbreBoites,sum(metrage)totalMetrage, count(*) as nbreVersements, sum(volumeGO) as volumeTotalGO,sum(nbreElements) nbreTotalElements from versement group by annee"

        },
        "versements par etatTraitement": {
            sql: "select etatTraitement,sum(nbBoites) nbreBoites,sum(metrage)totalMetrage, count(*) as nbreVersements, sum(volumeGO) as volumeTotalGO,sum(nbreElements) nbreTotalElements from versement group by etatTraitement"
        },
    }







    return self;
})()