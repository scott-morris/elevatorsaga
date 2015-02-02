/**
 * @author Scott Morris scott.r.morris@gmail.com
 * @version 0.0.10
 *
 * This is my solution to Elevator Saga at http://play.elevatorsaga.com/
 */
{
	init: function (elevators, floors) {
		/**
		 * The program "constants" are stored in the `settings` object.
		 *
		 * @name settings
		 * @param {boolean} DEBUG flag determining whether debugging is turned on
		 * @param {object} DEBUG_ELEMENTS
		 * @param {array} DEBUG_ELEMENTS.ELEVATORS array determining which elevators to track when the `DEBUG` flag is set. To track all, leave the array blank. To track none, populate with `[-1]`
		 * @param {array} DEBUG_ELEMENTS.FLOORS array determining which floors to track when the `DEBUG` flag is set. To track all, leave the array blank. To track none, populate with `[-1]`
		 * @param {number} FULL The max `loadFactor()` for a given elevator that will stop for a floor that isn't internally pressed
		 * @param {integer} BOTTOM_FLOOR The bottom floor
		 * @param {integer} TOP_FLOOR The top floor, derived by the `floors` array size
		 * @param {integer} NUM_ELEVATORS The number of elevators, derived by the `elevators` array size
		 */
		var settings = {
			DEBUG: true,
			DEBUG_ELEMENTS: {
				ELEVATORS: [], // leave blank to debug all, set to -1 to hide all
				FLOORS: [] // leave blank to debug all, set to -1 to hide all
			},
			FULL: 0.7,
			BOTTOM_FLOOR: 0,
			TOP_FLOOR: floors.length - 1,
			NUM_ELEVATORS: elevators.length - 1
		};

		var initBreak = false;

		// Helper Functions ====================================================
		/**
		 * Helper class for maintaining an array with unique values that is automatically sorted
		 *
		 * @name UniqueArray
		 * @param {String} [direction] if direction is `false` or `"down"`, the array will be reverse sorted
		 */
		var UniqueArray = function (direction) {
			_a = [];
			_sortRev = false;

			if (direction === "down") {
				_sortRev = true;
			}

			return {
				/**
				 * Get the array
				 *
				 * @name UniqueArray.get
				 * @returns {Array} the stored array
				 */
				get: function () {
					return _a;
				},
				/**
				 * Find a given value in the array
				 *
				 * @name UniqueArray.find
				 * @param {variant} v value
				 * @returns {integer} index of passed-in value, or `-1` if not found
				 */
				find: function (v) {
					return _a.indexOf(v);
				},
				/**
				 * Find out if a given value is present in the array
				 *
				 * @name UniqueArray.has
				 * @param {variant} v value
				 * @returns {boolean} whether the value is present in the array
				 */
				has: function (v) {
					return (this.find(v) > -1);
				},
				/**
				 * Add a value to the array if it is not already present
				 *
				 * @name UniqueArray.add
				 * @param {variant} v value
				 * @returns {array} the stored array
				 */
				add: function (v) {
					if (Array.isArray(v)) {
						_this = this;
						v.forEach(function (ele, i) {
							_this.add(ele);
						});
					} else if (!this.has(v)) {
						_a.push(v);
						_a.sort();
					}

					return _a;
				},
				/**
				 * Remove a value from the array if it exists
				 *
				 * @name UniqueArray.remove
				 * @param {variant} v value
				 * @returns {array} the stored array
				 */
				remove: function (v) {
					var loc = this.find(v);

					if (loc > -1) {
						_a.splice(loc, 1);
					}

					return _a;
				},
				/**
				 * Sort the stored array
				 *
				 * @name UniqueArray.sort
				 * @param {variant} [rev] `true` or `"down"` to sort descending;
				 * `false` or `"up"` to sort ascending;
				 * if parameter not given, sort in the saved way
				 * @returns {array} the stored array
				 */
				sort: function (rev) {
					_a.sort();

					// If no arguments, determine sort direction using _sortRev
					if (arguments.length === 0) {
						if (_sortRev) {
							_a.reverse();
						}
						// If arguments, set _sortRev and reverse accordingly
					} else {
						if ((rev === true) || (rev === "down")) {
							_sortRev = true;
							_a.reverse();
						} else if ((rev === false) || (rev === "up")) {
							_sortRev = false;
						}
					}

					return _a;
				}
			}
		};

		/**
		 * todo
		 *
		 * @name callAvailableElevator
		 * @param {integer} floorNum floor to attempt to call the elevator to
		 * @param {string} direction the direction of the requeest, either `"up"` or `"down"`
		 * @return {object}
         *
		 * ```
		 * {
		 *     elevator,
		 *     callStatus,
		 *     bestAvailability,
		 *     elevatorCalled
		 * }
		 * ```
         *
		 * - **integer** *elevator* todo
		 * - **integer** *callStatus* todo
		 * - **integer** *bestAvailability* todo
		 * - **integer** *elevatorCalled* todo
		 */
		var callAvailableElevator = function (floorNum, direction) {
			var bestElevator = -1,
				bestAvailability = -1,
				bestElevatorStatus = {},
				elevatorCalled = false;

			// Check All Elevators
			elevators.forEach(function (elevator, eidx) {
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

		/**
		 * todo
		 *
		 * @name floorsWaiting
		 * @return {object}
         *
		 * ```
		 * {
		 *     queue: {
		 *         up,
		 *         down
		 *     }
		 *     bottomUp,
		 *     topDown,
		 *     noneWaiting
		 * }
		 * ```
         *
		 * - **integer[]** *queue.up* todo
		 * - **integer[]** *queue.down* todo
		 * - **integer** *bottomUp* todo
		 * - **integer** *topDown* todo
		 * - **boolean** *noneWaiting* todo
		 */
		var floorsWaiting = function () {
			var queue = {
					up: [],
					down: []
				},
				bottomUp = -1,
				topDown = -1,
				noneWaiting = true;

			// Check All Floors
			floors.forEach(function (floor, fidx) {
				if (floor.upPressed()) {
					queue.up.push(fidx);
					noneWaiting = false;
					bottomUp = (bottomUp === -1) ? fidx : bottomUp;
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

		/**
		 * todo
		 *
		 * @name elevatorStatus
		 * @return {array} Array of `debugStatus()` for all elevators
		 */
		var elevatorsStatus = function () {
			var _elevators = [];

			elevators.forEach(function (e, i) {
				_elevators.push(e.debugStatus());
			});

			return _elevators;
		};

		/**
		 * Given the elevator or floor, show the debug message with relevant context based on the object's `statusText()` function
		 *
		 * @name debugStatus
		 * @param {string} message Debug message to be shown in the console
		 * @param {object} obj Either an `elevator` or `floor`
		 * @return {object}
         *
		 * ```
		 * {
		 *     floors,
		 *     elevators
		 * }
		 * ```
         *
         * - **object[]** *floors* todo
         * - **object[]** *elevators* todo
		 */
		var debugStatus = function (message, obj) {
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

		/**
		 * Returns the closer of the two options to the `startFloor`
		 *
		 * @name closerFloor
		 * @param {integer} startFloor current floor
		 * @param {integer} option1 the first floor to compare
		 * @param {integer} option2 the second floor to compare
		 * @return {integer} the closer floor number
		 */
		var closerFloor = function (startFloor, option1, option2) {
			return (Math.abs(startFloor - option1) < Math.abs(startFloor - option2)) ? option1 : option2;
		};

		// Elevator Code =======================================================
		elevators.forEach(function (elevator, elevator_index) {
			/**
			 * @class elevator
			 *
			 * Each elevator operates independently, without a master queue.
			 *
			 * ### Properties:
			 * - **integer[]** *destinationQueue* The current destination queue, meaning the floor numbers the elevator is scheduled to go to. Can be modified and emptied if desired. Note that you need to call `checkDestinationQueue()` for the change to take effect immediately.
			 * - **integer** *goingTo* The longest distance the elevator is heading in the current direction
			 * - **string** *objType* set to `"elevator"`
			 * - **integer** *index* set to the `elevator_index` to ensure that an elevator can be referenced from the array object
			 */

			elevator.goingTo = -1;
			elevator.objType = "elevator";
			elevator.index = elevator_index;

            /**
             * Returns a weighted availablility to go to a given floor / direction combination
             *
             * @method elevator.available
             * @param {integer} floorNum todo
             * @param {string} direction todo
             * @return {integer} returns a weighted availability
             *
             * - `2`: elevator already on its way to this floor
             * - `1`: elevator idle and available to be assigned
             * - `0`: busy, but might be going past this floor
             * - `-1`: going the other way past this floor, not available right now
             */
            elevator.available = function (floorNum, direction) {
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

			/**
			 * Checks the destination queue for any new destinations to go to. Note that you only need to call this if you modify the destination queue explicitly.
			 *
			 * @method elevator.checkDestinationQueue
			 */

			/**
			 * Gets the floor number that the elevator currently is on.
			 *
			 * @method elevator.currentFloor
			 * @return {integer} the floor number that the elevator currently is on
			 */

            /**
             * @method elevator.debugStatus
             * @return {object}
             *
             * ```
             * ```
             *
             * - **integer** *index* todo
             * - **integer** *goingTo* todo
             * - **string** *direction* todo
             * - **integer[]** *queue* todo
             * - **intger[]** *buttons* todo
             */
            elevator.debugStatus = function () {
                return {
                    index: elevator_index,
                    goingTo: elevator.goingTo,
                    direction: elevator.direction(),
                    queue: elevator.destinationQueue,
                    buttons: elevator.getPressedFloors()
                };
            }

			/**
			 * Gets or sets the elevator's direction based on the `goingUpIndicator` and `goingDownIndicator`
			 *
			 * @method elevator.direction
			 * @param {string} [dir] direction, optional. `"up"`, `"down"`, or `"clear"`
			 * @return {string} direction, `"up"`, `"down"`, or `""` based on the current status of the indicator lights
			 */
			elevator.direction = function (dir) {
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

			/**
			 * Gets the currently pressed floor numbers as an array.
			 *
			 * @method elevator.getPressedFloors
			 * @return {array} Currently pressed floor numbers
			 */

			/**
			 * Gets or sets the going up indicator, which will affect passenger behaviour when stopping at floors.
			 *
			 * @method elevator.goingUpIndicator
			 * @param {boolean} [set]
			 * @return {boolean}
			 */

			/**
			 * Gets or sets the going down indicator, which will affect passenger behaviour when stopping at floors.
			 *
			 * @method elevator.goingDownIndicator
			 * @param {boolean} [set]
			 * @return {boolean}
			 */

            /**
             * @method elevator.goDown
             * @param {integer} floorNum The floor to send the elevator
             * @param {boolean} [forceStop] If true, the elevator will go to that floor directly, and then go to any other queued floors.
             * @return {object}
             *
             * ```
             * {
             *     success,
             *     status,
             *     direction
             * }
             * ```
             *
             * - **boolean** *success* Whether the call to the floor was successful
             * - **string** *status* If not successful, the reason why not
             * - **string** *direction* What direction the elevator was requested, in this case always `"down"`
             */
            elevator.goDown = function (floorNum, forceStop) {
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
                elevator.goingTo = (elevator.goingTo === -1 || floorNum < elevator.goingTo) ? floorNum : elevator.goingTo;

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

            /**
             * @method elevator.goTo
             * @param {integer} floorNum The floor to send the elevator
             * @param {string} [direction] If set, force the direction of the request. If not, the direction will be automatically set based on the relationship between the requested floor and the elevator's current floor.
             * @param {boolean} [forceStop] If true, the elevator will go to that floor directly, and then go to any other queued floors.
             * @return {object}
             *
             * ```
             * {
             *     success,
             *     status,
             *     direction
             * }
             * ```
             *
             * - **boolean** *success* Whether the call to the floor was successful
             * - **string** *status* If not successful, the reason why not
             * - **string** *direction* What direction the elevator was requested, in this case always `"up"`
             */
            elevator.goTo = function (floorNum, direction, forceStop) {
                if (arguments.length < 3) {
                    forceStop = false;
                }

                // If direction not specified
                if (arguments.length == 1) {
                    direction = (floorNum < elevator.currentFloor()) ? "down" : "up";
                }

                if (direction === "up") {
                    return elevator.goUp(floorNum, forceStop);
                } else {
                    return elevator.goDown(floorNum, forceStop);
                }
            };

            /**
             * Queue the elevator to go to specified floor number.
             *
             * @method elevator.goToFloor
             * @param {integer} floorNum The floor to send the elevator
             * @param {boolean} [force] If true, the elevator will go to that floor directly, and then go to any other queued floors.
             */

            /**
             * @method elevator.goUp
             * @param {integer} floorNum The floor to send the elevator
             * @param {boolean} [forceStop] If true, the elevator will go to that floor directly, and then go to any other queued floors.
             * @return {object}
             *
             * ```
             * {
             *     success,
             *     status,
             *     direction
             * }
             * ```
             *
             * - **boolean** *success* Whether the call to the floor was successful
             * - **string** *status* If not successful, the reason why not
             * - **string** *direction* What direction the elevator was requested, in this case always `"up"`
             */
            elevator.goUp = function (floorNum, forceStop) {
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
                elevator.goingTo = (floorNum > elevator.goingTo) ? floorNum : elevator.goingTo;

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

			/**
			 * Gets the load factor of the elevator.
			 *
			 * @method elevator.loadFactor
			 * @return {number} `0` means empty, `1` means full. Varies with passenger weights, which vary - not an exact measure.
			 */

            /**
             * @method elevator.refreshQueue
             */
            elevator.refreshQueue = function () {
                var oldQueue = elevator.destinationQueue,
                    oldDestination = elevator.goingTo,
                    elevatorButtons = elevator.getPressedFloors(),
                    newQueue = new UniqueArray(elevator.direction);

                elevator.destinationQueue = [];
                newQueue.add(elevatorButtons);

                // If the elevator 
                if (floors[elevator.goingTo].buttonPressed()) {
                    newQueue.add(elevator.goingTo);
                } else {

                }
            };

			/**
			 * Generates a short string description of the elevator and current floor to be used in debugging
			 *
			 * @method elevator.statusText
			 * @return {string}
			 *
			 * - `[E#^]` when elevator direction is up
			 * - `[E#v]` when elevator direction is down
			 * - `[E#x]` when elevator direction is not set
			 * - Where `#` is the elevator number
			 * - Includes the `floor.statusText()` based on the elevator's current floor
			 *   - _example: `[E0^][F2^_]` - elevator 0, going up, at floor 2 with the up indicator lit_
			 */
			elevator.statusText = function () {
				var floor = floors[elevator.currentFloor()],
					text = "E" + elevator_index;

				switch (elevator.direction()) {
				case "up":
					text += "^";
					break;
				case "down":
					text += "v";
					break;
				case "":
					text += "x";
					break;
				}

				text = "[" + text + "]";
				text += floor.statusText();

				return text;
			};

			/**
			 * Clear the destination queue and stop the elevator if it is moving. Note that you normally don't need to stop elevators - it is intended for advanced solutions with in-transit rescheduling logic.
			 *
			 * @method elevator.stop
			 */

			// Elevator Events -------------------------------------------------
			elevator.on("idle", function () {
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
				} else {
					debug.push("no logic criteria met");
					if (settings.DEBUG) {
						debugger;
					}
				}

				// Debug Messaging
				if (settings.DEBUG) {
					if ((moveStatus.hasOwnProperty("success")) && (moveStatus.success === false)) {
						debug.push("move failed: " + moveStatus.status);
					}

					debugStatus(debug, elevator);
				}
			});
			elevator.on("floor_button_pressed", function (floorNum) {
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
			elevator.on("passing_floor", function (floorNum, direction) {
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

					elevator.destinationQueue.splice(queueIndex, 1);
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
				} else {
					debug.push("no logic criteria met");
					if (settings.DEBUG) {
						debugger;
					}
				}

				if (settings.DEBUG) {
					debugStatus(debug, elevator);
				}
			});
			elevator.on("stopped_at_floor", function (floorNum) {
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
		floors.forEach(function (floor, floor_index) {
			//* Elevator Properties ********************************************
			//  - floorNum()
			//
			// UNDOCUMENTED PROPERTIES
			//  - buttonStates { down: "" , up: "" }
			//*****************************************************************/

			// Custom Properties -----------------------------------------------
			floor.objType = "floor";
			floor.index = floor_index;

			// Custom Functions ------------------------------------------------
			floor.statusText = function () {
				var text = "F" + floor.floorNum();

				text += (floor.upPressed()) ? "^" : "_";
				text += (floor.downPressed()) ? "v" : "_";

				text = "[" + text + "]";

				return text;
			};

			floor.upPressed = function () {
				return (floor.buttonStates.up !== "");
			};

			floor.downPressed = function () {
				return (floor.buttonStates.down !== "");
			};

			floor.buttonPressed = function () {
				return (floor.upPressed || floor.downPressed);
			}

			// Floor Events ----------------------------------------------------
			floor.on("up_button_pressed", function () {
				// Triggered when someone has pressed the up button at a floor. 
				// Note that passengers will press the button again if they fail to enter an elevator.
				var available = callAvailableElevator(floor.floorNum(), "up"),
					debug = [];

				debug.push("Up button pressed");

				if (settings.DEBUG) {
					if (available.elevator > -1) {
						debug.push("requested Elevator " + available.elevator);
						debug.push((available.elevatorCalled) ? "call succeeded" : "call failed with availability " + available.bestAvailability);
					} else {
						debug.push("no Elevator currently available");
					}

					debugStatus(debug, floor);
				}
			});
			floor.on("down_button_pressed", function () {
				// Triggered when someone has pressed the down button at a floor. 
				// Note that passengers will press the button again if they fail to enter an elevator.
				var available = callAvailableElevator(floor.floorNum(), "down"),
					debug = [];

				debug.push("Down button pressed");

				if (settings.DEBUG) {
					if (available.elevator > -1) {
						debug.push("requested Elevator " + available.elevator);
						debug.push((available.elevatorCalled) ? "call succeeded" : "call failed with availability " + available.bestAvailability);
					} else {
						debug.push("no Elevator currently available");
					}

					debugStatus(debug, floor);
				}
			});
		});
	},
	update: function (dt, elevators, floors) {
		// We normally don't need to do anything here
	}
}
