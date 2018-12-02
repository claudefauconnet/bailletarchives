var mySQLproxy = require('./mySQLproxy..js');
var mySqlConnectionOptions = require("../bin/globalParams..js").mysqlConnection;
var fs = require('fs')


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
                if(!line.magasin || !line.magasin.match(/[A-Z]/))
                    return;
                    var xx=3
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
                                    numVersement:line.numVersement
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
            callback(null,tree)

        })


    }

}

module.exports = processData;
if (true) {
    processData.getMagasinTree(function (err, result) {
        fs.writeFileSync("D:\\GitHub\\bailletArchives\\bailletarchives\\public\\js\\d3\\magasin.json", JSON.stringify(result, null, 2))

    });


}

