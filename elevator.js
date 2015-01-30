{
    init: function(elevators, floors) {
        // "Constants" =========================================================
        var settings = {
            FULL: 4,
            BOTTOM_FLOOR: 0,
            TOP_FLOOR: floors.length - 1,
            NUM_ELEVATORS: elevators.length - 1
        };

        var UniqueArray = function() {
            _a = [];

            return {
                get: function() {
                    return _a;
                },
                add: function(v) {
                    if (_a.indexOf(v) === -1) {
                        _a.push(v);
                        _a.sort();
                    }

                    return _a;
                },
                remove: function(v) {
                    var loc = _a.indexOf(v);

                    if (loc > -1) {
                        _a.splice(loc, 1);
                    }

                    return _a;
                }
            }
        };
        var callAvailableElevator = function(floorNum, direction) {
            var bestElevator = -1,
                availableElevators = [],
                availability = -1,
                bestAvailablility = -1;

            // Check All Elevators
            elevators.forEach(function(elevator, eidx) {
                availability = elevator.available(floorNum, direction);

                if (availability > bestAvailablility) {
                    bestElevator = eidx;
                    bestAvailablility = availability;
                }
            });

            if (bestElevator > -1) {
                elevators[bestElevator].go(floorNum, direction);
            }
                
            return bestElevator;            
        };

        var floorsWaiting = function() {
            var queue = {
                    up: [],
                    down: []
                },
                bottomUp = -1,
                topDown = -1;

            // Check All Floors
            floors.forEach(function(floor, fidx) {
                if (floor.button_lit["up"] === true) {
                    queue.up.push(fidx);
                    bottomUp = (bottomUp === -1)
                        ? fidx
                        : bottomUp;
                }

                if (floor.button_lit["down"] === true) {
                    queue.down.push(fidx);
                    topDown = fidx;
                }
            });

            return {
                queue: queue,
                bottomUp: bottomUp,
                topDown: topDown
            };
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
             ******************************************************************/

            // Custom Elevator Properties --------------------------------------
            elevator.buttons = new UniqueArray();
            elevator.direction = "";
            elevator.goingTo = -1;

            // Custom Elevator Functions ---------------------------------------
            elevator.queueLength = function() {
                return elevator.destinationQueue.length;
            };

            elevator.newQueue = function() {
                elevator.direction = "";
                elevator.goingTo = -1;
                elevator.goingUpIndicator(false);
                elevator.goingDownIndicator(false);
            };

            elevator.go = function(floorNum, direction) {
                if (direction === "up") {
                    elevator.goUp(floorNum);
                } else {
                    elevator.goDown(floorNum);
                }
            };

            elevator.goUp = function(floorNum) {
                elevator.direction = "up";
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(false);

                if (floorNum) {
                    elevator.goToFloor(floorNum);
                    elevator.buttons.add(floorNum);
                    elevator.goingTo = (floorNum > elevator.goingTo)
                        ? floorNum
                        : elevator.goingTo;
                }
            };

            elevator.goDown = function(floorNum) {
                elevator.direction = "down";
                elevator.goingDownIndicator(true);
                elevator.goingUpIndicator(false);

                if (floorNum) {
                    elevator.goToFloor(floorNum);
                    elevator.buttons.add(floorNum);
                    elevator.goingTo = (elevator.goingTo === -1 || floorNum < elevator.goingTo)
                        ? floorNum
                        : elevator.goingTo;
                }
            };

            elevator.available = function(floorNum, direction) {
                /* Returns a weighted availability
                 *    2 : elevator already on its way
                 *    1 : idle, feel free
                 *    0 : busy, but might be going past
                 *   -1 : going the other way past this floor, not available
                 */

                // If the elevator is idle, it is available for use
                if (elevator.queueLength() === 0) {
                    return 1;
                }

                // If the elevator is heading to this floor, it's a candidate
                if (elevator.goingTo === floorNum) {
                    return 2;
                }

                // If the elevator is going past in the other direction, it's not available right now
                if ((elevator.direction === "up" && direction === "down" && elevator.goingTo > floorNum) ||
                   (elevator.direction === "down" && direction === "up" && elevator.goingTo < floorNum)) {
                    
                    return -1;
                }

                // TODO: Maybe add some logic about capacity?
                return 0;
            };

            // Elevator Events -------------------------------------------------
            elevator.on("idle", function() {
                // Triggered when the elevator has completed all its tasks and is not doing anything.
                elevator.newQueue();
                debugger;

                var queue = floorsWaiting(),
                    floor = elevator.currentFloor();

                if ((Math.abs(floor - queue.bottomUp)) < (Math.abs(floor - queue.topDown))) {
                    elevator.goUp(queue.bottomUp);
                } else {
                    elevator.goDown(queue.topDown);
                }
            });

            elevator.on("floor_button_pressed", function(floorNum) {
                // Triggered when a passenger has pressed a button inside the elevator.
                if (elevator.direction === '') {
                    elevator.direction = (elevator.floorNum() < floorNum) 
                        ? "up"
                        : "down";
                }

                elevator.go(floorNum, elevator.direction);

                // Make sure that the elevator stops at the floors in order (depending on the direction)
                elevator.destinationQueue.sort();
                if (elevator.direction === "down") {
                    elevator.destinationQueue.reverse();
                }
                elevator.checkDestinationQueue();
            });

            elevator.on("passing_floor", function(floorNum, direction) {
                // Triggered slightly before the elevator will pass a floor. A good time to decide 
                // whether to stop at that floor. Note that this event is not triggered for the 
                // destination floor. Direction is either "up" or "down".
                var floor = floors[floorNum];

                // Don't even think about stopping if you're on the way to a farther floor to go 
                // the opposite direction
                if (direction !== elevator.direction) {
                    return false;
                }

                // If the elevator is almost full, do not make a special stop here. If it was going
                // to stop stop anyways, it will.
                if (elevator.loadFactor() >= settings.FULL) {
                    return false;
                }

                if ((floor.button_lit[direction]) && (elevator.button_lit[floorNum] === false) &&
                    ((floor.claimed[direction] === -1) || (floor.claimed[direction] === elevator.elevator_index))) {

                    elevator.goToFloor(floorNum, true);
                    floor.button_lit[direction] = false;
                    floor.claimed[direction] = -1;
                    elevator.buttons.remove(floorNum);
                }
            });

            elevator.on("stopped_at_floor", function(floorNum) {
                // Triggered when the elevator has arrived at a floor.
                switch (floorNum) {
                    case settings.BOTTOM_FLOOR:
                        elevator.goUp();
                        break;

                    case settings.TOP_FLOOR:
                        elevator.goDown();
                        break;

                    default:
                        // do nothing special, yet
                        break;
                };

                elevator.buttons.remove(floorNum);
            });
        });
        
        // Floor Code ==========================================================
        floors.forEach(function(floor, floor_index) {
            /** Elevator Properties ********************************************
             *  - floorNum()
             ******************************************************************/
            
            floor.button_lit = [];
            floor.claimed = [];

            floor.button_lit["up"] = false;
            floor.button_lit["down"] = false;
            floor.claimed["up"] = -1;
            floor.claimed["down"] = -1;

            // Floor Events ----------------------------------------------------
            floor.on("up_button_pressed", function() {
                // Triggered when someone has pressed the up button at a floor. 
                // Note that passengers will press the button again if they fail to enter an elevator.
                floor.button_lit["up"] = true;
                callAvailableElevator(floor.floorNum(),"up");
            });
            floor.on("down_button_pressed", function() {
                // Triggered when someone has pressed the down button at a floor. 
                // Note that passengers will press the button again if they fail to enter an elevator.
                floor.button_lit["down"] = true;
                callAvailableElevator(floor.floorNum(),"down");
            });
        });
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}