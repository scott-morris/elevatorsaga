{
    init: function(elevators, floors) {
        // "Constants" =========================================================
        var settings = {
            DEBUG: true,
            FULL: 4,
            BOTTOM_FLOOR: 0,
            TOP_FLOOR: floors.length - 1,
            NUM_ELEVATORS: elevators.length - 1
        };

        var initBreak = false;

        // Helper Functions ====================================================
        var callAvailableElevator = function(floorNum, direction) {
            var bestElevator = -1,
                bestAvailablility = -1,
                bestElevatorStatus = {};

            // Check All Elevators
            elevators.forEach(function(elevator, eidx) {
                var availability = elevator.available(floorNum, direction);

                if (availability > bestAvailablility) {
                    bestElevator = eidx;
                    bestAvailablility = availability;
                }
            });

            if ((bestElevator > -1) && (bestElevatorStatus > 0)) {
                bestElevatorStatus = elevators[bestElevator].goTo(floorNum, direction);
            }
                
            return {
                elevator: bestElevator,
                callStatus: bestElevatorStatus
            };
        };

        var floorsWaiting = function() {
            var queue = {
                    up: [],
                    down: []
                },
                bottomUp = -1,
                topDown = -1,
                noneWaiting = true;

            // Check All Floors
            floors.forEach(function(floor, fidx) {
                if (floor.buttonStates.up !== "") {
                    queue.up.push(fidx);
                    noneWaiting = false;
                    bottomUp = (bottomUp === -1)
                        ? fidx
                        : bottomUp;
                }

                if (floor.buttonStates.down !== "") {
                    queue.down.push(fidx);
                    noneWaiting = false;
                    topDown = fidx;
                }
            });

            return {
                queue: queue,
                bottomUp: bottomUp,
                topDown: topDown,
                noneWaiting: noneWaiting
            };
        };

        var elevatorsStatus = function() {
            var _elevators = [];

            elevators.forEach(function(elevator, eidx) {
                var _e = {
                    index: eidx,
                    goingTo: elevator.goingTo,
                    direction: elevator.direction(),
                    queue: elevator.destinationQueue,
                    buttons: elevator.getPressedFloors()
                };

                _elevators.push(_e);
            });

            return _elevators;
        };

        var debugStatus = function(message) {
            var status = {
                floors: floorsWaiting(),
                elevators: elevatorsStatus()
            };

            if (arguments.length > 0) {
                console.log(message, status);
            } else {
                console.log(status);
            }

            return status;
        };

        var closerFloor = function(startFloor, option1, option2) {
            return (Math.abs(startFloor - option1) < Math.abs(startFloor - option2))
                ? option1
                : option2;
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

            // Custom Elevator Properties --------------------------------------
            elevator.goingTo = -1;

            // Custom Elevator Functions ---------------------------------------
            elevator.direction = function(dir) {
                switch (dir) {
                    case "up":
                        elevator.goingUpIndicator(true);
                        elevator.goingDownIndicator(false);
                        break;
                    case "down":
                        elevator.goingDownIndicator(true);
                        elevator.goingUpIndicator(false);
                        break;
                    case "clear":
                        elevator.goingUpIndicator(false);
                        elevator.goingDownIndicator(false);
                        break;
                }

                // Return the direction equivalent based on what indicators are lit
                if ((elevator.goingUpIndicator()) && (!elevator.goingDownIndicator())) {
                    return "up";
                } else if ((!elevator.goingUpIndicator()) && (elevator.goingDownIndicator())) {
                    return "down";
                } else {
                    return "";
                }
            };

            elevator.statusText = function() {
                return "Elevator " + elevator_index + " [F" + elevator.currentFloor() + "]";
            };

            elevator.available = function(floorNum, direction) {
                /* Returns a weighted availability
                 *    2 : elevator already on its way
                 *    1 : idle, feel free
                 *    0 : busy, but might be going past
                 *   -1 : going the other way past this floor, not available
                 */

                // If the elevator is heading to this floor, it's the best candidate
                if (elevator.goingTo === floorNum) {
                    return 2;
                }

                // If the elevator is idle, it is available for use
                if ((elevator.destinationQueue.length === 0) && (elevator.getPressedFloors().length === 0)) {
                    return 1;
                }

                // If the elevator is going past in the other direction, it's not available right now
                if ((elevator.direction === "up" && direction === "down" && elevator.goingTo > floorNum) ||
                   (elevator.direction === "down" && direction === "up" && elevator.goingTo < floorNum)) {
                    
                    return -1;
                }

                // If the elevator is already full, don't take another assignment
                if (elevator.loadFactor() >= settings.FULL) {
                    return -1;
                }

                return 0;
            };

            elevator.goTo = function(floorNum, direction, forceStop) {
                if (arguments.length < 3) { forceStop = false; }

                // If direction not specified
                if (arguments.length == 1) {
                    direction = (floorNum < elevator.currentFloor())
                        ? "down"
                        : "up";
                }

                if (direction === "up") {
                    return elevator.goUp(floorNum, forceStop);
                } else {
                    return elevator.goDown(floorNum, forceStop);
                }
            };

            elevator.goUp = function(floorNum, forceStop) {
                if ((floorNum === elevator.currentFloor()) && (elevator.destinationQueue.indexOf(floorNum) > -1)) {
                    return {
                        success: false,
                        status: "same floor",
                        direction: "up"
                    };
                }

                if ((floorNum === -1) || (floorNum > settings.TOP_FLOOR)) {
                    return {
                        success: false,
                        status: "invalid floor: " + floorNum,
                        direction: "up"
                    };
                }

                if (arguments.length === 0) {
                    return {
                        success: false,
                        status: "no floorNum",
                        direction: "up"
                    };
                }

                if ((elevator.destinationQueue.length > 0) && (floorNum < elevator.destinationQueue[0])) {
                    return {
                        success: false,
                        status: "backtrack",
                        direction: "up"
                    }
                }
                
                // Set Elevator Status
                elevator.direction("up");
                elevator.goingTo = (floorNum > elevator.goingTo)
                    ? floorNum
                    : elevator.goingTo;

                // Move the Elevator
                if (arguments.length === 1) {
                    // Add the floor and sort it to make sure we stop in order
                    elevator.goToFloor(floorNum);
                    elevator.destinationQueue.sort();
                    elevator.checkDestinationQueue();
                } else if (forceStop) {
                    elevator.goToFloor(floorNum, forceStop);
                }

                return {
                    success: true,
                    status: "moved",
                    direction: "up"
                };
            };

            elevator.goDown = function(floorNum, forceStop) {
                if ((floorNum === elevator.currentFloor()) && (elevator.destinationQueue.indexOf(floorNum) > -1)) {
                    return {
                        success: false,
                        status: "same floor",
                        direction: "down"
                    };
                }

                if ((floorNum === -1) || (floorNum > settings.TOP_FLOOR)) {
                    return {
                        success: false,
                        status: "invalid floor: " + floorNum,
                        direction: "down"
                    };
                }

                if (arguments.length === 0) {
                    return {
                        success: false,
                        status: "no floorNum",
                        direction: "down"
                    };
                }

                if ((elevator.destinationQueue.length > 0) && (floorNum > elevator.destinationQueue[0])) {
                    return {
                        success: false,
                        status: "backtrack",
                        direction: "down"
                    }
                }
                
                // Set Elevator Status
                elevator.direction("down");
                elevator.goingTo = (elevator.goingTo === -1 || floorNum < elevator.goingTo)
                    ? floorNum
                    : elevator.goingTo;

                // Move the Elevator
                if (floorNum) {
                    if (arguments.length === 1) {
                        // Add the floor and sort so we stop in order
                        elevator.goToFloor(floorNum);
                        elevator.destinationQueue.sort();
                        elevator.destinationQueue.reverse();
                        elevator.checkDestinationQueue();
                    } else {
                        elevator.goToFloor(floorNum, forceStop);
                    }
                }

                return {
                    success: true,
                    status: "moved",
                    direction: "down"
                };
            };

            // Elevator Events -------------------------------------------------
            elevator.on("idle", function() {
                // Debugger - Allow for Breakpoints
                if ((settings.DEBUG) && (!initBreak)) {
                    debugger;
                    initBreak = true;
                    console.clear();
                }

                var waiting = floorsWaiting(),
                    moveStatus = {},
                    debugMsg = elevator.statusText() + " - Idle";

                // Check to see if there are still active buttons
                if (elevator.getPressedFloors().length > 0) {
                    elevator.destinationQueue = elevator.getPressedFloors();
                    if (elevator.direction === "down") {
                        elevator.destinationQueue.reverse();
                    }
                    elevator.checkDestinationQueue();
                    debugMsg += ", still has pressed floors, refreshed queue";
                }

                // Check to see if someone is on the elevator and needs to press a button
                else if (elevator.loadFactor() > 0) {
                    debugMsg += ", loadFactor == " + elevator.loadFactor() + " (>0), not truly idle";
                }
                
                // If nothing is waiting, wait for now
                else if (waiting.noneWaiting) {
                    debugMsg += ", waiting queue is empty";
                    
                }

                // If both the upQueue and downQueue are waiting, go to the closer floor
                else if ((waiting.bottomUp > -1) && (waiting.topDown > -1)) {
                    var closer = closerFloor(elevator.currentFloor(), waiting.bottomUp, waiting.topDown);

                    debugMsg += ", upQueue and downQueue both waiting"

                    if (closer === waiting.bottomUp) {
                        debugMsg += ", going up from " + waiting.bottomUp;
                        moveStatus = elevator.goUp(closer);
                    } else {
                        debugMsg += ", going down from " + waiting.topDown;
                        moveStatus = elevator.goDown(closer);
                    }
                }

                // If only the upQueue is waiting, go to the first (bottom) 
                else if (waiting.bottomUp > -1) {
                    debugMsg += ", going up from " + waiting.bottomUp;
                    moveStatus = elevator.goUp(waiting.bottomUp);
                } 

                // If only the downQueue is waiting, go to the first (top)
                else if (waiting.topDown > -1) {
                    debugMsg += ", going down from " + waiting.topDown;
                    moveStatus = elevator.goDown(waiting.topDown);
                }

                else {
                    debugMsg += ", no logic criteria met."
                    if (settings.DEBUG) {
                        debugger;
                    }
                }

                // Debug Messaging
                if (settings.DEBUG) {
                    if ((moveStatus.hasOwnProperty("success")) && (moveStatus.success === false)) {
                        debugMsg += ", move failed: " + moveStatus.status;
                    }

                    debugStatus(debugMsg);
                }
            });
            elevator.on("floor_button_pressed", function(floorNum) {
                // Triggered when a passenger has pressed a button inside the elevator.
                var callStatus = elevator.goTo(floorNum, elevator.direction),
                    debugMsg = elevator.statusText() + " - Button " + floorNum + " pressed";

                if (settings.DEBUG) { 
                    debugMsg += ", " + callStatus.status;
                    debugStatus(debugMsg);
                }
            });
            elevator.on("passing_floor", function(floorNum, direction) {
                // Triggered slightly before the elevator will pass a floor. A good time to decide 
                // whether to stop at that floor. Note that this event is not triggered for the 
                // destination floor. Direction is either "up" or "down".
                var floor = floors[floorNum],
                    debugMsg = elevator.statusText() + " - Passing Floor " + floorNum + " going " + direction;

                // If the floor's request button is not lit, then we don't need to consider stopping
                if (((direction === "down") && (floor.buttonStates.down === "")) ||
                    ((direction === "up") && (floor.buttonStates.up === ""))) {

                    debugMsg += ", stop not requested";
                }

                // If the elevator is already going to stop here, then we don't need to do anything special
                else if (elevator.destinationQueue.indexOf(floorNum) > -1) {
                    debugMsg += ", elevator already planning to stop, index " + elevator.destinationQueue.indexOf(floorNum)
                }

                // If it's not in the queue, but for some reason the button is pressed in the elevator, stop
                else if (elevator.getPressedFloors().indexOf(floorNum)) {
                    elevator.goToFloor(floorNum, true);
                    debugMsg += ", elevator button pressed but not in queue, stopping here"
                }

                // Don't even think about stopping if you're on the way to a farther floor to go 
                // the opposite direction
                else if (direction !== elevator.direction) {
                    debugMsg += ", elevator going " + direction + " on the way to " + elevator.goingTo + ", going " + elevator.direction();
                }

                // If the elevator is almost full, do not make a special stop here. If it was going
                // to stop stop anyways, it will.
                else if (elevator.loadFactor() >= settings.FULL) {
                    debugMsg += ", loadFactor == " + elevator.loadFactor() + " (>" + settings.FULL + ")";
                }

                // If the floor light is lit in the same direction we are traveling, the elevator is
                // not already planning to stop here, and it's not too full, then stop along the way
                else if (((direction === "down") && (floor.buttonStates.down !== "")) ||
                         ((direction === "up") && (floor.buttonStates.up !== ""))) {
                    
                    elevator.goTo(floorNum, direction, true);
                    debugMsg += ", stopping here";
                }

                else {
                    debugMsg += ", no logic criteria met";
                }

                if (settings.DEBUG) {
                    debugStatus(debugMsg);
                }
            });
            elevator.on("stopped_at_floor", function(floorNum) {
                // Triggered when the elevator has arrived at a floor.
                // TODO: double check current status
                var debugMsg = elevator.statusText() + " - Stopped at Floor " + floorNum;

                // Remove this floor from the queue if it's there
                if (elevator.destinationQueue.length > 0) {
                    var index = elevator.destinationQueue.indexOf(floorNum);

                    if (index > -1) {
                        debugMsg += ", removing floor from destination queue [" + elevator.destinationQueue.join(", ") + "]";
                    }

                    while (index > -1) {
                        elevator.destinationQueue.splice(index, 1);
                        index = elevator.destinationQueue.indexOf(floorNum);
                    }
                    elevator.checkDestinationQueue();
                }

                if (settings.DEBUG) {
                    debugMsg += (floorNum !== elevator.goingTo) ? " on the way to " + elevator.goingTo : "";
                    debugStatus(debugMsg);
                }
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
                var available = callAvailableElevator(floor.floorNum(), "up"),
                    debugMsg = "Floor " + floor.floorNum() + " - Up button pressed";

                if (settings.DEBUG) { 
                    debugMsg += (available.elevator > -1)
                        ? ", requested Elevator " + available.elevator + ", " + available.callStatus.status
                        : ", no Elevator currently available";

                    debugStatus(debugMsg); 
                }
            });
            floor.on("down_button_pressed", function() {
                // Triggered when someone has pressed the down button at a floor. 
                // Note that passengers will press the button again if they fail to enter an elevator.
                var available = callAvailableElevator(floor.floorNum(), "down"),
                    debugMsg = "Floor " + floor.floorNum() + " - Down button pressed";

                if (settings.DEBUG) { 
                    debugMsg += (available.elevator > -1)
                        ? ", requested Elevator " + available.elevator + ", " + available.callStatus.status
                        : ", no Elevator currently available";

                    debugStatus(debugMsg); 
                }
            });
        });
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}