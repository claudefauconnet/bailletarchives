var config = (function () {
    var self = {}
    self.locale = "FR";
    self.listHiddenFields = ["id"];
    self.hiddenTables = ["article", "listes"]
    self.LoadAllrecordsTables = false;
    self.maxVersementsToLocate = 5;
    self.coefRemplissageTablette = .7
    self.coteBoiteNbDigits = 3;
    self.loginMode="json";  //json || database

    self.tableDefs = {

        "versement": {
            defaultSearchField: "numVersement",
            tabs: ["versement_historique", "magasin", "sortie_boite"],
            sortFields: ["numVersement desc"],
            recordTools: [
                {
                    title: "Entrer en magasin...",
                    id: "versementEntrerEnMagasinButton",
                    toolFn: "Versement.showDialogEntrerVersement"
                },
                {
                    title: "Localiser...",
                    id: "versementLocaliserButton",
                    toolFn: "Versement.locateCurrentVersement"
                },
                {
                    title: "Refouler...",
                    id: "versementRefoulerButton",
                    toolFn: "Versement.showDialogEntrerVersement"
                },
                {
                    title: "Ajouter Tablette...",
                    id: "versementAjouterTabletteButton",
                    toolFn: "Versement.ajouterTablette"
                }


            ],
            fieldTools: {


                "cotesExtremesBoites": {
                    title: "mettre à jour",
                    toolFn: "Versement.SetVersementCotesExtremesFromMagasin"
                },
                "nbBoites": {
                    title: "calculer",
                    toolFn: "Versement.SetVersementnbBoitesFromMagasin"
                }
            },
            relations: {
                "versement_historique": {
                    type: "1-n",
                    joinObj: {
                        tables: "versement,versement_historique",
                        where: " versement_historique.id_versement=versement.id",

                    },
                    createRelSql: "update versement_historique set id_versement=<%context.currentRecord.id%> where id=<%data.id%>",
                    deleteRelSql: "update versement_historique set id_versement=null where id=<%data.id%>",
                    selectfields: ["coordonnees"],
                    //  onRowClickedFn:Versement.onDataTableRowClicked,
                    editableColumns: {commentaire: {}},
                    columns: ["etat", "etatAuteur", "etatDate", "commentaire", "dateModification"],
                    order: [[2, 'desc']]

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
                    onListLoadedFn: Versement.onMagasinsLoaded,

                    editableColumns:
                        {
                            cotesParTablette: {callback: Tablette.onAfterEditTaletteTableCell},
                            commentaires: {}
                        },


                    columns: ["coordonnees", "cotesParTablette", "commentaires", "DimTabletteMLineaire"]

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
                    columns: ["numVersement", "sortieDate", "sortieArchiviste", "retourDate", "retourArchiviste", "cotesBoite", "commentaire"],
                    editableColumns: {commentaire: {}},




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

                numVersement: {mandatory: true, unique: true, format: {regex: /^[0-9]\d{3}$/, message: "4 chiffres"}},
                auteurVersement:{mandatoryOnNew:true},
                receptionnePar:{mandatory:true},
                dateVersement:{mandatoryOnNew:true},
                nature: {mandatory: true},
                centreArchive: {mandatory: true},
                etatTraitement: {mandatory: true},
                etatTraitementAuteur: {mandatory: true},
                etatTraitementDate: {mandatory: true},
                DimTabletteMLineaire: {mandatory: true},
            },
            tableConstraints: {
                cannotDelete: false
            },
            fieldLabels:{
               FR:{
                   intitule:"intitulé",
                   cotesExtremesDossiersNiveauUn:"cotesExtr.Dossiers"
               }



            },
            onAfterDisplay: Versement.setNewRecordDefaultValues,
            onAfterSave: Versement.updateRecordHistoryAfterVersementSave,
            onAfterDelete: Versement.onAfterDelete,
            onBeforeSave: Versement.onBeforeSave


        },
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
                coordonnees: {mandatory: true, format: {regex: /^[A-Z]-\d{2}-\d{2}-\d{1,2}$/, message: " example A-01-03-5"}},
                magasin: {readOnly: true},
                epi: {readOnly: true},
                travee: {readOnly: true},
                tablette: {readOnly: true},
            },
            onAfterDisplay: Tablette.setNewTabletteCoordonnees,
            onAfterSave: Tablette.onAfterSave

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
                id_versement: {hidden: true},
                sortieDate: {mandatory: true},
                sortieArchiviste: {mandatory: true},



            },

            recordTools: [

                {
                    title: "Localiser...",
                    id: "sortieLocaliserButton",
                    toolFn: "Sortie.locateCurrentSortie"
                },
                {
                    id: "sortieSelectionnerBoites",
                        title: "selectionner boites",
                        toolFn: "Sortie.sortiesShowBoitesCbx"
                }
            ],
            onAfterDisplay: Sortie.setNewRecordDefaultValues,
            onBeforeSave: Sortie.onBeforeSave
        },
        "versement_historique": {
            tableConstraints: {
                cannotDelete: true
            },
            tabs: [],
        }
        ,  "utilisateur": {
            tableConstraints: {
                cannotDelete: true
            },
            fieldConstraints: {
                motDePasse: {hidden: true},
            },
            tabs: [],
            onBeforeSave: authentication.onBeforeSave
        }
    }
    self.lists = {};

    self.tools = {
        "GererLesListes ": {htmlPage: "gererListes.html"},
        "changerMotDePasse": {htmlPage: "changerMotDePasse.html"},



    }


    self.default = {
        textArea: {
          //  cols: 50,
            cols: 30,
            rows: 4
        },
        fieldInputWith:200,


    }


    return self;


})
()
