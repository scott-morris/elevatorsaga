

<!-- Start elevator.js -->

Author: Scott Morris scott.r.morris@gmail.com

Version: 0.0.10 
This is my solution to Elevator Saga at http://play.elevatorsaga.com/

## settings

The program "constants" are stored in the `settings` object.

### Params:

* **boolean** *DEBUG* flag determining whether debugging is turned on
* **object** *DEBUG_ELEMENTS* 
* **array** *DEBUG_ELEMENTS.ELEVATORS* array determining which elevators to track when the `DEBUG` flag is set. To track all, leave the array blank. To track none, populate with `[-1]`
* **array** *DEBUG_ELEMENTS.FLOORS* array determining which floors to track when the `DEBUG` flag is set. To track all, leave the array blank. To track none, populate with `[-1]`
* **number** *FULL* The max `loadFactor()` for a given elevator that will stop for a floor that isn't internally pressed
* **integer** *BOTTOM_FLOOR* The bottom floor
* **integer** *TOP_FLOOR* The top floor, derived by the `floors` array size
* **integer** *NUM_ELEVATORS* The number of elevators, derived by the `elevators` array size

## UniqueArray([direction])

Helper class for maintaining an array with unique values that is automatically sorted

### Params:

* **String** *[direction]* if direction is `false` or `"down"`, the array will be reverse sorted

## UniqueArray.get()

Get the array

### Return:

* **Array** the stored array

## UniqueArray.find(v)

Find a given value in the array

### Params:

* **variant** *v* value

### Return:

* **integer** index of passed-in value, or `-1` if not found

## UniqueArray.has(v)

Find out if a given value is present in the array

### Params:

* **variant** *v* value

### Return:

* **boolean** whether the value is present in the array

## UniqueArray.add(v)

Add a value to the array if it is not already present

### Params:

* **variant** *v* value

### Return:

* **array** the stored array

## UniqueArray.remove(v)

Remove a value from the array if it exists

### Params:

* **variant** *v* value

### Return:

* **array** the stored array

## UniqueArray.sort([rev])

Sort the stored array

### Params:

* **variant** *[rev]* `true` or `"down"` to sort descending; `false` or `"up"` to sort ascending;
if parameter not given, sort in the saved way

### Return:

* **array** the stored array

## callAvailableElevator(floorNum, direction)

todo

### Params:

* **integer** *floorNum* floor to attempt to call the elevator to
* **string** *direction* the direction of the requeest, either `"up"` or `"down"`

### Return:

* **object** ```
{
    elevator,
    callStatus,
    bestAvailability,
    elevatorCalled
}
```
* **integer** *elevator* todo
* **integer** *callStatus* todo
* **integer** *bestAvailability* todo
* **integer** *elevatorCalled* todo

## floorsWaiting()

todo

### Return:

* **object** ```
{
    queue: {
        up,
        down
    }
    bottomUp,
    topDown,
    noneWaiting
}
```
* **array** *queue.up* todo
* **array** *queue.down* todo
* **integer** *bottomUp* todo
* **integer** *topDown* todo
* **boolean** *noneWaiting* todo

## elevatorStatus()

todo

### Return:

* **array** Array of `debugStatus()` for all elevators

## debugStatus(message, obj)

Given the elevator or floor, show the debug message with relevant context based on the object's `statusText()` function

### Params:

* **string** *message* Debug message to be shown in the console
* **object** *obj* Either an `elevator` or `floor`

### Return:

* **object** ```
{
    floors,
    elevators
}
```

## closerFloor(startFloor, option1, option2)

Returns the closer of the two options to the `startFloor`

### Params:

* **integer** *startFloor* current floor
* **integer** *option1* the first floor to compare
* **integer** *option2* the second floor to compare

### Return:

* **integer** the closer floor number

## elevator 
Each elevator operates independently, without a master queue.

### Properties:
* **array** *destinationQueue* The current destination queue, meaning the floor numbers the elevator is scheduled to go to. Can be modified and emptied if desired. Note that you need to call `checkDestinationQueue()` for the change to take effect immediately.
* **integer** *goingTo* The longest distance the elevator is heading in the current direction
* **string** *objType* set to `"elevator"`
* **integer** *index* set to the `elevator_index` to ensure that an elevator can be referenced from the array object

## elevator.checkDestinationQueue()

Checks the destination queue for any new destinations to go to. Note that you only need to call this if you modify the destination queue explicitly.

## elevator.currentFloor()

Gets the floor number that the elevator currently is on.

### Return:

* **integer** the floor number that the elevator currently is on

## elevator.direction([dir])

Gets or sets the elevator's direction based on the `goingUpIndicator` and `goingDownIndicator`

### Params:

* **string** *[dir]* direction, optional. `"up"`, `"down"`, or `"clear"`

### Return:

* **string** direction, `"up"`, `"down"`, or `""` based on the current status of the indicator lights

## elevator.getPressedFloors()

Gets the currently pressed floor numbers as an array.

### Return:

* **array** Currently pressed floor numbers

## elevator.goingUpIndicator([set])

Gets or sets the going up indicator, which will affect passenger behaviour when stopping at floors.

### Params:

* **boolean** *[set]* 

### Return:

* **boolean** 

## elevator.goingDownIndicator([set])

Gets or sets the going down indicator, which will affect passenger behaviour when stopping at floors.

### Params:

* **boolean** *[set]* 

### Return:

* **boolean** 

## elevator.goToFloor(floorNum, [force])

Queue the elevator to go to specified floor number.

### Params:

* **integer** *floorNum* The floor to send the elevator
* **boolean** *[force]* If true, the elevator will go to that floor directly, and then go to any other queued floors.

## elevator.loadFactor()

Gets the load factor of the elevator. 

### Return:

* **number** `0` means empty, `1` means full. Varies with passenger weights, which vary - not an exact measure.

## elevator.statusText()

Generates a short string description of the elevator and current floor to be used in debugging

### Return:

* **string** 
- `[E#^]` when elevator direction is up
- `[E#v]` when elevator direction is down
- `[E#x]` when elevator direction is not set
- Where `#` is the elevator number
- Includes the `floor.statusText()` based on the elevator's current floor
  - _example: `[E0^][F2^_]` - elevator 0, going up, at floor 2 with the up indicator lit_

## elevator.stop()

Clear the destination queue and stop the elevator if it is moving. Note that you normally don't need to stop elevators - it is intended for advanced solutions with in-transit rescheduling logic.

Returns a weighted availability
   2 : elevator already on its way
   1 : idle, feel free
   0 : busy, but might be going past
  -1 : going the other way past this floor, not available

<!-- End elevator.js -->

