const { Exportable, ExportableConfig, FC } = require("./extripo");

module.exports = { Exportable, ExportableConfig, FC}

if(false)(function(){
    var exportsCtx = null
    if (typeof module !== 'undefined') {
        exportsCtx = module.exports
    } else {
        exportsCtx = window
    }
    exportsCtx.Exportable = Exportable
    exportsCtx.ExportableConfig = ExportableConfig
    exportsCtx.FC = FC
})()