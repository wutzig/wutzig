import React from 'react';
import './Plan.css'
import PlusButton from './PlusButton'

export default function Plan(props){
    let done, color, active;
    if(props.done){
        done = <span>&#10004;</span>
        color = 'green'
        active = 'Done Active'
    } else {
        done = <span>&#10008;</span>
        color = 'red'
        active = 'Done'
    }
    return(
        <div className='Plan'>
            <div className = 'Headline'>
                <PlusButton 
                    planId          = {props.planId} 
                    createHandler   = {props.createHandler} 
                    waitingPlus     = {props.waitingPlus}/>
                <input 
                    onFocus     = {(e) => props.focusHandler(e, props.planId)}
                    onBlur      = {props.blurHandler}
                    onChange    = {props.changeHandler} 
                    className   = 'Name' 
                    value       = {props.name}/>
                <button
                    onClick     = {(e) => props.doneHandler(e, props.planId)} 
                    className   = {active} 
                    style       = {{color: `${color}`}}>
                {done}</button>
            </div>
            <div className='ToDoList'>
            {props.plans.map(plan => {
                return plan.parentPlanId === props.planId && <Plan 
                    key             = {plan._id} 
                    planId          = {plan._id} 
                    focusHandler    = {props.focusHandler}
                    blurHandler     = {props.blurHandler}
                    changeHandler   = {props.changeHandler}
                    doneHandler     = {props.doneHandler} 
                    createHandler   = {props.createHandler}
                    name            = {plan.name} 
                    done            = {plan.done}
                    waitingPlus     = {plan.waitingPlus}
                    plans           = {props.plans}/>
            })}
            </div>
        </div>
    )
}