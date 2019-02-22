var util = (function () {
    var self = {};

    self.dateToStringFR = function (date) {
        var str = ""
        if (date instanceof Date && isFinite(date)) {
            var month = "" + date.getMonth();
            month = month.length == 2 ? "" + month : "0" + month;
            var day = "" + date.getDate();
            day = day.length == 2 ? "" + day : "0" + day;
            str = date.getFullYear() + "/" + month + "/" + day;
        }
        else
            str = "";
        return str
    }

    self.dateToMariaDBString = function (date) {
        var str = ""
        if (date instanceof Date && isFinite(date)) {
            var month = "" + date.getMonth()+1;
            var day = "" + date.getDate();
            str = date.getFullYear() + "-" + month + "-" + day;
        }
        else
            str = "";
        return str
    }

    self.longDateStrToShortDateStr = function (dateStr) {// 2019-02-02T23:00:00.000Z to 2019-01-02 (mois -1)
        dateStr = dateStr.substring(0, dateStr.indexOf("T"));
        var array = dateStr.split("-")
        var str = ""
        var month = parseInt(array[1])
        var day = parseInt(array[2])
        str = array[0] + "-" + month + "-" + day;
        return str;

    }


    return self;

})()