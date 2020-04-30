import React from 'react'

export default function InfoBar(props){
    const url = "http://localhost:4000/api";
    return(
    <div className='InfoBar'>
        <button 
            onClick={() => {
                if(!props.user){
                    props.setActive('login');
                } else {
                    fetch('/api/logout', {
                        withCredentials: true, 
                        credentials: 'include'}).then( res => {
                            props.setUser(null)
                            //props.setPlans([])
                    })
                    .catch(err => console.log(err))
                }
            }} 
        className="Rect">
        Log {props.user ? 'out' : 'in'}</button>
        {!props.user && <button 
            className="Rect"
            onClick={() => props.setActive('register')}>
        Register</button>}
        <div className='Access'>{props.user || 'guest access'}</div>
    </div>
    )
}