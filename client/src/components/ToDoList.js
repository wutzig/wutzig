import React from 'react'
import Plan from './Plan'
import PlusButton from './PlusButton'
import './Plan.css'

export default function ToDoList(props){
    const url = 'http://localhost:4000'
    const [focussedPlanIndex, setfocussedPlanIndex] = React.useState()
    const [waitingPlus, setWaitingPlus] = React.useState(false)
    //React.useEffect(() => console.log(focussedPlanIndex), [focussedPlanIndex])
    const createHandler = function(e, id){
        let focussedPlan, updatedPlan, index;
        if(id){
            index = props.plans.findIndex(plan => id === plan._id)
            focussedPlan = props.plans[index]
            updatedPlan = {...focussedPlan, waitingPlus: true}
            props.setPlans([...props.plans.slice(0, index), updatedPlan, ...props.plans.slice(index + 1)])
        } else{
            setWaitingPlus(true)
        }
        fetch('/api/todo/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({parentPlanId: id}),
            withCredentials: true, 
            credentials: 'include'
        }).then(async function(response) {
            const data = await response.json()
            if(id){
                updatedPlan = {...focussedPlan, waitingPlus: false}
                props.setPlans([data].concat([...props.plans.slice(0, index), updatedPlan, ...props.plans.slice(index + 1)]))
            } else {
                setWaitingPlus(false)
                props.setPlans([data].concat(props.plans))
            }
        }).catch(err => {
            console.log(err)
        })
        //e.stopPropagation()
    }
    const findHandler = function(){
        fetch('/api/todo/find', { withCredentials: true, credentials: 'include' })
        .then(async function(response) {
            const data = await response.json()
            props.setPlans(data)
        }).catch(err => console.error(err))
    }
    const deleteHandler = function(){
        fetch('/api/todo/delete', {withCredentials: true, credentials: 'include'})
        .then(() => findHandler())
        .catch(err => console.error(err))
    }
    const doneHandler = function(e, id){
        const index = props.plans.findIndex(plan => id === plan._id)
        const focussedPlan = props.plans[index]
        fetch('/api/todo/done/' + id).catch(err => console.error(err))
        
        const updatedPlan = {...focussedPlan, done: !focussedPlan.done}
        props.setPlans([...props.plans.slice(0, index), updatedPlan, ...props.plans.slice(index + 1)])
        e.stopPropagation()
    }
    const changeHandler = function(e){
        const focussedPlan = props.plans[focussedPlanIndex]
        const updatedPlan = {...focussedPlan, name: e.currentTarget.value}
        props.setPlans([...props.plans.slice(0, focussedPlanIndex), updatedPlan, ...props.plans.slice(focussedPlanIndex + 1)])
    }
    const focusHandler = function(e, id){
        const index = props.plans.findIndex(plan => id === plan._id)
        setfocussedPlanIndex(index)
        e.stopPropagation()
    }
    const blurHandler = function(e){
        const name = e.currentTarget.value
        const currentPlan = props.plans[focussedPlanIndex]
        fetch('/api/todo/name/'+ currentPlan._id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({name: name})
        }).catch(err => console.error(err))
        e.stopPropagation()
    }
    return (
        <div>
            <h1>To Do List</h1>
            <PlusButton 
                createHandler   = {createHandler}
                planId          = {null}
                waitingPlus     = {waitingPlus}/>
            <button className="Rect" onClick={deleteHandler}>Delete All</button>
            <button className="Rect" onClick={findHandler}>Find All</button>
            <div id='TopList' className='ToDoList'>
            {props.plans.map(plan => {
                return !plan.parentPlanId && <Plan 
                    key             = {plan._id}
                    planId          = {plan._id} 
                    focusHandler    = {focusHandler}
                    blurHandler     = {blurHandler}
                    changeHandler   = {changeHandler}
                    doneHandler     = {doneHandler}
                    createHandler   = {createHandler}
                    name            = {plan.name} 
                    done            = {plan.done}
                    waitingPlus     = {plan.waitingPlus}
                    plans           = {props.plans}/>
            })}
            </div>
        </div>
    )
}