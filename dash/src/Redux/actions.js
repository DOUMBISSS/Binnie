
export function getUser (user){
    return {
        type: 'GET-USER',
        payload: user
    }
}
export function getAllUser (id){
    return {
        type: 'GET-ALL-USER',
        payload: id
    }
}
export function getPerson (people){
    return {
        type: 'GET-PERSON',
        payload: people
    }
}
export function getAllPerson (persons){
    return {
        type: 'GET-ALL-PERSONS',
        payload: persons
    }
}
export function addPerson (person){
    return {
        type: 'ADD-PERSON',
        payload: person
    }
}
export function addPayment (payment){
    return {
        type: 'ADD-PAYMENT',
        payload: payment
    }
}
export function getRent (rental){
    return {
        type: 'GET-RENT',
        payload: rental
    }
}
export function getAllHomes (homes){
    return {
        type: 'GET-HOMES',
        payload: homes
    }
}
export function getHome (home){
    return {
        type: 'GET-HOME',
        payload: home
    }
}


// export function getUser(users){
//     return {
//         type: 'GET-USER',
//         payload: users
//     }
// }
export function selectProfil(id){
    return {
        type : "SELECT-USER",
        payload : id
    }
}
export function setProfil(obj) {
    return {
        type : "SET-USER",
        payload : obj
    }
}
