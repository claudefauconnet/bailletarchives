var express = require('express');
var router = express.Router();
var mysql = require('../bin/mySQLproxy..js')
var authentication = require('../bin/authentication..js')
var processData = require("../bin/processData..js")

/* GET home page. */
router.get('/', function (req, res, next) {
    if (isRequestLocalHost(req, res))
        res.render('index', {title: 'Express'});
});


router.post('/mysql', function (req, res, next) {
    if (req.body.exec && isRequestLocalHost(req, res)) {
        mysql.exec(req.body.connection, req.body.sql, function (err, result) {
            processResponse(res, err, result)

        })

    }


    if (req.body.datamodel && isRequestLocalHost(req, res)) {
        mysql.datamodel(req.body.connection, function (err, result) {
            processResponse(res, err, result)

        })

    }


});
router.post('/authDB', function (req, res, next) {
    console.log(JSON.stringify(req.body))
    if (req.body.tryLogin) {
        authentication.loginInDB(req.body.login, req.body.password, function (err, result) {
            processResponse(res, err, result)

        })

    }
    if (req.body.enrole) {
        if (req.body.enrole) {
            if (typeof req.body.users === "string")
                req.body.users = JSON.parse(req.body.users)
            authentication.enrole(req.body.users, function (err, result) {
                processResponse(res, err, result)

            })
        }
    }
    if (req.body.changePassword) {
        if (req.body.changePassword) {
            authentication.changePassword(req.body.login, req.body.oldPassword, req.body.newPassword, function (err, result) {
                processResponse(res, err, result)

            })
        }
    }
})
router.post('/versementBoitesToTablettes', function (req, res, next) {

    processData.versementBoitesToTablettes(JSON.parse(req.body.data), function (err, result) {
        processResponse(res, err, result)
    })

});

router.post('/modifytravee', function (req, res, next) {
    processData.modifytravee(req.body.operation, JSON.parse(req.body.tablette), JSON.parse(req.body.options), function (err, result) {
        processResponse(res, err, result)
    })

});

router.post('/bailletarchives-authentication', function (req, response) {
    if (req.body.authentify)
        authentication.authentify(req.body.login, req.body.password, function (error, result) {
            processResponse(response, error, result)
        });

});


router.get('/magasinD3Tree', function (req, res, next) {

    processData.getMagasinTree(function (err, result) {
        processResponse(res, err, result)
    })

});


function isRequestLocalHost(req, res) {
    return true;
    var remote = req.ip || req.connection.remoteAddress
    if ((remote === '::1') || (remote === 'localhost'))
        return true;
    else {
        res.send(401);
        return false;

    }
}

function processResponse(response, error, result) {
    if (response && !response.finished) {
        /* res.setHeader('Access-Control-Allow-Origin', '*');
         res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
         res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype'); // If needed
         res.setHeader('Access-Control-Allow-Credentials', true); // If needed.setHeader('Content-Type', 'application/json');
         */
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
        response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype'); // If needed
        response.setHeader('Access-Control-Allow-Credentials', true); // If needed


        if (error) {
            if (typeof error == "object") {
                error = JSON.stringify(error, null, 2);
            }
            console.log("ERROR !!" + error);

            response.status(404).send({ERROR: error});

        } else if (!result) {
            response.send(null);
           response.send({done: true});
        } else {

            if (typeof result == "string") {
                resultObj = {result: result};

                response.send(JSON.stringify(resultObj));
            } else {
                if (result.contentType && result.data) {
                    response.setHeader('Content-type', result.contentType);
                    if (typeof result.data == "object")
                        response.send(JSON.stringify(result.data));
                    else
                        response.send(result.data);
                } else {
                    var resultObj = result;
                    // response.send(JSON.stringify(resultObj));
                    response.send(resultObj);
                }
            }
        }


    }


}

module.exports = router;
