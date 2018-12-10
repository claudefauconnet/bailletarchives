var mySQLproxy = require('./mySQLproxy..js');
var mySqlConnectionOptions = require("../bin/globalParams..js").mysqlConnection;
var fs = require('fs');
var async = require('async');


var processData = {
    getMagasinTree: function (callback) {
        var tailleMoyenneBoite = 0.09

        var sql = "select numVersement,magasin,epi, travee, tablette,cotesParTablette,metrage,DimTabletteMLineaire as longueurTablette from magasin"
        mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, result) {
            var tree = {
                name: "Baillet",
                childrenObjs: {},
                children: [],
                countBoites: 0,
                longueurTotale: 0,
                longueurOccupee: 0
            };
            result.forEach(function (line) {
                if (!line.magasin || !line.magasin.match(/[A-Z]/))
                    return;
                var xx = 3
                if (!tree.childrenObjs[line.magasin])
                    tree.childrenObjs[line.magasin] = {
                        type: "magasin",
                        name: line.magasin,
                        childrenObjs: {},
                        countBoites: 0,
                        longueurTotale: 0,
                        longueurOccupee: 0
                    };


                if (!tree.childrenObjs[line.magasin].childrenObjs[line.epi])
                    tree.childrenObjs[line.magasin].childrenObjs[line.epi] = {
                        type: "epi",
                        name: line.epi,
                        childrenObjs: {},
                        countBoites: 0,
                        longueurTotale: 0,
                        longueurOccupee: 0
                    }

                if (!tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee])
                    tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee] = {
                        type: "travee",
                        name: line.travee,
                        childrenObjs: {},
                        countBoites: 0,
                        longueurTotale: 0, longueurOccupee: 0
                    }

                if (!tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee].childrenObjs[line.tablette])
                    tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee].childrenObjs[line.tablette] = {
                        type: "tablette",
                        id: line.id,
                        name: line.tablette,
                        childrenObjs: {},
                        countBoites: 0,
                        longueurM: line.longueurTablette,
                        numVersement: line.numVersement,
                        longueurTotale: 0, longueurOccupee: 0
                    }


                var longueurOccupee = 0;
                var longueurTotale = 0

                if (line.metrage && line.longueurTablette) {
                    longueurOccupee = line.metrage;
                    longueurTotale = line.longueurTablette;
                }

                if (line.cotesParTablette) {
                    var boites = line.cotesParTablette.split(" ");


                    if (!line.metrage || line.metrage == 0 && boites.length > 0) {//étageres avec boites mais metrage pas calculé
                        longueurOccupee = (boites.length * tailleMoyenneBoite)
                        longueurTotale = line.longueurTablette;
                    }


                    if (boites) {

                        boites.forEach(function (boite) {
                            if (boite != " ") {
                                //  boite.parent = tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee].childrenObjs[line.tablette];


                                tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee].childrenObjs[line.tablette].childrenObjs[boite] = {
                                    name: boite,
                                    count: 1,
                                    children: [],
                                    numVersement: line.numVersement
                                };
                                tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee].childrenObjs[line.tablette].countBoites += 1
                                tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee].countBoites += 1;
                                tree.childrenObjs[line.magasin].childrenObjs[line.epi].countBoites += 1
                                tree.childrenObjs[line.magasin].countBoites += 1
                                tree.countBoites += 1

                            }

                        })
                    }
                }
                tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee].childrenObjs[line.tablette].longueurOccupee += longueurOccupee;
                tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee].childrenObjs[line.tablette].longueurTotale += longueurTotale;
                tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee].longueurOccupee += longueurOccupee;
                tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee].longueurTotale += longueurTotale;
                tree.childrenObjs[line.magasin].childrenObjs[line.epi].longueurOccupee += longueurOccupee;
                tree.childrenObjs[line.magasin].childrenObjs[line.epi].longueurTotale += longueurTotale;
                tree.childrenObjs[line.magasin].longueurOccupee += longueurOccupee;
                tree.childrenObjs[line.magasin].longueurTotale += longueurTotale;
                tree.longueurOccupee += longueurOccupee
                tree.longueurTotale += longueurTotale


            })


            recurse1 = function (obj) {
                obj.children = [];
                if (!obj.count)
                    obj.count = 0;
                var taux = obj.longueurOccupee / obj.longueurTotale;
                obj.tauxOccupation = taux ? taux : 0
                for (var key in  obj.childrenObjs) {
                    obj.children.push(obj.childrenObjs[key])
                    obj.count += 1
                    recurse1(obj.childrenObjs[key])
                }
            }


            recurse2 = function (obj) {
                if (obj.children) {
                    obj.children.forEach(function (child) {
                        recurse2(child);

                    })
                    delete  obj.childrenObjs;
                    delete  obj.parent;
                }

            }

            recurse1(tree);
            recurse2(tree);
            callback(null, tree)

        })


    },


    applyTablettesToversement: function (obj, callback) {
        if (obj.numVersement && obj.metrage && obj.tablettes) {
            var nBoites = obj.nbBoites;
            var epaisseurMoyBoite = obj.epaisseurMoyBoite;
            obj.tablettesBoites=[]
            var sql = "select id,DimTabletteMLineaire  from magasin where coordonnees in " + JSON.stringify(obj.tablettes).replace("[", "(").replace("]", ")") // get tablettes ids
            mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, resultMagasin) {
                if (err)
                    return callback(err);
                if (resultMagasin.length == 0)
                    return callback("noTablettes");
                var sql = "select id  from versement where numVersement ='" + obj.numVersement + "'" // get versement Id
                mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, resultVersement) {
                    if (err)
                        return callback(err);
                    if (resultVersement.length == 0)
                        return callback("noVersement");

                    var versementId = resultVersement[0].id;
                    var index = 0;
                    var boitesrestantaRanger = obj.nbBoites;
                    var indexBoites = 0;
                    async.eachSeries(resultMagasin, function (tablette, callbackEach) {// create relation

                        var cotesParTabletteStr = "";

                        if (obj.nbBoites && obj.epaisseurMoyBoite && tablette.DimTabletteMLineaire) {// boites sur tablette
                            var maxBoitesParTablette = Math.round(tablette.DimTabletteMLineaire / obj.epaisseurMoyBoite*100);
                            var boitesSurCetteTablette = Math.min(maxBoitesParTablette, boitesrestantaRanger);
                            boitesrestantaRanger -= boitesSurCetteTablette;
                            var boitesCotes = [];
                            for (var i = 0; i < boitesSurCetteTablette; i++) {
                                if (i > 0)
                                    cotesParTabletteStr += " "
                                cotesParTabletteStr += obj.numVersement + "/" + (indexBoites++)

                                boitesCotes.push(cotesParTabletteStr);
                            }

                            obj.tablettesBoites.push({tablette: tablette, boites: boitesCotes});

                        }


                        var sql = "insert into r_versement_magasin (id_versement,id_magasin) values ('" + versementId + "','" + tablette.id + "')";

                        mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, resultRversementMagasin) {
                            if (err)
                                return callbackEach(err);
                            if ((index++) < resultMagasin.length - 1)// update magasin
                                sql = "update magasin set metrage=0,cotesParTablette='', numVersement='" + obj.numVersement + "', cotesParTablette='" + cotesParTabletteStr + "' where id=" + tablette.id;
                            else// metrage sur derniere tablette
                                sql = "update magasin set metrage=" + obj.metrage + ",cotesParTablette='', numVersement='\"+obj.numVersement+\"' , cotesParTablette='\"+cotesParTabletteStr+\"' where id=" + tablette.id;

                            mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, resultMagasin2) {
                                if (err)
                                    return callbackEach(err);
                                var sql = "update versement set metrage=" + obj.metrage + " where id=" + versementId;

                                mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, resultVersement2) {
                                    if (err)
                                        return callbackEach(err);
                                    callbackEach();
                                })
                            })

                        })
                    }, function (err) {
                        if (err)
                            return callback(err);
                        return callback(err, obj);


                    })

                })
            })
        }
    }


}

module.exports = processData;
if (false) {
    processData.getMagasinTree(function (err, result) {
        fs.writeFileSync("D:\\GitHub\\bailletArchives\\bailletarchives\\public\\js\\d3\\magasin.json", JSON.stringify(result, null, 2))

    });


}
if (true) {

    var obj =

    {
        "numVersement": "dddd",
        "magasin": "",
        "metrage": 0.96,
        "nbBoites": 12,
        "epaisseurMoyBoite": 8,
        "tablettes": [
        "A-01-09-6"
    ]
    }
    processData.applyTablettesToversement(obj, function (err, result) {
        var x = result;
    })
}

