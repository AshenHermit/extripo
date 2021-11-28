# Extripo
A js module for serialization of class instances.  
It has no dependencies.

## It's all about data serialization.  
This small module provides a class `Exportable`, with which you can make some data class, add in it some fields, arrays, dictionaries, containing also instances of other classes and export an instance of that class into a simple nested dictionary, or import that dictionary and get full featured class instance with data that you imported.   

## Installation
With npm:
```
npm i extripo
or
npm i https://github.com/AshenHermit/extripo.git
```
Or you can use minified script `out/extripo.min.js`
```html
<script src="https://raw.githubusercontent.com/AshenHermit/extripo/master/out/extripo.min.js"></script>
```

## Usage
<table>
<tr>
<td> 

**We write data classes with some methods, and want them to be exportable/importable.**  

</td>
<td> 

**So we extend `Exportable` class and do some configuration of fields**

</td>
</tr>
<tr>
<td>

```javascript
class Room{
    constructor(area){
        this.settler = null // instance of "Person"
        this.furniture = {} // instances of "Furniture"
        this.complaints = [] // instances of "Complaint"
        this.tmpPrice = 0 // do not export
        this.area = area
    }
    isOccupied(){
        return this.settler != null
    }
    calculatePrice(){
        this.tmpPrice = this.area * 4
        if(this.isOccupied()) this.tmpPrice *= 9999
        return this.tmpPrice
    }
}
class Complaint{
    constructor(message){
        this.message = message
    }
    printMessage(){
        console.log("complaint message: " + this.message)
    }
}
class Person{name=""}
class Furniture{type=""}
```

</td>
<td> 

```javascript
const { Exportable, FC } = require("./src");

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
        this.tmpPrice = this.area * 4
        if(this.isOccupied()) this.tmpPrice *= 9999
        return this.tmpPrice
    }
}
class Complaint extends Exportable{
    constructor(message){
        super()
        this.message = message
    }
    printMessage(){
        console.log("complaint message: " + this.message)
    }
}
class Person extends Exportable{name=""}
class Furniture extends Exportable{type=""}
```

</td>
</tr>
</table>

Now we can call exportData or importData on instances of our classes.  
Let's check if everything works.

```javascript
// instancing room and some fields
var room = new Room(3, false) 
room.settler = new Person(); 
room.settler.name = "pillow fan";
room.furniture["le_rock"] = new Furniture()
room.complaints.push(new Complaint("le_rock is too comfortable"))

// checking methods
console.log(room.calculatePrice()) // 119988
room.complaints[0].printMessage() // complaint message: le_rock is too comfortable

// exporting room into a dictionary
var data = room.exportData()
console.log(data) // {settler: {…}, furniture: {…}, complaints: Array(1), area: 3}
console.log(JSON.stringify(data)) // {"settler":{"name":"pillow fan"},"furniture":{"le_rock": ...

// creating instance from dictionary
var newRoom = Room.create(data)
// checking methods
console.log(newRoom.calculatePrice()) // 119988
newRoom.complaints[0].printMessage() // complaint message: le_rock is too comfortable
// ok everything works
```

The ways to export:
```javascript
var data = room.exportData()
var jsonString = room.exportJSON()
```

The ways to import:
```javascript
var room = Room.create(data)
var room = Room.createFromJSON(jsonString)
var room = new Room().importData(data)
var room = new Room().importJSON(jsonString)
```

You can also deep copy an instance:
```javascript
var roomCopy = room.copy()
```

If you want to do some initialization step after importing the data or some output data processing, you can do something like this:

```javascript
class ComplicatedThing extends Exportable{
    constructor(area){
        super()
        /* fields */
        this.initialize()
    }
    initialize(){/* ... */}
    processExportData(data){/* ... */}

    importData(data){
        super.importData(data)
        this.initialize()
        return this
    }
    exportData(){
        var data = super.exportData()
        data = this.processExportData(data)
        return data
    }
}
```