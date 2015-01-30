# ElevatorSaga solution by Scott Morris

This is my solution to Elevator Saga at http://play.elevatorsaga.com/

## Code Logic
### Constants / Settings
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

### Helper Functions
| Function | Parameter(s) | Description | Returns |
| -------- | ------------ | ----------- | ------- |
| `callAvailableElevator` |
- `floorNum`
- `direction` 
| *TODO* |
```
{
    elevator: bestElevator,
    callStatus: bestElevatorStatus,
    bestAvailability: bestAvailability,
    elevatorCalled: elevatorCalled
}
``` |

### Elevators
Each elevator operates independently, without a master queue.

#### Properties

#### Functions
| Function | Parameter(s) | Description | Returns |
| -------- | ------------ | ----------- | ------- |

#### Events
| Event | Parameter(s) | Event Description | Logic Description |
| ----- | ------------ | ----------------- | ----------------- |

### Floors

#### Custom Properties
| Property | Definition |
| -------- | ---------- |
| `floor.objType` | set to `"floor"` |
| `floor.index` | set to the `floor_index` to enssure that a floor can be referenced from the array object |

#### Functions
| Function | Parameter(s) | Description | Returns |
| -------- | ------------ | ----------- | ------- |
| `floor.statusText()` | none | generates a short string description of the floor to be used in debugging | `[F#^]` when going up, `[F#v]` when going down, `[F#_]` when no direction, where `#` is the floor number |
| `floor.upPressed()` | none | returns whether `floor.buttonStates.up` is populated | `boolean` |
| `floor.downPressed()` | none | returns whether `floor.buttonStates.down` is populated | `boolean` |

#### Events
| Event | Parameter(s) | Event Description | Logic Description |
| ----- | ------------ | ----------------- | ----------------- |
| `up_button_pressed` | none | Triggered when someone has pressed the up button at a floor. Note that passengers will press the button again if they fail to enter an elevator. | Attempts to request an elevator to come to this floor based on availability or current destination |
| `down_button_pressed` | none | Triggered when someone has pressed the down button at a floor. Note that passengers will press the button again if they fail to enter an elevator. | Attempts to request an elevator to come to this floor based on availability or current destination |

## Base Code
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