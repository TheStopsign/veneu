# Welcome to the Style Guide for Venue

First, Try and follow the styles in the current file, if not listed here

# JavaScript Files

Functions, if statements, and anything else that uses brackets should be declared and used like this:

```
   foo(){
       //stuff
   }
```

Not:

```
    foo()
    {
        //stuff
    }
```

Variables should be camel cased, AKA the first letter should not be capitalized, with the begining of words then capitalized
ex: varRandom

Imports should be initally capitalized with camel case, AKA the first letter should be capitalized, with the begining of words then capitalized
ex: CamelCase

# Vue Files

Elements should be on opened and closed on the same indentation, with nested elements another tab out

```
    <element>
        <foo>
        </foo>
    </element>
```

not

```
    <element>
    <foo>
        </foo>
        <\element>
```

If an element has multiple properties, the properties should be tabbed out to mantain style and readability

```
    <element
    color = "color"
    font = "big"
    >
    </element>
```

not

```
    <element color = "color" font = "big">
    </element>
```

Any extra scipt or style for a vue page that is specific to that page should be added at the end of the elements code, not the beginning
