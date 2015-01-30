# ElevatorSaga solution by Scott Morris

This is my solution to Elevator Saga at http://play.elevatorsaga.com/

## Constants / Settings
The program "constants" are stored in the `settings` object.

| Property | Defaults to | Definition |
| -------- | ----------- | ---------- |
| `DEBUG` | true | `boolean` flag determining whether debugging is turned on |
| `DEBUG_ELEMENTS.ELEVATORS` | `[]` _(empty array)_ | array determining which elevators to track when the `DEBUG` flag is set. To track all, leave the array blank. To track none, populate with `[-1]` |
| `DEBUG_ELEMENTS.FLOORS` | `[]` _(empty array)_ | array determining which floors to track when the `DEBUG` flag is set. To track all, leave the array blank. To track none, populate with `[-1]` |
| `FULL` | `0.7` | The max `loadFactor()` for a given elevator that will stop for a floor that isn't internally pressed |
| `BOTTOM_FLOOR` | `0` | The bottom floor |
| `TOP_FLOOR` | `floors.length - 1` | The top floor, derived by the `floors` array size |
| `NUM_ELEVATORS` | `elevators.length - 1` | The number of elevators, derived by the `elevators` array size |

********************************************************************************
## Helper Functions

********************************************************************************
#### Function `callAvailableElevator(floorNum, direction)`
| Parameters | Type | Description |
| ---------- | ---- | ----------- |
| `floorNum` | _integer_ | floor to attempt to call the elevator to |
| `direction` | _string_ `up` or `down` | the direction of the request |

##### Function Description
todo

##### Returns: `object`
```
{
    elevator,
    callStatus,
    bestAvailability,
    elevatorCalled
}
```

| Element | Type | Description |
| ------- | ---- | ----------- |
| `elevator` | | |
| `callStatus` | | |
| `bestAvailability` | | |
| `elevatorCalled` | | |

********************************************************************************
#### Function `floorsWaiting()`
##### Function Description
todo

##### Returns `object`
```
{
    queue,
    bottomUp,
    topDown,
    noneWaiting
}
```
| Element | Type | Description |
| ------- | ---- | ----------- |
| `queue` | _object_ | |
| `bottomUp` | _integer_  | |
| `topDown` | _integer_ | |
| `noneWaiting` | _boolean_ | |

********************************************************************************
#### Function `elevatorStatus()`
##### Function Description
todo

##### Returns `array` of `elevator.debugStatus()`

********************************************************************************
#### Function `debugStatus(message, [obj])`
| Parameters | Type | Description |
| ---------- | ---- | ----------- |
| `message` | _string_ | Debug message to be down in the console |
| `obj` | _object_, either an `elevator` or `floor` | Given the elevator or floor, show the debug message with relevant context based on the object's `statusText()` function |

##### Function Description
todo

##### Returns `object`
```
{
    floors,
    elevators
}
```
| Element | Type | Description |
| ------- | ---- | ----------- |
| `floors` | | |
| `elevators` | | |

********************************************************************************
#### Function `closerFloor(startFloor, option1, option2)`
| Parameters | Type | Description |
| ---------- | ---- | ----------- |
| `startFloor` | _integer_ | The floor to compare, usually the current floor |
| `option1` | _integer_ | The first option of floors to compare |
| `option2` | _integer_ | The second option of floors to compare |

##### Function Description
todo

##### Returns `integer`
Returns the closer of the two options to the `startFloor`

| `closerFloor` | `startFloor`: current floor; `option1`: the first floor to compare; `option2`: the second floor to compare | **TODO** | `integer` for the closer floor number |

********************************************************************************
## Elevators
Each elevator operates independently, without a master queue.

### Properties
| Property | Definition |
| -------- | ---------- |

********************************************************************************
### Functions
********************************************************************************
#### Function `functionName(arg1, arg2)`
| Parameters | Type | Description |
| ---------- | ---- | ----------- |
| `arg1` | `type` | todo |
| `arg2` | `type` | todo |

##### Function Description
##### Returns `todo`
| Element | Type | Description |
| ------- | ---- | ----------- |

### Events
********************************************************************************
#### Event `todo`
##### Event Parameters: `todo`
##### Event Description
##### Function Description

********************************************************************************
## Floors

### Custom Properties
| Property | Definition |
| -------- | ---------- |
| `floor.objType` | set to `"floor"` |
| `floor.index` | set to the `floor_index` to enssure that a floor can be referenced from the array object |

********************************************************************************
### Functions
********************************************************************************
#### Function `floor.statusText()`
##### Function Description
generates a short string description of the floor to be used in debugging

##### Returns `string`
- `[F#^v]` where `#` is the floor number and the following 2 digits display whether the up and down button have been pressed
- If the up or down buttons are not pressed, those digits will be replaced with an underscore `_`

********************************************************************************
#### Function `floor.upPressed()`
##### Function Description
returns whether `floor.buttonStates.up` is populated

##### Returns `boolean`

********************************************************************************
#### Function `floor.downPressed()`
##### Function Description
returns whether `floor.buttonStates.down` is populated

##### Returns `boolean`

********************************************************************************
### Events
********************************************************************************
#### Event `up_button_pressed`
##### Event Parameters: `none`
##### Event Description
Triggered when someone has pressed the up button at a floor. Note that passengers will press the button again if they fail to enter an elevator.

##### Function Description
Attempts to request an elevator to come to this floor based on availability or current destination

********************************************************************************
#### Event `down_button_pressed`
##### Event Parameters: `none`
##### Event Description
Triggered when someone has pressed the down button at a floor. Note that passengers will press the button again if they fail to enter an elevator.

##### Function Description
Attempts to request an elevator to come to this floor based on availability or current destination

********************************************************************************
## Base Code Template
Each time I refactored the code, I tried to start with a common base

```javascript
{
    init: function(elevators, floors) {
        // "Constants" =========================================================
        var settings = {
            FULL: 4,
            BOTTOM_FLOOR: 0,
            TOP_FLOOR: floors.length - 1,
            NUM_ELEVATORS: elevators.length - 1
        };

        // Elevator Code =======================================================
        elevators.forEach(function(elevator, elevator_index) {
            /** Elevator Properties ********************************************
             *  - goToFloor(floorNum, [force])
             *  - stop()
             *  - currentFloor()
             *  - goingUpIndicator([set])
             *  - goingDownIndicator([set])
             *  - loadFactor()
             *  - destinationQueue
             *  - checkDestinationQueue()
             *
             * UNDOCUMENTED FUNCTIONS
             *  - getPressedFloors()
             ******************************************************************/

            // Elevator Events -------------------------------------------------
            elevator.on("idle", function() {
                // Triggered when the elevator has completed all its tasks and is not doing anything.
            });
            elevator.on("floor_button_pressed", function(floorNum) {
                // Triggered when a passenger has pressed a button inside the elevator.
            });
            elevator.on("passing_floor", function(floorNum, direction) {
                // Triggered slightly before the elevator will pass a floor. A good time to decide 
                // whether to stop at that floor. Note that this event is not triggered for the 
                // destination floor. Direction is either "up" or "down".
            });
            elevator.on("stopped_at_floor", function(floorNum) {
                // Triggered when the elevator has arrived at a floor.
            });
        });
        
        // Floor Code ==========================================================
        floors.forEach(function(floor, floor_index) {
            /** Elevator Properties ********************************************
             *  - floorNum()
             *
             * UNDOCUMENTED PROPERTIES
             *  - buttonStates { down: "" , up: "" }
             ******************************************************************/
            
            // Floor Events ----------------------------------------------------
            floor.on("up_button_pressed", function() {
                // Triggered when someone has pressed the up button at a floor. 
                // Note that passengers will press the button again if they fail to enter an elevator.
            });
            floor.on("down_button_pressed", function() {
                // Triggered when someone has pressed the down button at a floor. 
                // Note that passengers will press the button again if they fail to enter an elevator.
            });
        });
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
```