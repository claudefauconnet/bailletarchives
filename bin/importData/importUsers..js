

console.log("zzz")
var imporUsers= {
    data: {
        "Lopes": {
            "login": "Lopes",
            "password": "CatLope17",
            "groups": [
                "ATD"
            ]
        },
        "Razanakoto": {
            "login": "Razanakoto",
            "password": "Soa251159",
            "groups": [
                "ATD"
            ]
        },
        "honorine": {
            "login": "honorine",
            "password": "Hono365",
            "groups": [
                "ATD"
            ]
        },
        "Ugarte": {
            "login": "Ugarte",
            "password": "SilUgar17",
            "groups": [
                "ATD"
            ]
        },
        "Bernas": {
            "login": "Bernas",
            "password": "DomBern17",
            "groups": [
                "ATD"
            ]
        },
        "rosana": {
            "login": "rosana",
            "password": "Rosaphoto17",
            "groups": [
                "ATD"
            ]
        },
        "Macedo": {
            "login": "Macedo",
            "password": "RosMace17",
            "groups": [
                "ATD"
            ]
        },
        "Ortega": {
            "login": "Ortega",
            "password": "SarOrte17",
            "groups": [
                "ATD"
            ]
        },
        "Chanal": {
            "login": "Chanal",
            "password": "VinChan17",
            "groups": [
                "ATD"
            ]
        },
        "Tardieu": {
            "login": "Tardieu",
            "password": "BruTard17",
            "groups": [
                "ATD"
            ]
        },
        "visiteur": {
            "login": "visiteur",
            "password": "TotoVisiteur25",
            "groups": [
                "ATD"
            ]
        },
        "Fayard": {
            "login": "Fayard",
            "password": "DanFaya17",
            "groups": [
                "ATD"
            ]
        },
        "Noyer": {
            "login": "Noyer",
            "password": "BeaNoye17",
            "groups": [
                "ATD"
            ]
        },
        "Corinne": {
            "login": "Corinne",
            "password": "CorinneM2018",
            "groups": [
                "ATD"
            ]
        },
        "Egner": {
            "login": "Egner",
            "password": "HyaEgne17",
            "groups": [
                "ATD"
            ]
        },
        "Thouvenin": {
            "login": "Thouvenin",
            "password": "SebThou17",
            "groups": [
                "ATD",
                "ADMIN"
            ]
        },
        "Diana": {
            "login": "Diana",
            "password": "DiaSkel19",
            "groups": [
                "ATD"
            ]
        },
        "Fauconnet": {
            "login": "Fauconnet",
            "password": "ClaFauc17",
            "groups": [
                "ATD",
                "ADMIN"
            ]
        },
        "loic": {
            "login": "loic",
            "password": "CamusH332",
            "groups": [
                "ATD",
                "ADMIN"
            ]
        },
        "jacques": {
            "login": "jacques",
            "password": "c4atdCIJW",
            "groups": [
                "ATD",
                "ADMIN"
            ]
        },
        "Rene-Bazin": {
            "login": "Rene-Bazin",
            "password": "PauRene17",
            "groups": [
                "ATD"
            ]
        },
        "Bonkoungou": {
            "login": "Bonkoungou",
            "password": "JosBonk17",
            "groups": [
                "ATD"
            ]
        },
        "Blunschi": {
            "login": "Blunschi",
            "password": "MarBlun17",
            "groups": [
                "ATD"
            ]
        },
        "Hyacinth": {
            "login": "Hyacinth",
            "password": "CHEE4fine",
            "groups": [
                "ATD"
            ]
        }
    },
    import: function () {
        var obj = imporUsers.data;


        var str = ""
        for (var key in obj) {
            var user = obj[key]
            str += user.login + "\t" + user.password + "\n"

        }

        console.log(str)

    }
}
module.exports=imporUsers;
imporUsers.import()
