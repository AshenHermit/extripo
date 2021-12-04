var assert = require('assert');
const { expect } = require('chai');
const { TypeProvider, Exportable, FC } = require('../src/extripo');

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

    static validate(object, text="", useIt=true){
        var func = ()=>{
            assert.equal(typeof object, "object", "valid element type")
            assert.ok(object.__export_config, "still exportable : has config")
            assert.ok(object.importData, "still exportable : has importData method")
            assert.equal(typeof object.area, "number", "field is valid")
            assert.ok(object.isOccupied, "has expected method isOccupied")
            assert.ok(object.calculatePrice, "has expected method calculatePrice")
            assert.equal(object.calculatePrice(), object.area, "method works")
        }
        if(useIt) it(text+" : validating class instance", func)
        else func()
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
    static validate(cmp, prefix=""){
        assert.ok(cmp.message, prefix+"has expected field")
        assert.equal(cmp.getMessage(), cmp.message, prefix+"method works")
    }
}
class Person extends Exportable{
    constructor(name=""){
        super()
        this.name = name
    }
}
class Furniture extends Exportable{
    constructor(type=""){
        super()
        this.type = type
    }
}

class DomElement extends Exportable{
    constructor(area){
        super()
        this.configFields({
            children: FC.arrayOf((child, i)=>{
                if(child.tag=="button") return ButtonClass
                else if(child.tag=="textarea") return TextareaClass
            }),

            // bad example, in this case the best way 
            // to implement this is to just make 
            // a new class with fields named like these keys
            properties: FC.dictOf((prop, key)=>{
                if(prop.tag=="button") return ButtonClass
                else if(prop.tag=="textarea") return TextareaClass
            })
        })
        this.children = []
        this.properties = {}
        this.tag = "div"
    }
}
class ButtonClass extends DomElement{
    constructor(){
        super()
        this.tag = "button"
    }
    click(){

    }
}
class TextareaClass extends DomElement{
    constructor(){
        super()
        this.tag = "textarea"
    }
    input(){

    }
}

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
    room.settler = new Person("guy")
    room.furniture["table"] = new Furniture("table")
    room.complaints.push(new Complaint("keke"))
    room.complaints.push(new Complaint("no"))
    var roomData = {"settler":{"name":"guy"},"furniture":{"table":{"type":"table"}},"complaints":[{"message":"keke"}, {"message":"no"}],"area":16}

    describe(".exportArray", ()=>{
        nullArgTest(Exportable.exportArray, null)
        
        var array = Exportable.exportArray([room, null])
        it("export data structure check", ()=>{
            expect(array).to.eql([roomData, null])
        })
    })
    describe(".importArray", ()=>{
        var rawData = [roomData, null]
        nullArgTest(Exportable.importArray, null)
        nullArgTest(Exportable.importArray, null, new TypeProvider(Room))
        nullArgReturnTest(Exportable.importArray, "class", rawData, rawData, null)
        
        var array = Exportable.importArray(rawData, new TypeProvider(Room))
        Room.validate(array[0], "element")

        it("type provider callback test", ()=>{
            var rawData = [roomData, null, new Complaint("keke")]
            var array = Exportable.importArray(rawData, new TypeProvider((object, i)=>{
                if(object.settler !== undefined) return Room
                else return Complaint
            }))
            Room.validate(array[0], "element", false)
            assert.equal(array[1], null, "null element remains null")
            Complaint.validate(array[2])
        })
    })
    describe(".exportDict", ()=>{
        nullArgTest(Exportable.exportDict, null)

        var dict = Exportable.exportDict({a: room, b: null})
        it("export data structure check", ()=>{
            expect(dict).to.eql({a: roomData, b: null})
        })
    })
    describe(".importDict", ()=>{
        var rawData = {room: roomData, b: null}
        nullArgTest(Exportable.importDict, null)
        nullArgTest(Exportable.importDict, null, new TypeProvider(Room))
        nullArgReturnTest(Exportable.importDict, "class", rawData, rawData, null)

        var dict = Exportable.importDict(rawData, new TypeProvider(Room))
        Room.validate(dict["room"], "element")

        it("type provider callback test", ()=>{
            var rawData = {"room": roomData, "null": null, "complaint": new Complaint("keke")}
            var dict = Exportable.importDict(rawData, new TypeProvider((object, i)=>{
                if(object.settler !== undefined) return Room
                else return Complaint
            }))
            Room.validate(dict["room"], "element", false)
            assert.equal(dict["null"], null, "null element remains null")
            Complaint.validate(dict["complaint"])
        })
    })

    describe(".exportData", ()=>{
        var data = room.exportData()
        it("export data structure check", ()=>{
            expect(data).to.eql(roomData)
        })
    })
    describe(".importData", ()=>{
        nullArgTest(new Room().importData, null)

        var newRoom = new Room().importData(roomData)

        Room.validate(newRoom, "instance")

        it("some inner instance is valid", ()=>{
            assert.ok(newRoom.complaints, "has expected array")
            assert.ok(newRoom.complaints.length == roomData.complaints.length, "array has expected size")
            newRoom.complaints.forEach((cmp, i)=>{
                var num = "["+i+"] "
                Complaint.validate(cmp, num)
            })
        })

        it("testing type providers", ()=>{
            // var el = new DomElement()
            // el.children.push(new TextareaClass())
            // el.children.push(new ButtonClass())
            // el.properties["button"] = new ButtonClass()
            // el.properties["textarea"] = new TextareaClass()
            var expectData = {"children":[{"children":[],"properties":{},"tag":"textarea"},{"children":[],"properties":{},"tag":"button"}],"properties":{"button":{"children":[],"properties":{},"tag":"button"},"textarea":{"children":[],"properties":{},"tag":"textarea"}},"tag":"div"}
            var el = new DomElement().importData(expectData)
            assert.ok(el.children[0].input, "first array element has expected method")
            assert.ok(el.children[1].click, "second array element has expected method")
            assert.ok(el.properties["textarea"].input, "one dict element has expected method")
            assert.ok(el.properties["button"].click, "another dict element has expected method")
        })
    })

    describe(".exportJSON", ()=>{
        var data = room.exportData()
        var dataJSON = room.exportJSON()
        it("compairing json stringified manually and from exportJSON", ()=>{
            assert.equal(JSON.stringify(data), dataJSON, "json strings are equal")
        })
    })
    describe(".importJSON", ()=>{
        var newRoom = new Room()
        nullArgTest(newRoom.importJSON.bind(newRoom), null)

        var expectedJSON =  JSON.stringify(roomData)
        var newRoom = room.importJSON(expectedJSON)
        var dataJSON = newRoom.exportJSON()

        it("compairing exported and imported json strings", ()=>{
            assert.equal(dataJSON, expectedJSON, "json strings are equal")
        })
    })
    describe(".create", ()=>{
        nullArgTest(Room.create.bind(Room), null)

        var expectedJSON = JSON.stringify(roomData)
        var newRoom = room.importJSON(expectedJSON)
        var dataJSON = newRoom.exportJSON()

        it("compairing exported and imported json strings", ()=>{
            assert.equal(dataJSON, expectedJSON, "json strings are equal")
        })
    })
    describe(".copy", ()=>{
        var expectedJSON = room.exportJSON()
        var dataJSON = room.copy().exportJSON()

        it("compairing json string before copy and after", ()=>{
            assert.equal(expectedJSON, dataJSON, "json strings are equal")
        })
    })
})