var config = (function () {
    var self = {}
    self.locale = "FR";
    self.listHiddenFields = ["id"];
    self.hiddenTables = ["article", "listes"]
    self.LoadAllrecordsTables = true;

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
                coordonnees:"mandatory",
                magasin: "readOnly",
                epi: "readOnly",
                travee: "readOnly",
                tablette: "readOnly",
            }
        },
        "versement": {
            defaultSearchField: "numVersement",
            tabs: ["", "magasin", "article"],
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
                "magasin": {
                    type: "1-n",
                    joinObj: {
                        tables: "versement,magasin",
                        where: " magasin.id_versement=versement.id "
                    },
                    createRelSql: "update magasin set id_versement=<%context.currentRecordId%> where id=<%data.id%>",
                    deleteRelSql:"update magasin set id_versement=null where id=<%data.id%>",
                    selectfields: ["coordonnees"]

                }
                ,
                "article": {
                    type: "1-n",
                    joinSql: "select article.* from article where 1=1 ",
                    joinObj: {
                        tables: "versement,article",
                        where: " article.id_versement=versement.id "
                    },
                    createRelSql: "update article set id_versement=<%context.currentRecordId%> where id=<%data.id%>",
                    deleteRelSql: "update article set id_versement=null where id=<%data.id%>",

                    selectfields: []
                }
            },
            fieldConstraints: {}
            ,


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
        "historique_sorties": {}
    }
    self.lists = {};

    self.tools = {


        "ChercherTablettesDisponibles ": {htmlPage: "findTablettesDialog.html"},

        "DéplacerBoitesVersement ": {htmlPage: "deplacerBoitesDialog.html"},

        "GererLesListes ": {htmlPage: "gererListes.html"},

        "carte de magasin ": {loadMagasinD3: true}


    }


    return self;


})()