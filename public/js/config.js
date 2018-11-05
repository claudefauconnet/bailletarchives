var config=(function(){
    var self={}

    self.tableDefs = {
        "magasin": {
            defaultSearchField:"coordonnees",
            tabs:["","versement"],
            type:"n-n",
            sortFields: ["magasin"],
            relations: {
                "versement": {
                    joinSql: "select versement.* from magasin,r_versement_magasin,versement where magasin.id=r_versement_magasin.id_magasin and r_versement_magasin.id_versement=versement.id ",
                    joinObj:{
                        tables:"versement,magasin,r_versement_magasin",
                        where: " magasin.id=r_versement_magasin.id_magasin and r_versement_magasin.id_versement=versement.id "
                    },
                    createRelSql:"insert into r_versement_magasin (id_versement,id_magasin) values(<%data.id%>,<%context.currentRecordId%>)",
                    deleteRelSql: "delete from r_versement_magasin where id_versement=<%data.id%>",


                    selectfields: ["numVersement", "theme", "deposant"]
                }
            },


        },
        "versement": {
defaultSearchField:"numVersement",
            tabs:["","magasin","item"],
            sortFields: ["numVersement desc"],
            fieldTools:{
                "cotesExtremesBoites":{
                    title:"calculer",
                    toolFn:"SetVersementCotesExtremesFromMagasin"
                },
                "nbBoites":{
                    title:"calculer",
                    toolFn:"SetVersementnbBoitesFromMagasin"
                }
            },
            relations: {
                "magasin": {
                    type:"n-n",
                       joinObj:{
                        tables:"versement,magasin,r_versement_magasin",
                        where: " magasin.id=r_versement_magasin.id_magasin and r_versement_magasin.id_versement=versement.id "
                    },
                   createRelSql: "insert into r_versement_magasin (id_versement,id_magasin) values(<%context.currentRecordId%>,<%data.id%>)",
                    deleteRelSql: "delete from r_versement_magasin where id_magasin=<%data.id%>",
                    selectfields: ["coordonnees"]
                }
                ,
                "item": {
                    type:"1-n",
                    joinSql: "select item.* from item where 1=1 ",
                    joinObj:{
                        tables:"versement,item",
                        where: " item.id_versement=versement.id "
                    },
                    createRelSql: "update item set id_versement=<%context.currentRecordId%> where id=<%data.id%>",
                    deleteRelSql: "update item set id_versement=null where id=<%data.id%>",

                    selectfields: []
                }
            },
            fieldConstraints: {
                etatTraitement: {
                    values: ["", "BV", "Rien", "Inv"]
                },
                nature: {
                    values: ["", "analogique", "numérique", "hybride"]
                }

            }
            ,



        },
        "item": {

            tabs:["","versement"],
            sortFields: ["numBoite desc"],
            relations: {
                "versement": {
                    type:"n-n",
                    joinSql: "select versement.* from versement,item where item.id_versement=versement.id and item.id=",
                    createRelSql: "update item set id_versement=<%data.id%> where id=<%context.currentRecordId%>",
                    deleteRelSql:  "update item set id_versement=null where id=<%context.currentRecordId%>",
                    selectfields: ["numVersement"]
                }


            },
            fieldConstraints: {


            }
            ,



        }
    }

    self.tools={


        "ChercherTablettesDisponibles ":{htmlPage:"findTablettesDialog.html"},

        "DéplacerBoitesVersement ":{htmlPage:"deplacerBoitesDialog.html"}





    }



    return self;


})()