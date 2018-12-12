var magasinD3dialog = (function () {
        var self = {};
        var urlPrefix = ".";
        var tailleMoyenneBoite = 8;
        var currentVersement = null;


        self.init = function () {
            $("#findTablettesD3_versement").focus()
            $("#findTablettesD3_versementBoitesToTablettesButton").prop("disabled", "disabled")
            $("#findTablettesD3_versementRefoulementButton").prop("disabled", "disabled")
            $("#findTablettesD3_epaisseurMoyBoite").val(tailleMoyenneBoite);
            var sql = "select distinct magasin from magasin order by magasin";

            mainController.execSql(sql, function (err, json) {
                if (err)
                    mainController.setErrorMessage(err)
                var magasins = [];
                json.forEach(function (line) {
                    if (line.magasin && line.magasin.match(/[A-Z]/))
                        magasins.push(line);
                })
                mainController.fillSelectOptions("findTablettesD3_magasin", magasins, true, "magasin", "magasin")

            })
        }

        self.onVersementInput = function (input) {
            $("#findTablettesD3_versementBoitesToTablettesButton").prop("disabled", "disabled")
            $("#findTablettesD3_versementRefoulementButton").prop("disabled", "disabled")
            var versement = $(input).val();
            if (versement.length >= 4) {
                var sql = "select * from versement where numVersement='" + versement + "'"
                var payload = {
                    exec: 1,
                    sql: sql
                }

                $.ajax({
                    type: "POST",
                    url: urlPrefix + "/mysql",
                    data: payload,
                    dataType: "json",
                    success: function (dataVersement) {

                        var sql = "select * from magasin where numVersement='" + versement + "'"
                        var payload = {
                            exec: 1,
                            sql: sql
                        }

                        $.ajax({
                            type: "POST",
                            url: urlPrefix + "/mysql",
                            data: payload,
                            dataType: "json",
                            success: function (dataMagasin) {
                                currentVersement = {numVersement: versement}
                                var metrage = 0;
                                var nbBoites = 0
                                if (dataVersement.length > 0) {
                                    dataVersement.forEach(function (line) {
                                        if (line.metrage)
                                            metrage += line.metrage
                                        if (line.nbBoites)
                                            nbBoites += line.nbBoites
                                    })

                                }
                                if (dataMagasin.length > 0)
                                    currentVersement.refoulement = dataMagasin;


                                $("#findTablettesD3_metrage").val(metrage)
                                $("#findTablettesD3_nbBoites").val(nbBoites)
                                self.onNbBoites();
                            },
                            error: function (err) {
                                console.log(err.responseText)

                            }

                        })
                    },
                    error: function (err) {
                        console.log(err.responseText)

                    }
                })

            }

        }
        self.chercherTablettesPourVersement = function () {
            var obj = {
                numVersement: $("#findTablettesD3_versement").val(),
                magasin: $("#findTablettesD3_magasin").val(),
                metrage: parseFloat($("#findTablettesD3_metrage").val().replace(",", ".")),
                nbBoites: parseInt($("#findTablettesD3_nbBoites").val()),
                epaisseurMoyBoite: parseFloat($("#findTablettesD3_epaisseurMoyBoite").val())

            }

            magasinD3.chercherTablettesPourVersement(obj);
            if (currentVersement && currentVersement.refoulement)
                $("#findTablettesD3_versementRefoulementButton").removeAttr("disabled")
            else
                $("#findTablettesD3_versementBoitesToTablettesButton").removeAttr("disabled")
        }


        self.onNbBoites = function () {
            var nBoites = parseInt($("#findTablettesD3_nbBoites").val());
            var epaisseurMoy = parseFloat($("#findTablettesD3_epaisseurMoyBoite").val().replace(",", "."));
            var longueur = nBoites * epaisseurMoy / 100
            var longueurStr = ("" + longueur).replace(".", ",");
            $("#findTablettesD3_metrage").val(longueurStr)

        }


        self.versementExecBoitesToTablettes = function (refoulement) {
            if (refoulement)
                magasinD3.currentVersement.refoulement = currentVersement.refoulement;

            var payload = {
                data: JSON.stringify(magasinD3.currentVersement)
            }

            $.ajax({
                type: "POST",
                url: urlPrefix + "/versementBoitesToTablettes",
                data: payload,
                dataType: "json",
                success: function (data) {
                    //  console.log(JSON.stringify(data, null, 2));
                    magasinD3.drawMagasins();
                    self.showBoitesToTabletteExecResume(data)

                },
                error: function (err) {
                    console.log(err.responseText)

                }
            })


        }

        self.showBoitesToTabletteExecResume = function (data) {
            var str = "";
            str += "numVersement : " + data.versement.numVersement + "<br>"
            str += "metrage : " + data.versement.metrage + "<br>"
            str += "nbBoites : " + data.versement.nbBoites + "<br>"
            str += "epaisseurMoyBoite : " + data.versement.epaisseurMoyBoite + "<br>"
            str += "<ul><li>"
            str += "<b>Tablettes refouléees</b><ul>"
            data.refoulement.forEach(function (tablette, index) {
                if (index == 0)
                    ;

                str += "<li>coordonnees : " + tablette.coordonnees + "<ul>"
                str += "<li>DimTabletteMLineaire : " + tablette.DimTabletteMLineaire + "</li>"
                str += "<li>cotesParTablette : " + tablette.cotesParTablette + "</li>"
                str+="</ul>"

            })
            str+="</li>"
            str+="</ul>"
            str += "<li>"
            str += "<b>Tablettes attribuées</b><ul>"
            data.tablettes.forEach(function (tablette, index) {
                if (index == 0)
                    ;

                str += "<li>coordonnees : " + tablette.tablette.coordonnees + "<ul>"
                str += "<li>DimTabletteMLineaire : " + tablette.tablette.DimTabletteMLineaire + "</li>"
                var boitesStr = "";
                tablette.boites.forEach(function (boite, index) {
                    boitesStr += boite + " ";
                })
                str+="<li>"+boitesStr+"</li>"
                str+="</ul>"
                str+="</li>"
            })
            str+="</ul>"
            str += "</li>"
            str += "</ul>"
            dialog3.dialog("open");
            $("#dialog3Div").attr("title", "resultat");
            $("#dialog3Div").html(str)




        }

        return self;
    }
)()