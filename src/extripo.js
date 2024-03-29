//TODO: separating arrays, dicts and just instances is not object-oriented approach, need to refactor as soon as possible
//TODO: after fields configuration, check if arrayOf applied only to an array, and dictOf only to a dict

/**
 * @typedef {Object.<string, any>} Dict
 * @typedef {Object.<string, Exportable>} DictOfExportables
 */


function fieldTyperMaker(key){
    /**
     * @param {typeof Exportable|typeProvidingFunc} [type=null]
     * @returns {Dict} some config
     */
    return function(type=null){
        return {[key]: new TypeProvider(type)}
    }
}

/**
 * @callback typeProvidingFunc
 * @param {Dict} object
 * @param {String|Number} key
 * @returns {typeof Exportable} exportable type
 */

class TypeProvider{
    /**
     * @param {typeof Exportable|typeProvidingFunc} type 
     */
    constructor(type){
        /**@type {typeof Exportable|typeProvidingFunc}*/
        this.type = type
    }
    getType(object="", key=""){
        try{
            new this.type()
            return this.type
        }catch(e){
            return this.type(object, key)
        }
    }
}

var FC = {}
// TODO: reusing code
// actually this shit can be generated
/**
 * @function arrayOf
 * @param {typeof Exportable|typeProvidingFunc} [type=null]
 * @returns {Dict} some config
 */
FC.arrayOf = fieldTyperMaker("arrayOf")
/**
 * @function dictOf
 * @param {typeof Exportable} [type=null]
 * @returns {Dict} some config
 */
FC.dictOf = fieldTyperMaker("dictOf")
/**
 * @callback instanceOf
 * @param {typeof Exportable} [type=null]
 * @returns {Dict} some config
 */
FC.instanceOf = fieldTyperMaker("instanceOf")
/**
 * @function ignore
 * @returns {Dict} some configuration
 */
FC.ignore = function(){
    return {ignore: true}
}

class ExportableConfig{
    constructor(config_key="__export_config"){
        this.classes = {
            ofFields: {},
            inArray: {},
            inDict: {},
        }
        this.defaultFieldsToIgnore = [config_key]
        this.fieldsToIgnore = Array.from(this.defaultFieldsToIgnore)
    }

    /**
     * With this method you can specify classes of fields, arrays items and values of dictionaries
     * @param {{
     * ofFields: DictOfExportables, 
     * inArray: DictOfExportables, 
     * inDict: DictOfExportables 
     * }} classes 
     * @returns {ExportableConfig} this
     */
    specifyClasses(classes){
        if(!classes) return this
        Object.keys(classes).forEach(key=>{
            if(key in this.classes)
                Object.assign(this.classes[key], classes[key])
        })
        return this
    }

    /**
     * Works like `specifyClasses` and `ignoreFields` methods, but the use is more handy.
     * Use FT methods to configure fields
     * @param {Dict} fields
     * @returns {ExportableConfig} this
     * @example
     *  constructor(){
     *      super()
     *      this.configFields({someArray: FT.arrayOf(SomeClass), 
     *                          someDict: FT.dictOf(AnotherClass)})
     *  }
     */
    configFields(fields){
        Object.keys(fields).forEach((key)=>{
            var cf = fields[key]
            
            //TODO: maybe this is a bit immobile, i mean this keys: "dictOf", "arrayOf"...
            if(cf.dictOf) this.specifyClasses({inDict: {[key]: cf.dictOf}})
            if(cf.arrayOf) this.specifyClasses({inArray: {[key]: cf.arrayOf}})
            if(cf.instanceOf) this.specifyClasses({ofFields: {[key]: cf.instanceOf}})
            if(cf.ignore) this.ignoreFields([key])
        })
        return this
    }

    /**
     * With this method you can specify keys of fields you dont want to export
     * @param {Array.<String>} fieldsKeys 
     * @returns {ExportableConfig} this
     */
    ignoreFields(fieldsKeys){
        if(fieldsKeys){
            this.fieldsToIgnore = this.fieldsToIgnore.concat(fieldsKeys)
        }
        return this
    }

    infectWithSetters(object){
        var methods = [
            this.specifyClasses,
            this.ignoreFields,
            this.configFields]
        methods.forEach((x=>{
            object[x.name] = x.bind(this)
        }).bind(this))
    }
}

function convertToDict(object){
    //TODO: maybe there is a faster solution
    return JSON.parse(JSON.stringify(object))
}

function processContainerValue(processCb, container, value, key){
    var newVal = null
    if(value!=null) var newVal = processCb(container, value, key)
    if(newVal!==undefined){
        container[key] = newVal
    }
}
/** 
 * @callback dictProcessCb
 * @param {Dict} newDict
 * @param {any} value
 * @param {string} key
*/
/**
 * @param {Dict} dict
 * @param {dictProcessCb} processCb
 * @returns {Dict} new dict
 */
function processDict(dict, processCb){
    if(dict===null || dict===undefined) return null
    var newDict = Object.assign({}, dict)
    Object.keys(newDict).forEach(key => {
        processContainerValue(processCb, newDict, newDict[key], key)
    })
    return newDict
}
/** 
 * @callback arrayProcessCb
 * @param {Array} newArray
 * @param {Array} value
 * @param {Number} index
 */
/**
 * @param {Array} array
 * @param {arrayProcessCb} processCb
 * @returns {Array} new array
 */
function processArray(array, processCb){
    if(array===null || array===undefined) return null
    var newArray = Array.from(array)
    newArray.forEach((value, i)=>{
        processContainerValue(processCb, newArray, value, i)
    })
    return newArray
}

class Exportable{
    constructor(){
        this.__export_config = new ExportableConfig("__export_config")
        this.__export_config.infectWithSetters(this)
    }

    /**
     * With this method you can specify classes of arrays items, dict values and fields
     * @param {{
     * ofFields: DictOfExportables,
     * inArray: DictOfExportables, 
     * inDict: DictOfExportables 
     * }} classes 
     * @returns {ExportableConfig} config
     */
    specifyClasses(classes){
        this.__export_config.specifyClasses(classes)
    }
    /**
     * With this method you can specify keys of fields you dont want to export
     * @param {Array.<String>} fieldsKeys 
     * @returns {ExportableConfig} config 
     */
    ignoreFields(fieldsKeys){
        this.__export_config.ignoreFields(fieldsKeys)
    }
    /**
     * Works like `specifyClasses` and `ignoreFields` methods, but the use is more handy
     * @param {Dict} fields
     * @returns {ExportableConfig} config
     */
    configFields(fields){
        this.__export_config.configFields(fields)
    }


    //TODO: looks like code reusing
    static exportArray(arrayOfExportables){
        return processArray(arrayOfExportables, (rawArray, v, i)=>{
            if(v.exportData) rawArray[i] = v.exportData()
            return rawArray[i]
        })
    }
    /**
     * @param {TypeProvider} itemTypeProvider
     */
    static importArray(rawDataArray, itemTypeProvider){
        if(!itemTypeProvider) return rawDataArray
        return processArray(rawDataArray, (array, rawData, i)=>{
            var type = itemTypeProvider.getType(rawData, i)
            if(!type) return
            return new type().importData(rawData)
        })
    }
    static exportDict(dict){
        return processDict(dict, (rawDict, v, key)=>{
            if(v.exportData) rawDict[key] = v.exportData()
            return rawDict[key]
        })
    }
    /**
     * @param {TypeProvider} itemTypeProvider
     */
    static importDict(rawDictData, itemTypeProvider){
        if(!itemTypeProvider) return rawDictData
        return processDict(rawDictData, (dict, rawData, key)=>{
            var type = itemTypeProvider.getType(rawData, key)
            if(!type) return
            return new type().importData(rawData)
        })
    }

    /**
     * 
     * @param {Dict} [data={}] data to import
     * @param  {...any} constructorArgs 
     * @returns {Exportable} new instance with imported data
     */
    static create(data={}, ...constructorArgs){
        if(!data) return null
        var instance = new this.prototype.constructor(...constructorArgs)
        instance.importData(data)
        return instance
    }

    /**
     * 
     * @param {String} json A valid JSON string.
     * @param  {...any} constructorArgs 
     * @returns {Exportable} new instance with imported data
     */
    static createFromJSON(json, reviver, ...constructorArgs){
        var instance = new this.prototype.constructor(...constructorArgs)
        instance.importJSON(json)
        return instance
    }

    /**
     * 
     * @param  {...any} constructorArgs 
     * @returns {Exportable}
     */
    copy(...constructorArgs){
        var data = this.exportData()
        var instance = new this.__proto__.constructor(...constructorArgs)
        instance.importData(data)
        return instance
    }

    /**
     * Fills fields, nested arrays and dicts values with instances of specified classes
     * @param {Dict} data
     * @returns {Exportable} this
     */
    importData(data){
        if(!data) return this
        
        data = Object.assign({}, data)
        var cf = this.__export_config

        if(cf.fieldsToIgnore!=null){
            cf.fieldsToIgnore.forEach(propertyKey=>{
                if(propertyKey!=null) delete data[propertyKey]
            })
        }

        Object.assign(this, data)
        
        // looks like reusing code, but it's not quite so,
        // anyway, TODO:
        if(cf.classes.inArray!=null)
        Object.keys(cf.classes.inArray).forEach(arrayKey=>{
            if(arrayKey in data)
            this[arrayKey] = Exportable.importArray(data[arrayKey], cf.classes.inArray[arrayKey])
        })
        
        if(cf.classes.inDict!=null)
        Object.keys(cf.classes.inDict).forEach(dictKey=>{
            if(dictKey in data)
            this[dictKey] = Exportable.importDict(data[dictKey], cf.classes.inDict[dictKey])
        })

        if(cf.classes.ofFields!=null)
        Object.keys(cf.classes.ofFields).forEach(fieldKey=>{
            if(data[fieldKey]===null || data[fieldKey]===undefined){
                this[fieldKey] = data[fieldKey]
                return
            }
            if(fieldKey in data)
            var type = cf.classes.ofFields[fieldKey].getType()
            this[fieldKey] = new type().importData(data[fieldKey])
        })
        
        return this
    }
    /**
     * @returns {Dict} exported version of a class
     */
    exportData(){
        var rawData = convertToDict(this)
        var cf = this.__export_config
        
        Object.keys(rawData).forEach(key=>{
            if(cf.fieldsToIgnore.indexOf(key)!=-1) return
            if(rawData[key]===null || rawData[key]===undefined) return

            if(this[key].exportData){
                rawData[key] = this[key].exportData()
            }
            else if(Array.isArray(this[key])){
                rawData[key] = Exportable.exportArray(this[key])
            }
            else if(typeof this[key] == "object"){
                rawData[key] = Exportable.exportDict(this[key])
            }
        })

        if(cf.fieldsToIgnore!=null){
            cf.fieldsToIgnore.forEach(key=>{
                if(key!=null){
                    delete rawData[key]
                }
            })
        }

        return rawData
    }

    /**
     * @param {Function} replacer A function that transforms the results. Or array of strings and numbers. Check [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) method.
     * @param {Number} space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
     * @returns {String} json formatted data
     */
    exportJSON(replacer=null, space=null){
        var data = this.exportData()
        var json = JSON.stringify(data, replacer, space)
        return json
    }

    /**
     * @param {String} json A valid JSON string.
     * @returns {Exportable} return value from this.importData, probably "this".
     */
    importJSON(json){
        if(!json) return null
        var data = JSON.parse(json)
        var importedObj = this.importData(data)
        return importedObj
    }
}

exports.Exportable = Exportable
exports.ExportableConfig = ExportableConfig
exports.TypeProvider = TypeProvider
exports.FC = FC