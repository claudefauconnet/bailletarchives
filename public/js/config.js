var config=(function(){
    var self={}

    self.tableDefs = {
        "magasin": {
            tabs:["","versement"],
            type:"n-n",
            sortFields: ["magasin"],
            relations: {
                "versement": {
                    selectSql: "select versement.* from magasin,r_versement_magasin,versement where magasin.id=r_versement_magasin.id_magasin and r_versement_magasin.id_versement=versement.id and magasin.id=",
                    createRelSql:"insert into r_versement_magasin (id_versement,id_magasin) values(<%data.id%>,<%context.currentRecordId%>)",
                    deleteRelSql: "delete from r_versement_magasin where id_versement=<%data.id%>",
                    selectfields: ["num", "versement", "theme", "deposant"]
                }
            },


        },
        "versement": {

            tabs:["","magasin","item"],
            sortFields: ["numVersement desc"],
            relations: {
                "magasin": {
                    type:"n-n",
                    selectSql: "select magasin.* from magasin,r_versement_magasin,versement where magasin.id=r_versement_magasin.id_magasin and r_versement_magasin.id_versement=versement.id and versement.id=",
                   createRelSql: "insert into r_versement_magasin (id_versement,id_magasin) values(<%context.currentRecordId%>,<%data.id%>)",
                    deleteRelSql: "delete from r_versement_magasin where id_magasin=<%data.id%>",
                    selectfields: ["coordonnees"]
                }
                ,
                "item": {
                    type:"1-n",
                    selectSql: "select item.* from item where  id_versement=",
                    createRelSql: "update item set id_versement=<%context.currentRecordId%> where id=<%data.id%>",
                    deleteRelSql: "update item set id_versement=null where id=<%data.id%>",

                    selectfields: []
                }
            },
            fieldConstraints: {
                etatTraitement: {
                    values: ["", "BV", "Rien", "Inv"]
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
                    selectSql: "select versement.* from versement,item where item.id_versement=versement.id and item.id=",
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



    return self;


})()