import React from 'react'
import './JobList.css'
import ScrollBar from './ScrollBar.js'
import Job from './Job.js'

export default function JobList(props){
    const jobsPerPage = 10;
    return (
        <div className="JobList">
            <h4>found {props.jobs.length} jobs</h4>
            <ScrollBar clickHandler={props.setCurrentPage} numPages={Math.ceil(props.jobs.length/jobsPerPage)} currentPage={props.currentPage}/>
            {props.jobs.slice(jobsPerPage * (props.currentPage-1), jobsPerPage * props.currentPage).map(job => <Job 
                key         = {job.id} 
                title       = {job.title} 
                company     = {job.company} 
                company_logo= {job.company_logo}
                location    = {job.location}
                created_at  = {job.created_at}
                url         = {job.url}
                />)}
            <ScrollBar bottom={true} clickHandler={props.setCurrentPage} numPages={Math.ceil(props.jobs.length/jobsPerPage)} currentPage={props.currentPage}/>
        </div>
    )
}