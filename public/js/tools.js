var tools = (function () {
    var self = {}


    self.init = function () {
        var toolnames = Object.keys(config.tools);
        mainController.fillSelectOptions("toolsSelect", toolnames, true);
    }



    self.execTool=function(toolName){
        var tool=config.tools[toolName];

        if(tool && tool.htmlPage){
            $("#dialog3Div").dialog("open");
            $("#dialog3Div").attr("title",toolName);
            $("#dialog3Div").load("./htmlSnippets/"+tool.htmlPage),function(){

            }


        }






    }


    return self;
})()