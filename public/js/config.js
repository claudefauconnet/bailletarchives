var config = (function () {
    var self = {}
    self.locale = "FR";
    self.listHiddenFields = ["id"];
    self.hiddenTables = ["article", "listes"]
    self.LoadAllrecordsTables = false;
    self.maxVersementsToLocate = 5;
    self.coefRemplissageTablette=.7
    self.coteBoiteNbDigits=3

    self.tableDefs = {
        "magasin": {
            defaultSearchField: "coordonnees",
            tabs: ["versement"],
            type: "n-1",
            sortFields: ["magasin"],
            relations: {
                "versement": {
                    joinObj: {
                        tables: "versement,magasin",
                        where: "versement.id=magasin.id_versement"
                    },
                    createRelSql: "update magasin set id_versement=<%data.id%> where  id=<%context.currentRecord.id%>\"",
                    deleteRelSql: "update magasin set id_versement=null where  id=<%context.currentRecord.id%>\"",


                    selectfields: ["numVersement", "theme", "deposant"]
                }
            },

            fieldConstraints: {
                coordonnees: {mandatory:true},
                magasin: {readOnly:true},
                epi: {readOnly:true},
                travee: {readOnly:true},
                tablette: {readOnly:true},
            }
        },
        "versement": {
            defaultSearchField: "numVersement",
            tabs: ["versement_historique", "magasin", "sortie_boite"],
            sortFields: ["numVersement desc"],
            recordTools: [
                {
                    title: "Entrer en magasin...",
                    id:"VersementEntrerEnMagasinButton",
                    toolFn: "Versement.showDialogEntrerVersement"
                },
                {
                    title: "Localiser...",
                    id:"VersementLocaliserButton",
                    toolFn: "Versement.locateCurrentVersement"
                },
                {
                    title: "Refouler...",
                    id:"VersementRefoulerButton",
                    toolFn: "Versement.refoulerVersement"
                }

            ],
            fieldTools: {


                 "cotesExtremesBoites": {
                      title: "mettre à jour",
                      toolFn: "versement.SetVersementCotesExtremesFromMagasin"
                  },
                  "nbBoites": {
                      title: "calculer",
                      toolFn: "versement.SetVersementnbBoitesFromMagasin"
                  }
            },
            relations: {
                "versement_historique": {
                    type: "1-n",
                    joinObj: {
                        tables: "versement,versement_historique",
                        where: " versement_historique.id_versement=versement.id "
                    },
                    createRelSql: "update versement_historique set id_versement=<%context.currentRecord.id%> where id=<%data.id%>",
                    deleteRelSql: "update versement_historique set id_versement=null where id=<%data.id%>",
                    selectfields: ["coordonnees"],
                  //  onRowClickedFn:versement.onDataTableRowClicked,
                    editableColumns: ["commentaire"],
                    columns:["etat","etatAuteur","etatDate","commentaire","dateModification"]

                },
                "magasin": {
                    type: "1-n",
                    joinObj: {
                        tables: "versement,magasin",
                        where: " magasin.id_versement=versement.id "
                    },
                    createRelSql: "update magasin set id_versement=<%context.currentRecord.id%> where id=<%data.id%>",
                    deleteRelSql: "update magasin set id_versement=null where id=<%data.id%>",
                    selectfields: ["coordonnees"],
                    onListLoadedFn:versement.onMagasinsLoaded,
                   // onRowClickedFn:versement.onDataTableRowClicked,
                    editableColumns: ["cotesParTablette","commentaires"],
                   columns : ["coordonnees","cotesParTablette","commentaires","DimTabletteMLineaire"]

                }
                ,
                "sortie_boite": {
                    type: "1-n",
                    joinObj: {
                        tables: "versement,sortie_boite",
                        where: " sortie_boite.id_versement=versement.id "
                    },
                    createRelSql: "update sortie_boite set id_versement=<%context.currentRecord.id%> where id=<%data.id%>",
                    deleteRelSql: "update sortie_boite set id_versement=null where id=<%data.id%>",
                    columns : ["numVersement","sortieDate","sortieArchiviste","retourDate","retourArchiviste","cotesBoite","commentaire"],
                    editableColumns: ["commentaire"],


                }
                /* "article": {
                     type: "1-n",
                     joinSql: "select article.* from article where 1=1 ",
                     joinObj: {
                         tables: "versement,article",
                         where: " article.id_versement=versement.id "
                     },
                     createRelSql: "update article set id_versement=<%context.currentRecord.id%> where id=<%data.id%>",
                     deleteRelSql: "update article set id_versement=null where id=<%data.id%>",

                     selectfields: []
                 }*/
            },
            fieldConstraints: {

                numVersement: {mandatory:true,format:{regex:/^1\d{3}$/,message:"4 chiffres commençant par 1"}},
                nature: {mandatory:true},
                etatTraitement: {mandatory:true},
                etatTraitementAuteur: {mandatory:true},
                etatTraitementDate: {mandatory:true},
                DimTabletteMLineaire: {mandatory:true},
            },
            onAfterDisplay: Versement.setNewRecordDisplayNumVersement,
            onAfterSave: Versement.updateRecordHistory


        },
        "article": {

            tabs: ["versement"],
            sortFields: ["numBoite desc"],
            relations: {
                "versement": {
                    type: "n-n",
                    joinObj: {
                        tables: "versement,article",
                        where: " article.id_versement=versement.id "
                    },
                    createRelSql: "update article set id_versement=<%data.id%> where id=<%context.currentRecord.id%>",
                    deleteRelSql: "update article set id_versement=null where id=<%context.currentRecord.id%>",
                    selectfields: ["numVersement"]
                }


            },
            fieldConstraints: {}
            ,


        },
        "sortie_boite": {
            tableConstraints: {
                cannotDelete: true
            },
            tabs: [],
            fieldConstraints: {
                id_versement: {hidden:true},
                sortieDate:{mandatory:true},
                sortieArchiviste:{mandatory:true},




            },
            fieldTools: {
                numVersement: {
                    title: "selectionner boites",
                    toolFn: "sortiesShowBoitesCbx"
                }


            }
        },
        "versement_historique": {
            tableConstraints: {
                cannotDelete: true
            },
            tabs: [],
        }
    }
    self.lists = {};

    self.tools = {


      //  "ChercherTablettesDisponibles ": {htmlPage: "magasinD3dialog.html"},

    //    "DéplacerBoitesVersement ": {htmlPage: "deplacerBoitesDialog.html"},

        "GererLesListes ": {htmlPage: "gererListes.html"},

     //   "carte de magasin ": {loadMagasinD3: true}


    }


    self.default = {
        textArea: {
            cols: 50,
            rows: 4
        }


    }




    return self;


})
()