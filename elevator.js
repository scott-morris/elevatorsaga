{
    init: function(elevators, floors) {
        // "Constants" =========================================================
        var settings = {
            FULL: 4
        };

        // Queue Definition ====================================================
        var Queue = function() {
            var FloorQ = function() {
                    _waiting = 0;
                    return {
                        get: function() { return _waiting; },
                        add: function() { _waiting++; },
                        clear: function() { _waiting = 0; }
                    }
                },
                _floor = [];

            floors.forEach(function(floor, idx) {
                _floor[floor.floorNum()] = new FloorQ();
            });

            return {
                get: function(floorNum) { return _floor[floorNum].get(); },
                add: function(floorNum) { 
                    _floor[floorNum].add(); 
                    console.log(floorNum + ' incremented to ' + _floor[floorNum].get());
                },
                clear: function(floorNum) { 
                    console.log(floorNum + ' cleared from ' + _floor[floorNum].get());
                    _floor[floorNum].clear();
                },
                highest: function() {
                    for (var i=floors.length-1;i>=0;i--) {
                        if (_floor[floors[i].floorNum()].get() > 0) {
                            return floors[i].floorNum();
                        }
                    }
                },
                lowest: function() {
                    for (var i=0;i<floors.length;i++) {
                        if (_floor[floors[i].floorNum()].get() > 0) {
                            return floors[i].floorNum();
                        }
                    }
                },
                most: function() {
                    var retFloor = -1,
                        retNum = 0;

                    for (var i=0;i<floors.length;i++) {
                        if (_floor[floors[i].floorNum()].get() > retNum) {
                            retFloor = floors[i].floorNum();
                            retNum = _floor[floors[i].floorNum()].get();
                        }
                    }

                    return {
                        floorNum: retFloor,
                        requests: retNum
                    };
                },
                count: function() {
                    var sum = 0;
                    for (var i=0;i<floors.length;i++) {
                        sum += _floor[floors[i].floorNum()].get();
                    }
                    return sum;
                }
            };
        };

        // Queue Variables =====================================================
        var downQueue = new Queue(),
            upQueue = new Queue();

        // Utility Functions ===================================================
        var elevatorOnTheWay = function(floorNum) {
            var queue = [];
            elevators.forEach(function(elevator, i) {
                queue.concat(elevator.destinationQueue);
            });
            return (queue.indexOf(floorNum) > -1);
        };

        var closestRequest = function(floorNum) {
            var next = -1,
                mostUp = upQueue.most(),
                mostDown = downQueue.most();

            if ((mostUp.requests == settings.FULL)&&(mostDown.requests == settings.FULL)) {
                var closerUp = Math.abs(floorNum - mostUp.floorNum),
                    closerDown = Math.abs(floorNum - mostDown.floorNum);

                next = (closerUp < closerDown)
                    ? mostUp.floorNum
                    : mostDown.floorNum;

            } else if (mostUp.requests == settings.FULL) {
                next = mostUp.floorNum;

            } else if (mostDown.requests == settings.FULL) {
                next = mostDown.floorNum;

            } else if ((upQueue.count() > 0)&&(downQueue.count() > 0)) { // If both queues have values, choose whichever is closer
                var closestUp = Math.abs(floorNum - upQueue.lowest()),
                    closestDown = Math.abs(floorNum - downQueue.highest());

                next = (closestUp < closestDown)
                    ? upQueue.lowest()
                    : downQueue.highest();

            } else if (upQueue.length > 0) {
                next = upQueue.lowest();
            } else if (downQueue.length > 0) {
                next = downQueue.highest();
            }

            return next;
        };

        // Elevator Code =======================================================
        elevators.forEach(function(elevator, idx) {
            elevator.on("idle", function() {
                var waitForInstructions = setInterval(function () {
                    var nextBest = closestRequest(elevator.currentFloor());

                    if ((nextBest > -1)&&(!elevatorOnTheWay(nextBest))) {
                        elevator.goToFloor(nextBest);
                        clearInterval(waitForInstructions);
                    } else {
                        //debugger;
                    }
                }, 500);
            });

            elevator.on("floor_button_pressed", function(floorNum) {
                elevator.goToFloor(floorNum);
            });

            elevator.on("passing_floor", function(floorNum, direction) {
                if (elevator.destinationQueue.indexOf(floorNum) > -1) {
                    elevator.goToFloor(floorNum, true);
                }
            });

            elevator.on("stopped_at_floor", function(floorNum) {
                var idx = elevator.destinationQueue.indexOf(floorNum);
                if (idx > -1) {
                    elevator.destinationQueue.slice(idx,1);
                }
                
                upQueue.clear(floorNum);
                downQueue.clear(floorNum);
            });
        });

        // Floor Code ==========================================================
        floors.forEach(function(floor, idx) {
            floor.on("up_button_pressed", function() {
                upQueue.add(floor.floorNum());
            });

            floor.on("down_button_pressed", function() {
                downQueue.add(floor.floorNum());
            });
        });
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}