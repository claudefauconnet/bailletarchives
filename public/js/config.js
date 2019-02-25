var config = (function () {
    var self = {}
    self.locale = "FR";
    self.listHiddenFields = ["id"];
    self.hiddenTables = ["article", "listes"]
    self.LoadAllrecordsTables = false;
    self.maxVersementsToLocate = 5;

    self.tableDefs = {
        "magasin": {
            defaultSearchField: "coordonnees",
            tabs: ["", "versement"],
            type: "n-1",
            sortFields: ["magasin"],
            relations: {
                "versement": {
                    joinObj: {
                        tables: "versement,magasin",
                        where: "versement.id=magasin.id_versement"
                    },
                    createRelSql: "update magasin set id_versement=<%data.id%> where  id=<%context.currentRecordId%>\"",
                    deleteRelSql: "update magasin set id_versement=null where  id=<%context.currentRecordId%>\"",


                    selectfields: ["numVersement", "theme", "deposant"]
                }
            },

            fieldConstraints: {
                numVersement: "readOnly;mandatory",
                coordonnees: "mandatory",
                magasin: "readOnly",
                epi: "readOnly",
                travee: "readOnly",
                tablette: "readOnly",
            }
        },
        "versement": {
            defaultSearchField: "numVersement",
            tabs: ["versement_historique", "magasin", "sortie_boite"],
            sortFields: ["numVersement desc"],
            fieldTools: {
                /*  "cotesExtremesBoites": {
                      title: "calculer",
                      toolFn: "SetVersementCotesExtremesFromMagasin"
                  },
                  "nbBoites": {
                      title: "calculer",
                      toolFn: "SetVersementnbBoitesFromMagasin"
                  }*/
            },
            relations: {
                "versement_historique": {
                    type: "1-n",
                    joinObj: {
                        tables: "versement,versement_historique",
                        where: " versement_historique.id_versement=versement.id "
                    },
                    createRelSql: "update versement_historique set id_versement=<%context.currentRecordId%> where id=<%data.id%>",
                    deleteRelSql: "update versement_historique set id_versement=null where id=<%data.id%>",
                    selectfields: ["coordonnees"]

                },
                "magasin": {
                    type: "1-n",
                    joinObj: {
                        tables: "versement,magasin",
                        where: " magasin.id_versement=versement.id "
                    },
                    createRelSql: "update magasin set id_versement=<%context.currentRecordId%> where id=<%data.id%>",
                    deleteRelSql: "update magasin set id_versement=null where id=<%data.id%>",
                    selectfields: ["coordonnees"]

                }
                ,
                "sortie_boite": {
                    type: "1-n",
                    joinObj: {
                        tables: "versement,sortie_boite",
                        where: " sortie_boite.id_versement=versement.id "
                    },
                    createRelSql: "update sortie_boite set id_versement=<%context.currentRecordId%> where id=<%data.id%>",
                    deleteRelSql: "update sortie_boite set id_versement=null where id=<%data.id%>",


                }
               /* "article": {
                    type: "1-n",
                    joinSql: "select article.* from article where 1=1 ",
                    joinObj: {
                        tables: "versement,article",
                        where: " article.id_versement=versement.id "
                    },
                    createRelSql: "update article set id_versement=<%context.currentRecordId%> where id=<%data.id%>",
                    deleteRelSql: "update article set id_versement=null where id=<%data.id%>",

                    selectfields: []
                }*/
            },
            fieldConstraints: {

                numVersement: "mandatory",
                nature: "mandatory",
                etatTraitement: "mandatory",
                etatTraitementAuteur: "mandatory",
                etatTraitementDate: "mandatory",
            },
            onAfterSave: versement.updateRecordHistory


        },
        "article": {

            tabs: ["", "versement"],
            sortFields: ["numBoite desc"],
            relations: {
                "versement": {
                    type: "n-n",
                    joinObj: {
                        tables: "versement,article",
                        where: " article.id_versement=versement.id "
                    },
                    createRelSql: "update article set id_versement=<%data.id%> where id=<%context.currentRecordId%>",
                    deleteRelSql: "update article set id_versement=null where id=<%context.currentRecordId%>",
                    selectfields: ["numVersement"]
                }


            },
            fieldConstraints: {}
            ,


        },
        "sortie_boite": {
            tableConstraints:{
                cannotDelete :true
            },
            tabs: [],
            fieldConstraints: {
                id_versement:"hidden"

            },
        fieldTools: {
                numVersement:{
                    title:"selectionner boites",
                    toolFn:"sortiesShowBoitesCbx"
                }


            }
        }
    }
    self.lists = {};

    self.tools = {


        "ChercherTablettesDisponibles ": {htmlPage: "magasinD3dialog.html"},

        "DéplacerBoitesVersement ": {htmlPage: "deplacerBoitesDialog.html"},

        "GererLesListes ": {htmlPage: "gererListes.html"},

        "carte de magasin ": {loadMagasinD3: true}


    }


    self.default = {
        textArea: {
            cols: 30,
            rows: 2
        }


}


return self;


})
()