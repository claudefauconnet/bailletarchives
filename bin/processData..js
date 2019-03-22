var mySQLproxy = require('./mySQLproxy..js');
var mySqlConnectionOptions = require("../bin/globalParams..js").mysqlConnection;
var fs = require('fs');
var async = require('async');


var processData = {
    getMagasinTree: function (callback) {
        var tailleMoyenneBoite = 0.09

        var sql = "select id,numVersement,id_versement,magasin,epi, travee, tablette,cotesParTablette,metrage,DimTabletteMLineaire as longueurTablette,indisponible from magasin"
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
                var isEmpty = true;
                if (line.cotesParTablette != null && line.cotesParTablette.trim() != "") {
                    isEmpty = false;
                }
                var avecVersementSanscotes=null
                // tablette avec un versement sans cotes
                if(line.numVersement && (!line.cotesParTablette || line.cotesParTablette==""))
                    avecVersementSanscotes=line.numVersement;

                if (!tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee].childrenObjs[line.tablette])
                    tree.childrenObjs[line.magasin].childrenObjs[line.epi].childrenObjs[line.travee].childrenObjs[line.tablette] = {
                        type: "tablette",
                        id: line.id,
                        name: line.tablette,
                        childrenObjs: {},
                        countBoites: 0,
                        longueurM: line.longueurTablette,
                        numVersement: line.numVersement,
                        longueurTotale: 0,
                        longueurOccupee: 0,
                        isEmpty: isEmpty,
                        indisponible:(line.indisponible?(line.commentaires || "indisponible"):null),
                        avecVersementSanscotes:avecVersementSanscotes
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
                                    numVersement: line.numVersement,
                                    id_versement: line.id_versement
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


    versementBoitesToTablettes: function (obj, callback) {
        if (obj.numVersement && obj.metrage && obj.tablettes) {


            var versementId;
            var cotesExtremes = ""
            async.series([

                    // chercher versement
                    function (callbackSeries) {
                        var sql = "select id  from versement where numVersement ='" + obj.numVersement + "'" // get versement Id
                        mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, resultVersement) {
                            if (err)
                                return callback(err);
                            if (resultVersement.length == 0)
                                return callback("noVersement");

                            versementId = resultVersement[0].id;
                            return callbackSeries(null, resultVersement)
                        })
                    },


                    // chercher et update  tablettes cibles et boites
                    function (callbackSeries) {

                        var nBoites = obj.nbBoites;
                        var epaisseurMoyBoite = obj.epaisseurMoyBoite;
                        var tablettesBoites = []
                        var index = 0;
                        var boitesrestantaRanger = obj.nbBoites;
                        var indexBoites = 0;


                        var sql = "select id,DimTabletteMLineaire,coordonnees from magasin where coordonnees in " + JSON.stringify(obj.tablettes).replace("[", "(").replace("]", ")") // get tablettes ids
                        mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, resultMagasin) {
                            if (err)
                                return callback(err);
                            if (resultMagasin.length == 0)
                                return callback("noTablettes");

                            async.eachSeries(resultMagasin, function (tablette, callbackEach) {// create relation

                                var cotesParTabletteStr = "";
                                var metrageTablette = 0;

                                if (obj.nbBoites && obj.epaisseurMoyBoite && tablette.DimTabletteMLineaire) {// boites sur tablette
                                    metrageTablette = obj.nbBoites * obj.epaisseurMoyBoite;

                                    var maxBoitesParTablette = Math.round(tablette.DimTabletteMLineaire / obj.epaisseurMoyBoite * 100);
                                    var boitesSurCetteTablette = Math.min(maxBoitesParTablette, boitesrestantaRanger);
                                    boitesrestantaRanger -= boitesSurCetteTablette;
                                    var boitesCotes = [];
                                    for (var i = 0; i < boitesSurCetteTablette; i++) {

                                        var indexBoiteStr = "" + (++indexBoites);
                                        if ((indexBoiteStr).length == 1)
                                            indexBoiteStr = "0" + indexBoiteStr;
                                        var cote = obj.numVersement + "/" + indexBoiteStr
                                        if (i > 0)
                                            cotesParTabletteStr += " "
                                        cotesParTabletteStr += cote

                                        boitesCotes.push(cote);
                                        if (indexBoites == 1)
                                            cotesExtremes += cote
                                        if (indexBoites >= obj.nbBoites - 1)
                                            cotesExtremes += " " + cote

                                    }


                                    tablettesBoites.push({tablette: tablette, boites: boitesCotes});

                                }

                                sql = "update magasin set metrage=" + metrageTablette + ",id_versement=" + versementId + ", numVersement='" + obj.numVersement + "' , cotesParTablette='" + cotesParTabletteStr + "' where id=" + tablette.id;

                                mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, resultMagasin2) {
                                    if (err)
                                        return callbackEach(err);
                                    return callbackEach();

                                })

                            }, function (err) {
                                if (err)
                                    return callbackSeries(err);
                                return callbackSeries(err, tablettesBoites);
                            })
                        })

                    },


                    //update  refoulement : effacement des infos des tablettes
                    function (callbackSeries) {
                        if (!obj.refoulement)
                            return callbackSeries(null, [])
                        var tablettesRefoulees = []
                        async.eachSeries(obj.refoulement, function (tabletteRefoulee, callbackEach) {// create relation
                            tablettesRefoulees.push(tabletteRefoulee)
                            sql = "update magasin set metrage=null,id_versement=null, numVersement=null , cotesParTablette='' where id=" + tabletteRefoulee.id;

                            mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, resultMagasin2) {
                                if (err)
                                    return callbackEach(err);
                                return callbackEach();

                            })


                        }, function (err) {
                            if (err)
                                return callbackSeries(err);
                            return callbackSeries(err, tablettesRefoulees);
                        })

                    },
                    // update versement metrage et cotes extremes boites
                    function (callbackSeries) {
                        var sql = "update versement set metrage=" + obj.metrage + ", cotesExtremesBoites='" + cotesExtremes + "' where id=" + versementId;
                        mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, resultVersement2) {
                            if (err)
                                return callbackSeries(err);

                            return callbackSeries(err, resultVersement2);
                        })
                    }


                ]

                //AT THE END !!!
                , function (err, results) {
                    if (err)
                        return callback(err);


                    var resume = {
                        versement: {
                            "numVersement": obj.numVersement,
                            "metrage": obj.metrage,
                            "nbBoites": obj.nbBoites,
                            "epaisseurMoyBoite": obj.epaisseurMoyBoite,
                        },
                        tablettes: results[1],
                        refoulement: results[2],
                        date: new Date()

                    }


                    return callback(err, resume);
                })


        }
    }

    ,
    splitBoitesOnTablettes: function (sourceTablette, targetTablette, percentage) {

        async.series([

            // chercher tablettes
            function (callbackSeries) {
                var sql = "select * from tablette where id in =(" + sourceTablette.id + "," + targetTablette.id + ")";
                mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, result) {
                    if (err) {
                        return callbackSeries(err);
                    }
                })
            },
            function (callbackSeries) {
            }], function (err) {


        })


    },
    /**
     *
     *
     *
     *
     * @param operation add-above,add-under, delete, split-above, split-under
     * @param tablette de reference
     * @param options if( split :splitPercentage)
     * @param callback
     */

    modifytravee: function (operation, tablette, options, callback) {
        if (!options)
            options = {};

        var array = tablette.name.split("-");
        var offset = +1
        if (options.above)
            offset = -1
        var indexTablette = parseInt(array[3]) + offset
        if (array.length < 4)
            return;

        var magasin = array[0];
        var epi = array[0] + "-" + array[1];
        var travee = array[0] + "-" + array[1] + "-" + array[2];
        var coordonnees = array[0] + "-" + array[1] + "-" + array[2] + "-" + (indexTablette);
        var newTablette = {
            "coordonnees": coordonnees,
            "commentaires": null,
            "numVersement": null,
            "cotesParTablette": "",
            "metrage": 0,
            "id_versement": null,
            "pretsSorties": null,
            "DimTabletteCm": Math.round(tablette.DimTabletteMLineaire * 100),
            "DimTabletteMLineaire": tablette.DimTabletteMLineaire,
            "magasin": magasin,
            "epi": epi,
            "travee": travee,
            "tablette": coordonnees
        }


        var tablettesTravee = []
        async.series(
            [
                // chercher toutes les tablettes de la travee
                function (callbackSeries) {
                    var sql = "select * from magasin where travee='" + travee + "'";
                    mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, result) {
                        if (err) {
                            return callbackSeries(err);
                        }
                        tablettesTravee = result;
                        return callbackSeries();
                    })

                },
                // decaler les numeros
                function (callbackSeries) {
                    var offset = 1
                    async.eachSeries(tablettesTravee, function (tablette2, callbackEach) {
                        var array = tablette2.coordonnees.split("-");

                        var index = parseInt(array[3]);

                        if (operation == "delete" && index <= indexTablette) {
                            return callbackEach();
                            offset = -1;
                        }

                        else if (options.above && index < indexTablette) {
                            return callbackEach();
                        }


                        else if (index <= indexTablette) {
                            return callbackEach();
                        }
                        else {

                            index += offset;
                            var indexStr = "" + index;
                            if (indexStr.length == 1)
                                indexStr = "0" + indexStr;
                            var newCoordonnees = array[0] + "-" + array[1] + "-" + array[2] + "-" + indexStr;
                            var sql = "update  magasin set coordonnees= '" + newCoordonnees + "' where id=" + tablette2.id;
                            mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, result) {
                                if (err) {
                                    return callbackEach(err);
                                }
                                tablettesTravee = result;
                                return callbackEach();
                            })
                        }


                    }, function (err) {
                        if (err) {
                            return callbackSeries(err);
                        }
                        return callbackSeries();
                    })


                },

                // split boites (if necessary)
                function (callbackSeries) {
                    if (operation == "split" && options.splitPercentage, tablette.children && tablette.children.length) {
                        var moveFrom = tablette.children.length - Math.round((tablette.children.length / 100) * options.splitPercentage);

                        var cotesParTabletteOld = ""
                        var cotesParTabletteNew = ""
                        tablette.children.forEach(function (boite, index) {
                            if ((index) >= moveFrom) {
                                if (cotesParTabletteNew.length > 0)
                                    cotesParTabletteNew += " ";
                                cotesParTabletteNew += boite
                            } else {
                                if (cotesParTabletteOld.length > 0)
                                    cotesParTabletteOld += " ";
                                cotesParTabletteOld += boite
                            }
                        })
                        newTablette.cotesParTablette = cotesParTabletteNew;

                        var sql = "update  magasin set cotesParTablette= '" + cotesParTabletteOld + "' where coordonnees='" + tablette.coordonnees + "'";
                        mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, result) {
                            if (err) {
                                return callbackSeries(err)
                            }
                            return callbackSeries()
                        })

                    } else {
                        return callbackSeries()
                    }
                }
                ,

                // inserer la nouvelle tablette ou detruire l'ancienne
                function (callbackSeries) {
                    if (operation == 'delete') {
                        var sql = "delete from  magasin  where id=" + tablette.id;
                        mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, result) {
                            if (err) {
                                return callbackSeries(err)
                            }
                            return callbackSeries()
                        })


                    } else {
                        processData.execSqlCreateRecord("magasin", newTablette, function (err, result) {
                            if (err) {
                                return callbackSeries(err);
                            }
                            return callbackSeries(null, result);
                        })
                    }
                }]
            , function (err) {
                if (err) {
                    return callback(err);
                }
                return callback(null, "done");
            })
    },


    execSqlCreateRecord: function (table, record, callback) {
        async.series(
            [
                // loadDataModel
                function (callbackSeries) {

                    if (!mySQLproxy._dataModel)
                        mySQLproxy.datamodel(mySqlConnectionOptions, function (err, result) {
                            return callbackSeries(err, result);
                        })
                    else
                        return callbackSeries();
                },
                // exec create sql
                function (callbackSeries) {

                    var sql1 = "insert into " + table + " ( ";
                    var sql2 = " values ( ";
                    var i = 0;
                    for (var key in record) {
                        if (i++ > 0) {
                            sql1 += ","
                            sql2 += ","
                        }
                        sql1 += key;
                        if (!record[key])
                            sql2 += "null";
                        else {
                            var type = mySQLproxy.getFieldType(table, key)
                            if (type == "number")
                                sql2 += ("" + record[key]).replace(",", ".");
                            else if (type == "string")
                                sql2 += "'" + record[key] + "'";
                            else if (type == "date") {
                                var str = ("" + record[key]).replace(/\//g, "-");// date mysql  2018-09-21
                                sql2 += "'" + str + "'";
                            }
                        }

                    }
                    var sql = sql1 + ")" + sql2 + ")";
                    mySQLproxy.exec(mySqlConnectionOptions, sql, function (err, result) {
                        return callbackSeries(err, result);

                    })


                }], function (err) {
                if (err)
                    return callback(err);
                return callback(null, "enregistrement crée");

            })
    }


}

module.exports = processData;
if (false) {
    processData.getMagasinTree(function (err, result) {
        fs.writeFileSync("D:\\GitHub\\bailletArchives\\bailletarchives\\public\\js\\d3\\magasin.json", JSON.stringify(result, null, 2))

    });


}
if (false) {

    var obj =

        {
            "numVersement": "dddd",
            "magasin": "",
            "metrage": 0.96,
            "nbBoites": 35,
            "epaisseurMoyBoite": 8,
            "tablettes": [
                "A-07-02-1",
                "A-07-02-2",
                "A-07-02-3",
            ]
            , "refoulement": [
                "A-07-01-1",
                "A-07-01-2",
                "A-07-01-3",
            ]
        }
    processData.versementBoitesToTablettes(obj, function (err, result) {
        var x = result;
    })
}
if (false) {
    var tablette = {
        coordonnees: 'A-01-01-3',
        "DimTabletteCm": 115,
        "DimTabletteMLineaire": 1.15,
        // cotesParTablette: "XO79 XO80 XO81 XO82 XO83 XO84 XO85 XO86 XO87 XO88 XO89"
        children: "XO79 XO80 XO81 XO82 XO83 XO84 XO85 XO86 XO87 XO88 XO89".split(" ")
    }

    processData.modifytravee("split", tablette, {splitPercentage: 50}, function (err, result) {
        var w = result();
    })


}

