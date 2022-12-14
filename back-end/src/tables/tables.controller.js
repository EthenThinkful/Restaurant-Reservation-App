/* Most of these functions rely on knex queries made in "./tables.service".
 asyncErrorBoundary() created for safe guarding all async functions, specifically within the "controller file". */

const service = require("./tables.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const reservationService = require("../reservations/reservations.service");

/* ATTENTION: The "THEE" keyword (as shown at start of line 16) is used to indicate the major/main functions that are being exported & used in the router file */

/* Major/main export functions: 
1.) list,
2.) create,
3.) update, 
4.) delete */

// *THEE list function* display all tables.
async function list(req, res, next) {
  const data = await service.list();
  res.json({ data: data });
}

// *THEE create function* create a table.
async function create(req, res, next) {
  const table = req.body.data;
  const data = await service.create(table);
  res.status(201).json({ data: data });
}

// VALIDATION PIPELINE STARTS HERE
const VALID_PROPERTIES = ["table_name", "capacity"];

// *MIDDLEWARE* makes sure table contains required fields (used with "create" function).
function hasRequiredFields(req, res, next) {
  const { data = {} } = req.body;
  const map = new Map();

  for (let property in data) {
    map.set(property);
  }

  for (let property of VALID_PROPERTIES) {
    if (!map.has(property)) {
      return next({
        status: 400,
        message: `Must include a ${property} field.`,
      });
    }
  }

  next();
}

// *MIDDLEWARE* makes sure table contains valid inputs (used with "create" function).
function hasValidFieldInputs(req, res, next) {
  let { table_name, capacity } = req.body.data;

  if (capacity <= 0 || typeof capacity !== "number") {
    return next({
      status: 400,
      message: `Table capacity must be at least one. You entered: ${capacity}.`,
    });
  }

  table_name = table_name.replace(" ", "");
  if (table_name.length <= 1) {
    return next({
      status: 400,
      message: `Please enter a table_name that is at least 2 characters.`,
    });
  }

  if (table_name === "") {
    return next({
      status: 400,
      message: `Please provide a table_name.`,
    });
  }

  next();
}

// *MIDDLEWARE* does the table exist? (used with "update" and "delete" functions).
async function tableExists(req, res, next) {
  const { table_id } = req.params;
  
  const table = await service.read(table_id);
  if (table) {
    res.locals.table = table; // DECLARATION of "res.locals"
    return next();
  }

  next({
    status: 404,
    message: `Table ${table_id} cannot be found.`,
  });
}

// *MIDDLEWARE* is table available? (used with "update" function).
function tableIsAvailable(req, res, next) {
  const table = res.locals.table;
  
  if (table.reservation_id) { 
    return next({
      status: 400,
      message: `Reservation cannot be seated. Table is occupied.`,
    });
  }
  next();
}

// *MIDDLEWARE* makes sure tables is occupied (used with "delete" function).
function tableNotOccupied(req, res, next) {
  const table = res.locals.table
  if(!table.reservation_id) {
    return next({
      status: 400,
      message: `Table is not occupied`
    })
  }
  next();
}

// *MIDDLEWARE* checks if reservation id exists on table (used with "update" function).
async function reservationExists(req, res, next) {
    const { data } = req.body;

    if (!data || !data.reservation_id) {
        return next({
            status: 400,
            message: `Missing valid reservation_id.`
        })
    }

    const { reservation_id } = data;

    const reservationData = await service.readReservation(reservation_id);
    if (reservationData) {
        res.locals.people = reservationData.people;
        return next();
    }

    next({
        status: 404,
        message: `Reservation ${reservation_id} cannot be found.`
    })
}

// *MIDDLEWARE* checking if table capacity can fit amount of people upon update request (used with "update" function). 
function tableHasCapacity(req, res, next) {
  const table = res.locals.table;
  const people = res.locals.people;
  if (people > table.capacity) {
    return next({
      status: 400,
      message: `Table ${table.table_name} does not have a capacity of ${people} people.`,
    });
  }
  next();
}

// *THEE update function* update a table.
async function update(req, res, next) {
  const table = res.locals.table;
  const { reservation_id } = req.body.data;
  const newTableData = {
    ...table,
    reservation_id: reservation_id,
  };
  const data = await service.update(newTableData);
  await service.updateReservationStatus(newTableData);
  res.status(200).json({ data: data });
}

// *MIDDLEWARE* making sure reservation is not already seated (used with "update" function).
async function reservationIsNotAlreadySeated(req, res, next) {
  const reservation = await reservationService.read(req.body.data.reservation_id);
  if(reservation.status == "seated") return next({status:400, message: `Reservation is already seated`});
  
  next();
}

// *THEE destroy function* updates a table's reservation id to "null".
async function destroy(req, res, next) {
  const table = res.locals.table;
  await service.delete(table.table_id);
  const reservation = await reservationService.read(table.reservation_id);
  await service.finishedStatus(reservation)
  res.sendStatus(200);
}

module.exports = {
  list: [asyncErrorBoundary(list)],
  create: [hasRequiredFields, hasValidFieldInputs, asyncErrorBoundary(create)],
  update: [
    asyncErrorBoundary(tableExists),
    asyncErrorBoundary(reservationExists),
    tableHasCapacity,
    tableIsAvailable,
    asyncErrorBoundary(reservationIsNotAlreadySeated),
    asyncErrorBoundary(update),
  ],
  delete: [asyncErrorBoundary(tableExists), tableNotOccupied, asyncErrorBoundary(destroy)],
};
