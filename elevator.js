{
    init: function(elevators, floors) {
        // "Constants" =========================================================
        var settings = {
            FULL: 4,
            BOTTOM_FLOOR: 0,
            TOP_FLOOR: floors.length - 1,
            NUM_ELEVATORS: elevators.length - 1
        };

        // Floor Code ==========================================================
        floors.forEach(function(floor, floor_index) {
            /** Elevator Properties ********************************************
             *  - floorNum()
             ******************************************************************/
            floor.queueUp = 0;
            floor.queueDown = 0;
            floor.upClaimed = -1;
            floor.downClaimed = -1;

            // Floor Events ----------------------------------------------------
            floor.on("up_button_pressed", function() {
                // Triggered when someone has pressed the up button at a floor. 
                // Note that passengers will press the button again if they fail to enter an elevator.
                this.queueUp++;
                
                var available = masterQueue.availableElevator(floor.floorNum(),"up");
                if (available > -1) {
                    floor.upClaimed = available;
                    elevators[available].goUp(floor.floorNum());
                }
            });
            floor.on("down_button_pressed", function() {
                // Triggered when someone has pressed the down button at a floor. 
                // Note that passengers will press the button again if they fail to enter an elevator.
                this.queueDown++;

                var available = masterQueue.availableElevator(floor.floorNum(),"down");
                if (available > -1) {
                    floor.downClaimed = available;
                    elevators[available].goDown(floor.floorNum());
                }
            });
        });

        // Master Queue Code ===================================================
        var masterQueue = (function() {
            var _downQueue = function() {
                var _queue = [],
                    _topDown = -1;

                // Check All Floors
                floors.forEach(function (floor, fidx) {
                    _queue[fidx] = floor.queueDown;
                    _topDown = (floor.queueDown > 0)
                        ? fidx
                        : _topDown;
                });

                return {
                    queue: _queue,
                    topDown: _topDown
                };
            };

            var _upQueue = function() {
                var _queue = [],
                    _bottomUp = -1;

                // Check All Floors
                floors.forEach(function(floor, fidx) {
                    _queue[fidx] = floor.queueUp;
                    _bottomUp = ((floor.queueUp > 0) && (_bottomUp === -1))
                        ? fidx
                        : _bottomUp;
                });

                return {
                    queue: _queue,
                    bottomUp: _bottomUp
                };
            };

            var _refreshAvailableElevator = function(floorNum, direction) {
                // Clear Queue
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

                return bestElevator;
            };

            return {
                queue: function() {
                    var up = _upQueue(),
                        down = _downQueue();

                    return {
                        up: up.queue,
                        down: down.queue,
                        topDown: up.topDown,
                        bottomUp: down.bottomUp
                    };
                },
                downQueue: function() {
                    return _downQueue();
                },
                upQueue: function() {
                    return _upQueue();
                },
                availableElevator: function(floorNum, direction) {
                    return _refreshAvailableElevator(floorNum, direction);
                }
            }
        })();

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

            elevator.direction = "";
            elevator.goingTo = -1;

            // Pretend In-car Lights (for floors) pressed
            elevator.buttons = (function() {
                var _lights = [];

                return {
                    press: function(floorNum) {
                        if (!this.isLit) {
                            _lights.push(floorNum);
                            _lights.sort();
                        }
                    },
                    clear: function(floorNum) {
                        var i = _lights.indexOf(floorNum);
                        if (i > -1) {
                            _lights = _lights.splice(i, 1);
                        }

                        do {
                            i = elevator.destinationQueue.indexOf(floorNum);
                            if (i > -1) {
                                elevator.destinationQueue.splice(i, 1);
                            }
                        } while (i > -1);
                        elevator.checkDestinationQueue();
                    },
                    isLit: function(floorNum) {
                        var i = _lights.indexOf(floorNum);
                        return (i > -1);
                    }
                }
            })();

            elevator.queueLength = function() {
                return elevator.destinationQueue.length;
            };

            elevator.newQueue = function() {
                elevator.direction = "";
                elevator.goingTo = -1;
                elevator.goingUpIndicator(false);
                elevator.goingDownIndicator(false);
            };

            elevator.goUp = function(floorNum) {
                elevator.direction = "up";
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(false);

                if (floorNum) {
                    elevator.goToFloor(floorNum);

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

                var queue = masterQueue.queue(),
                    floorNum = elevator.currentFloor();

                if ((Math.abs(floorNum - queue.topDown)) < (Math.abs(floorNum - queue.bottomUp))) {
                    elevator.goDown(queue.topDown);
                } else {
                    elevator.goUp(queue.bottomUp);
                }
            });

            elevator.on("floor_button_pressed", function(floorNum) {
                // Triggered when a passenger has pressed a button inside the elevator.
                if (elevator.direction === '') {
                    if (elevator.floorNum() < floorNum) {
                        elevator.goUp();
                    } else {
                        elevator.goDown();
                    }
                }

                elevator.buttons.press(floorNum);
                elevator.goToFloor(floorNum);

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

                if (direction === "down") {
                    if ((floor.downQueue > 0) &&
                        ((floor.downClaimed === -1) || (floor.downClaimed === elevator.elevator_index))) {

                        elevator.goToFloor(floorNum, true);
                    }
                } else { // direction === "up"
                    if ((floor.upQueue > 0) &&
                        ((floor.upClaimed === -1) || (floor.upClaimed === elevator.elevator_index))) {

                        elevator.goToFloor(floorNum, true);
                    }
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

                elevator.buttons.clear(floorNum);
                if (elevator.direction === "up") {
                    floors[floorNum].upQueue = 0;
                } else if (elevator.direction === "down") {
                    floors[floorNum].downQueue = 0;
                }
            });
        });
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}