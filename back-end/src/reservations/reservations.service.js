const knex = require("../db/connection");

// KNEX QUERIES!

// List function to display all reservations dependent on current date & status
async function list(date) {
    return knex("reservations")
        .select("*")
        .where({"reservation_date": date})
        .whereNot({"status": "finished"})
        .orderBy("reservation_time");
}

// Search function to display all reservations by phone number (ordered by reservation date)
function search(mobile_number) {
    return knex("reservations")
      .whereRaw(
        "translate(mobile_number, '() -', '') like ?",
        `%${mobile_number.replace(/\D/g, "")}%`
      )
      .orderBy("reservation_date");
  }

// Creating a reservation
async function create(reservation) {
    return knex("reservations")
        .insert(reservation)
        .returning("*")
        .then((reservations) => reservations[0])
}

// Essential read function used to identify a specific reservation
async function read(reservation_id) {
    return knex("reservations")
    .select("*")
    .where({reservation_id})
    .first()
}

async function update(newReservation) {
    return knex("reservations")
        .select("*")
        .where({reservation_id: newReservation.reservation_id})
        .update({status: newReservation.status}, "*")
        .then((x) => x[0]);
}

async function editReservation(editableReservation) {
    return knex("reservations") 
    .select("*")
    .where({reservation_id: editableReservation.reservation_id})
    .update(editableReservation, "*")
    .then((x) => x[0]);
}

module.exports = {
    create,
    list,
    read,
    update,
    search,
    editReservation,
}