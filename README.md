# ElevatorSaga solution by Scott Morris

This is my solution to Elevator Saga at http://play.elevatorsaga.com/

For more information on the details of the code, see the /src/ directory. Source
code documentation was created using Markdox (http://cbou.github.io/markdox/)

## Base Code Template
Each time I refactored the code, I tried to start with a common base

```javascript
{
    init: function(elevators, floors) {
        // "Constants" =========================================================
        var settings = {
            ELEVATORS: {
                COUNT: elevators.length - 1,
                FULL: 0.7
            },
            FLOORS: {
                BOTTOM: 0,
                TOP: floors.length - 1
            },
            FULL: 4,
            BOTTOM_FLOOR: 0,
            TOP_FLOOR: floors.length - 1,
            NUM_ELEVATORS: elevators.length - 1
        };

        // Elevator Code =======================================================
        elevators.forEach(function(elevator, elevator_index) {
            /** Elevator Methods ***********************************************
             *  - goToFloor(floorNum, [force])
             *  - stop()
             *  - currentFloor()
             *  - goingUpIndicator([set])
             *  - goingDownIndicator([set])
             *  - loadFactor()
             *  - destinationQueue
             *  - checkDestinationQueue()
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
            /** Elevator Methods ***********************************************
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