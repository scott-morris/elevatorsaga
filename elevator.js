{
    init: function(elevators, floors) {
        // "Constants" =========================================================
        var settings = {
            DEBUG: true,
            DEBUG_ELEMENTS: {
                ELEVATORS: [], // leave blank to debug all, set to -1 to hide all
                FLOORS: []     // leave blank to debug all, set to -1 to hide all
            },
            FULL: 4,
            BOTTOM_FLOOR: 0,
            TOP_FLOOR: floors.length - 1,
            NUM_ELEVATORS: elevators.length - 1
        };

        var initBreak = false;

        // Helper Functions ====================================================
        var callAvailableElevator = function(floorNum, direction) {
            var bestElevator = -1,
                bestAvailability = -1,
                bestElevatorStatus = {},
                elevatorCalled = false;

            // Check All Elevators
            elevators.forEach(function(elevator, eidx) {
                var availability = elevator.available(floorNum, direction);

                if (availability > bestAvailability) {
                    bestElevator = eidx;
                    bestAvailability = availability;
                }
            });

            // Only place a new call to the elevator if it is idle (status === 1)
            if ((bestElevator > -1) && (bestAvailability === 1)) {
                bestElevatorStatus = elevators[bestElevator].goTo(floorNum, direction);
                elevatorCalled = true;
            }
                
            return {
                elevator: bestElevator,
                callStatus: bestElevatorStatus,
                bestAvailability: bestAvailability,
                elevatorCalled: elevatorCalled
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
                if (floor.upPressed()) {
                    queue.up.push(fidx);
                    noneWaiting = false;
                    bottomUp = (bottomUp === -1)
                        ? fidx
                        : bottomUp;
                }

                if (floor.downPressed()) {
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

            elevators.forEach(function(e, i) {
                _elevators.push(e.debugStatus());
            });

            return _elevators;
        };

        var debugStatus = function(message, obj) {
            var status = {
                floors: floorsWaiting(),
                elevators: elevatorsStatus()
            };

            // Don't bother with the console.log logic below if DEBUG is off
            if (!settings.DEBUG) {
                return status;
            }

            // If the message is an array, make it presentable
            if (Array.isArray(message)) {
                message = message.join("; ");
            }

            switch (arguments.length) {
                case 0: // No message, no type, just show status
                    console.log(status);
                    break;

                case 1: // Message, but no type, show message and status
                    console.log(message, status);
                    break;

                case 2: // Message and type, show appropriate type text, message, and status
                    // Check to make sure that we want don't want to filter out this object
                    if ((obj.hasOwnProperty("objType")) && (obj.objType === "elevator")) {
                        if ((settings.DEBUG_ELEMENTS.ELEVATORS.length == 0) || (settings.DEBUG_ELEMENTS.ELEVATORS.indexOf(obj.index) > -1)) {
                            console.log(obj.statusText() + ": " + message, status);
                        }
                    } else if ((obj.hasOwnProperty("objType")) && (obj.objType === "floor")) {
                        if ((settings.DEBUG_ELEMENTS.FLOORS.length == 0) || (settings.DEBUG_ELEMENTS.FLOORS.indexOf(obj.index) > -1)) {
                            console.log(obj.statusText() + ": " + message, status);
                        }
                    } else if (!obj.hasOwnProperty("objType")) {
                        console.log(obj, message, status);                        
                    }
                    break;

                default:
                    console.log("Incorrect number of arguments to debugStatus:", arguments);
                    console.log(status);
                    break;
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
            elevator.objType = "elevator";
            elevator.index = elevator_index;

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
                var floor = floors[elevator.currentFloor()],
                    text = "E" + elevator_index;
                
                switch(elevator.direction()) {
                    case "up":   text += "^"; break;
                    case "down": text += "v"; break;
                    case "":     text += "x"; break;
                }

                text = "[" + text + "]";
                text += floor.statusText();

                return text;
            };

            elevator.debugStatus = function() {
                return {
                    index: elevator_index,
                    goingTo: elevator.goingTo,
                    direction: elevator.direction(),
                    queue: elevator.destinationQueue,
                    buttons: elevator.getPressedFloors()
                };
            }

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

                if ((floorNum < settings.BOTTOM_FLOOR) || (floorNum > settings.TOP_FLOOR)) {
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
                    };
                }

                if ((elevator.direction === "down") && (floorNum >= elevator.goingTo)) {
                    return {
                        success: false,
                        status: "going past",
                        direction: "up"
                    };
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

                if ((floorNum < settings.BOTTOM_FLOOR) || (floorNum > settings.TOP_FLOOR)) {
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
                    };
                }

                if ((elevator.direction === "up") && (floorNum <= elevator.goingTo)) {
                    return {
                        success: false,
                        status: "going past",
                        direction: "down"
                    };
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
                    debug = [];

                debug.push("Idle");

                // Check to see if there are still active buttons
                if (elevator.getPressedFloors().length > 0) {
                    elevator.destinationQueue = elevator.getPressedFloors();
                    if (elevator.direction === "down") {
                        elevator.destinationQueue.reverse();
                    }
                    elevator.checkDestinationQueue();
                    debug.push("still has pressed floors, refreshed queue");
                }

                // Check to see if someone is on the elevator and needs to press a button
                else if (elevator.loadFactor() > 0) {
                    debug.push("loadFactor == " + elevator.loadFactor() + "(>0), not truly idle");
                }
                
                // If nothing is waiting, wait for now
                else if (waiting.noneWaiting) {
                    debug.push("floors waiting queue is empty");
                }

                // If both the upQueue and downQueue are waiting, go to the closer floor
                else if ((waiting.bottomUp > -1) && (waiting.topDown > -1)) {
                    var closer = closerFloor(elevator.currentFloor(), waiting.bottomUp, waiting.topDown);

                    debug.push("upQueue and downQueue both waiting");

                    if (closer === waiting.bottomUp) {
                        debug.push("going up from " + waiting.bottomUp);
                        moveStatus = elevator.goUp(closer);
                    } else {
                        debug.push("going down from " + waiting.topDown);
                        moveStatus = elevator.goDown(closer);
                    }
                }

                // If only the upQueue is waiting, go to the first (bottom) 
                else if (waiting.bottomUp > -1) {
                    debug.push("going up from " + waiting.bottomUp);
                    moveStatus = elevator.goUp(waiting.bottomUp);
                } 

                // If only the downQueue is waiting, go to the first (top)
                else if (waiting.topDown > -1) {
                    debug.push("going down from " + waiting.topDown);
                    moveStatus = elevator.goDown(waiting.topDown);
                }

                else {
                    debug.push("no logic criteria met");
                    if (settings.DEBUG) { debugger; }
                }

                // Debug Messaging
                if (settings.DEBUG) {
                    if ((moveStatus.hasOwnProperty("success")) && (moveStatus.success === false)) {
                        debug.push("move failed: " + moveStatus.status);
                    }

                    debugStatus(debug, elevator);
                }
            });
            elevator.on("floor_button_pressed", function(floorNum) {
                // Triggered when a passenger has pressed a button inside the elevator.
                var buttonDirection = (floorNum > elevator.currentFloor()) ? "up" : "down",
                    callStatus = elevator.goTo(floorNum, buttonDirection),
                    debug = [];

                // Debug Messaging
                if (settings.DEBUG) { 
                    debug.push("Button " + floorNum + " pressed");
                    debug.push(callStatus.status);

                    debugStatus(debug, elevator);
                }
            });
            elevator.on("passing_floor", function(floorNum, direction) {
                // Triggered slightly before the elevator will pass a floor. A good time to decide 
                // whether to stop at that floor. Note that this event is not triggered for the 
                // destination floor. Direction is either "up" or "down".
                var floor = floors[floorNum],
                    queueIndex = elevator.destinationQueue.indexOf(floorNum),
                    debug = [];

                debug.push("Passing Floor " + floorNum + " going " + direction);

                // If the elevator is already going to stop here, then we don't need to do anything special
                if (queueIndex === 0) {
                    debug.push("elevator already planning to stop, index " + queueIndex);
                }

                // If the elevator is already going to stop here, then we don't need to do anything special
                if (queueIndex > 0) {
                    debug.push("elevator already planning to stop, index " + queueIndex + ", reordered");

                    elevator.destinationQueue.splice(queueIndex,1);
                    elevator.destinationQueue.unshift(floorNum);
                    elevator.checkDestinationQueue();
                }

                // If it's not in the queue, but for some reason the button is pressed in the elevator, stop
                else if (elevator.getPressedFloors().indexOf(floorNum) > -1) {
                    elevator.goToFloor(floorNum, true);

                    debug.push("elevator button pressed but not in queue, stopping here");
                }

                // If the floor's request button is not lit, then we don't need to consider stopping
                else if (((direction === "down") && (!floor.downPressed())) ||
                    ((direction === "up") && (!floor.upPressed()))) {

                    debug.push("stop going " + direction + " not requested from floor");
                }

                // Don't even think about stopping if you're on the way to a farther floor to go 
                // the opposite direction
                else if (direction !== elevator.direction) {
                    debug.push("elevator going " + direction + " on the way to " + elevator.goingTo + ", going " + elevator.direction());
                }

                // If the elevator is almost full, do not make a special stop here. If it was going
                // to stop stop anyways, it will.
                else if (elevator.loadFactor() >= settings.FULL) {
                    debug.push("loadFactor == " + elevator.loadFactor() + " (>" + settings.FULL + ")");
                    debug.push("elevator too full to make an extra stop");
                }

                // If the floor light is lit in the same direction we are traveling, the elevator is
                // not already planning to stop here, and it's not too full, then stop along the way
                else if (((direction === "down") && (floor.downPressed())) ||
                         ((direction === "up") && (floor.upPressed()))) {
                    
                    elevator.goTo(floorNum, direction, true);
                    debug.push("stopping here");
                }

                else {
                    debug.push("no logic criteria met");
                    if (settings.DEBUG) { debugger; }
                }

                if (settings.DEBUG) {
                    debugStatus(debug, elevator);
                }
            });
            elevator.on("stopped_at_floor", function(floorNum) {
                // Triggered when the elevator has arrived at a floor.
                var floor = floors[floorNum],
                    debug = [];

                debug.push("Stopped at Floor " + floorNum);

                // Update the direction
                if (floorNum === settings.BOTTOM_FLOOR) {
                    elevator.direction("up");
                } else if (floorNum === settings.TOP_FLOOR) {
                    elevator.direction("down");
                } else if ((floor.upPressed()) && (!floor.downPressed())) {
                    elevator.direction("up");
                } else if ((floor.downPressed()) && (!floor.upPressed())) {
                    elevator.direction("down");
                }

                // Remove this floor from the queue if it's there
                if (elevator.destinationQueue.length > 0) {
                    var index = elevator.destinationQueue.indexOf(floorNum);

                    if (index > -1) {
                        debug.push("removing floor from destination queue [" + elevator.destinationQueue.join(", ") + "]");
                    }

                    while (index > -1) {
                        elevator.destinationQueue.splice(index, 1);
                        index = elevator.destinationQueue.indexOf(floorNum);
                    }
                    elevator.checkDestinationQueue();
                }

                if (settings.DEBUG) {
                    if (floorNum !== elevator.goingTo) {
                        debug.push("on the way to " + elevator.goingTo);
                    }
                        
                    debugStatus(debug, elevator);
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
            
            // Custom Properties -----------------------------------------------
            floor.objType = "floor";
            floor.index = floor_index;

            // Custom Functions ------------------------------------------------
            floor.statusText = function() {
                var text = "F" + floor.floorNum();

                text += (floor.upPressed()) ? "^" : "_";
                text += (floor.downPressed()) ? "v" : "_";

                text = "[" + text + "]";

                return text;
            };

            floor.upPressed = function() {
                return (floor.buttonStates.up !== "");
            };

            floor.downPressed = function() {
                return (floor.buttonStates.down !== "");
            };

            // Floor Events ----------------------------------------------------
            floor.on("up_button_pressed", function() {
                // Triggered when someone has pressed the up button at a floor. 
                // Note that passengers will press the button again if they fail to enter an elevator.
                var available = callAvailableElevator(floor.floorNum(), "up"),
                    debug = [];

                debug.push("Up button pressed");

                if (settings.DEBUG) {
                    if (available.elevator > -1) {
                        debug.push("requested Elevator " + available.elevator);
                        debug.push((available.elevatorCalled) 
                            ? "call succeeded"
                            : "call failed with availability " + available.bestAvailability);
                    } else {
                        debug.push("no Elevator currently available");
                    }

                    debugStatus(debug, floor); 
                }
            });
            floor.on("down_button_pressed", function() {
                // Triggered when someone has pressed the down button at a floor. 
                // Note that passengers will press the button again if they fail to enter an elevator.
                var available = callAvailableElevator(floor.floorNum(), "down"),
                    debug = [];

                debug.push("Down button pressed");

                if (settings.DEBUG) { 
                    if (available.elevator > -1) {
                        debug.push("requested Elevator " + available.elevator);
                        debug.push((available.elevatorCalled) 
                            ? "call succeeded"
                            : "call failed with availability " + available.bestAvailability);
                    } else {
                        debug.push("no Elevator currently available");
                    }

                    debugStatus(debug, floor); 
                }
            });
        });
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}