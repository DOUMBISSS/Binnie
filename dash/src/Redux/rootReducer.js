import { combineReducers } from "redux";
import {peopleReducer} from "./peopleReducer"



export const rootReducer = combineReducers({
    peopleReducer:peopleReducer
})