import React from "react";

import { Redirect, Route, Switch } from "react-router-dom";
import Dashboard from "../dashboard/Dashboard";
import NewReservations from "./NewReservations";
import TableForm from "../tables/TableForm";
import SeatTableForm from "../tables/SeatTableForm";
import NotFound from "./NotFound";
import { today } from "../utils/date-time";
import  Search  from "./Search";
import Edit from "./Edit"
import "./Routes.css"

/**
 * Defines all the routes for the application.
 *
 * You will need to make changes to this file.
 *
 * @returns {JSX.Element}
 */
function Routes() {
  return (
    <div className="img">
    <Switch>
    <Route exact path="/">
      <Redirect to={"/dashboard"} />
    </Route>
    <Route exact path="/reservations">
      <Redirect to={"/dashboard"} />
    </Route>
    <Route path="/reservations/:reservation_id/seat">
      <SeatTableForm />
    </Route>
    <Route exact path="/tables">
      <Redirect to={"/dashboard"} />
    </Route>
    <Route path="/tables/new">
      <TableForm />
    </Route>
    <Route exact path="/reservations/new">
      <NewReservations />
    </Route>
    <Route path="/dashboard">
      <Dashboard date={today()} />
    </Route>
    <Route path="/search">
      <Search />
    </Route>
    <Route path="/reservations/:reservation_id/edit">
      <Edit />
    </Route>
    <Route>
      <NotFound />
    </Route>
  </Switch>
  </div>
  );
}

export default Routes;
