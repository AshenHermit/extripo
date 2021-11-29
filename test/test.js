var assert = require('assert');
const { Exportable, FC } = require("../src/index");
const { expect } = require('chai');

class Room extends Exportable{
    constructor(area){
        super()
        this.configFields({
            settler: FC.instanceOf(Person),
            furniture: FC.dictOf(Furniture),
            complaints: FC.arrayOf(Complaint),
            tmpPrice: FC.ignore()
        })
        this.settler = null
        this.furniture = {}
        this.complaints = []
        this.tmpPrice = 0
        this.area = area
    }
    isOccupied(){
        return this.settler != null
    }
    calculatePrice(){
        this.tmpPrice = this.area
        return this.tmpPrice
    }

    static validate(object, text=""){
        it(text+" : validating class instance", ()=>{
            assert.equal(typeof object, "object", "valid element type")
            assert.ok(object.__export_config, "still exportable : has config")
            assert.ok(object.importData, "still exportable : has importData method")
            assert.equal(typeof object.area, "number", "field is valid")
            assert.ok(object.isOccupied, "has expected method isOccupied")
            assert.ok(object.calculatePrice, "has expected method calculatePrice")
            assert.equal(object.calculatePrice(), object.area, "method works")
        })
    }
    static validateData(data, text=""){
        it(text+" : validating exported data", ()=>{
            assert.ok(!data.__export_config, "not exportable : has no config")
            assert.ok(!data.importData, "not exportable : has no importData method")
            assert.ok(!data.isOccupied, "has no method")
            assert.ok(!data.calculatePrice, "has no method")
            assert.equal(typeof data.area, "number", "field is valid")
            assert.equal(data.tmpPrice, undefined, "has no ignored field")
        })
    }
}
class Complaint extends Exportable{
    constructor(message){
        super()
        this.message = message
    }
    getMessage(){
        return this.message
    }
}
class Person extends Exportable{name=""}
class Furniture extends Exportable{type=""}

function nullArgTest(func, ...nullArgs){
    it("should return null with args: "+JSON.stringify(nullArgs.map(x=>!!x ? typeof x : null )), ()=>{
        assert.equal(func(...nullArgs), null, "return value is null")
    })
}

function nullArgReturnTest(func, argType, expectReturn, ...nullArgs){
    it(`with null ${argType} arg shuld return raw data`, ()=>{
        expect(func(...nullArgs)).to.eql(expectReturn)
    })
}

describe("Exportable", ()=>{
    var room = new Room(16)
    var roomData = {"settler":null,"furniture":{},"complaints":[],"area":16}

    describe("#exportArray", ()=>{
        nullArgTest(Exportable.exportArray, null)
        
        var array = Exportable.exportArray([room, null])
        it("export data structure check", ()=>{
            expect(array).to.eql([roomData, null])
        })
    })
    describe("#importArray", ()=>{
        var rawData = [roomData, null]
        nullArgTest(Exportable.importArray, null)
        nullArgTest(Exportable.importArray, null, Room)
        nullArgReturnTest(Exportable.importArray, "class", rawData, rawData, null)
        
        var array = Exportable.importArray(rawData, Room)
        Room.validate(array[0], "element")
    })
    describe("#exportDict", ()=>{
        nullArgTest(Exportable.exportDict, null)

        var dict = Exportable.exportDict({a: room, b: null})
        it("export data structure check", ()=>{
            expect(dict).to.eql({a: roomData, b: null})
        })
    })
    describe("#importDict", ()=>{
        var rawData = {a: roomData, b: null}
        nullArgTest(Exportable.importDict, null)
        nullArgTest(Exportable.importDict, null, Room)
        nullArgReturnTest(Exportable.importDict, "class", rawData, rawData, null)

        var dict = Exportable.importDict(rawData, Room)
        Room.validate(dict["a"], "element")
    })

    // describe("#importDict", ()=>{
    //     var dict = Exportable.importDict({a: roomData, b: null}, Room)
    //     Room.validate(dict["a"], "element")
    // })
})