import React from 'react'
import './Job.css'
export default function Job(props){
    return (
        <div onClick={e => window.open(props.url, '_blank')} className='Job'>
            <div className='Logo'>{props.company_logo && <img src={props.company_logo} alt="no img"/>}</div>
            <div className='Title'>{props.title}</div>
            <div className='Company'>{props.company}</div>
            <div className='Location'>{props.location}</div>
            <div className='Created'>{props.created_at}</div>
        </div>
    )
}