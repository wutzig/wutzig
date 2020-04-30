import React from 'react';
import './Plan.css'
import './PlusButton.css'

export default function PlusButton(props){
    return props.waitingPlus ?
    <div className="lds-dual-ring"></div> :
    <button
        onClick     = {(e) => props.createHandler(e, props.planId)} 
        className   = 'Plus'>
    &#10010;</button>
}