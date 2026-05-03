const initialState = {
    persons: [],
    person:[],
    rental:[],
    users:[],
    user_id:[],
    selectedProfil : [],
    rentHomes: [],
    rentHome:[],
    newPerson: []
  
}

export function peopleReducer(state = initialState, action) {
    switch (action.type) {
        case "GET-USER": {
            return {
                ...state,users :action.payload
            } 
        }
        case "GET-ALL-USER": {
            return {
                ...state,user_id :action.payload
            } 
        }
        case "GET-PERSON": {
            return {
                ...state,person :action.payload
            } 
        }
        case "GET-ALL-PERSONS": {
            return {
                ...state,persons :action.payload
            } 
        }
        case "GET-USER": {
            return action.payload
        }
        case "ADD-PERSON": {
            return action.payload
        }
        case "ADD-PAYMENT": {
            return action.payload
        }
        case "GET-RENT": {
            return {
                ...state,rental :action.payload
            } 
        }
        case "GET-HOMES": {
            return {
                ...state,rentHomes :action.payload
            } 
            }
        case "GET-HOME": {
            return {
                ...state,rentHome :action.payload
            } 
        }
        default: {
            return state
        }
    }
  
}