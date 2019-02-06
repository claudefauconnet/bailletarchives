var util=(function(){
    var self={};

self.dateToStringFR=function(date){
    var str=""
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

    return self;

})()