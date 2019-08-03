var authentication = (function () {

    var self = {}
// pb avec l'url sur serveur a cause d'nginx qui n'adment pas authentication ??? voir config version antérieure déployéee
    self.authenticationUrl = "../bailletarchives-authentication";
    self.userIndexes = [];
    self.currentUser={};


    self.init = function (activate) {
        var url = window.location.host;
        if (activate) {//  && url.indexOf("localhost")<0 && url.indexOf("127.0.0.1")<0){


            $("#loginDiv").css("visibility", "visible");
            $("#panels").css("visibility", "hidden");
            var width = $(window).width()
            var height = $(window).height()
            $("#loginDiv").width(width).height(height).css("background-color", "#e5ebea").css("top", "0px").css("left", "0");
            ;
            // $("#panels").css("display", "none")

        }

    }

    self.doLogin = function () {
        var login = $("#loginInput").val();
        var password = $("#passwordInput").val();
        $("#main").css("visibility", "hidden");

     /*   if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)) {
            $("#loginMessage").html("invalid  login : Minimum eight characters, at least one uppercase letter, one lowercase letter and one number");
        }*/
        var user = null;
        async.series([
            function (callbackSeries) {
                if (config.loginMode != "database")
                    return callbackSeries();
                self.doLoginDatabase(login, password, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    user = result;
                    return callbackSeries();
                });

            },
            function (callbackSeries) {
                if (config.loginMode != "json")
                    return callbackSeries();
                self.doLoginJson(login, password, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    user = result;
                    return callbackSeries();
                });

            }


        ], function (err) {
            if (err)
                return $("#loginMessage").html(err);
            if(!user)
                return $("#loginMessage").html("invalid  login or password");

            $("#loginDiv").css("visibility", "hidden");
            $("#main").css("visibility", "visible");
            self.currentUser=user;
            mainController.init0();

        })



    }


    self.doLoginDatabase = function (login, password,callback) {




        var authenticationUrl = "../authDB";
        var payload = {
            tryLogin: 1,
            login: login,
           password: password,


        }

        $.ajax({
            type: "POST",
            url: authenticationUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                return callback(null,data);


            }, error: function (err) {
                if(err.responseJSON && err.responseJSON.ERROR=="changePassword"){
                    return callback("le mot de passe doit être changé (menu outils)")
                }
                return callback(err);


            }
        })
       /* var sql = "select * from utilisateur where identifiant='" + login + "' and motDepasse='" + password + "'";
        mainController.execSql(sql, function (err, result) {
            if (err) {
               return callback(err);
            }
            if (result.length == 0)
               return callback();
            return callback(null,result[0]);

        })*/


    }

    self.doLoginJson = function (login, password,callback) {


        var payload = {
            authentify: 1,
            login: login,
            password: password

        }
        $.ajax({
            type: "POST",
            url: self.authenticationUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {

                if (!$.isArray(data))
                    return callback(err);

                else if (data.length == 0) {
                    return callback();

                }
                var   user = {
                    identifiant: login,
                    nomComplet:login,
                    groupes:data,
                };
                return callback(null,user);

                // $("#panels").css("display", "block")


            }, error: function (err) {
                return callback(err);


            }
        })

    }


    return self;
})()
