const express = require('express');
const passport = require('passport')
const auth = require('./auth')
const argon2i = require('argon2-ffi').argon2i
//const crypto = require('crypto')
//const redis = require('redis');
//const cron = require('node-cron')
const morgan = require('morgan')
const bodyParser = require('body-parser');
const todoRouter = require('./todoRouter')
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const cors = require('cors')
const Twitter = require('twitter')
const path = require('path');
require('dotenv').config()

const app = express();
const PORT = process.env.PORT || 5000;
// const REDIS = 6379;
// const redisClient = redis.createClient(REDIS);
const url = 'https://jobs.github.com/positions.json?page=';

async function getGithubJobs(){
    let page = 1;
    let jobsOnPage = 50;
    let gitHubJobs = [];
    while(jobsOnPage >= 50){
        try{
            const response = await fetch(url + page);
            let data = await response.json();
            data = await data.map(job => {
                let time = job.created_at.split(" ");
                time[0] += ',';
                time.splice(3, 2);
                const {title, company, company_logo, location, url} = job
                const jobPart = {title, company, company_logo, location, url}
                jobPart['created_at']=time.join(' ')
                return jobPart
            })
            jobsOnPage = data.length;
            console.log("found " + jobsOnPage + " jobs on page " + page)
            gitHubJobs = gitHubJobs.concat(data);
            page++;
        } catch(error){
            console.log(error);
        }
    }
    console.log('found ' + gitHubJobs.length + ' jobs on GitHub')
    redisClient.set('jobs', JSON.stringify(gitHubJobs));
}

//0 */1 * * *'
// cron.schedule('02 */1 * * *', () => {
//     console.log('fetching jobs from GitHub...');
//     getGithubJobs();
// });

app.use(morgan('tiny'));
app.use(bodyParser.json());
// app.use(cors({
//     origin: 'http://localhost:3000',
//     credentials: true
// }));
app.use(express.static(path.join(__dirname, 'client/build')));
if(process.env.NODE_ENV === 'production') {  
    app.use(express.static(path.join(__dirname, 'client/build')));  
    app.get('*', (req, res) => {    res.sendfile(path.join(__dirname = 'client/build/index.html'));  
})}
mongoose.connect(process.env.MONGO_URI, { 
    useFindAndModify: false , 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}).then(() => {
    const User = mongoose.model('User', new mongoose.Schema({
        username: String,
        password: String
    }))
    const Chart = mongoose.model('Chart', new mongoose.Schema({
        type: String,
        name: {
            type: String,
            default: 'chart'
        },
        top: Number,
        left: Number,
        width: Number,
        height: Number,
        args: [Number],
        vals: [Number],
        labels: [String],
        userId: mongoose.ObjectId
    }))
    auth(app, User, mongoose.connection);

    // app.get('/api/jobs', (req, res) => {
    //     redisClient.get('jobs', function(err, reply){
    //         if(err){
    //             console.log(err);
    //         } else {
    //             res.send(reply)
    //         }
    //     });
    // })
    
    app.use('/api/todo', todoRouter )
    {/*my own twitter authentification doesn't work :-(
    const twitter_url = 'https://api.twitter.com/1.1/statuses/user_timeline.json' 
    const twitterAuth = require('./twitter') 
    app.get('/api/twitter', (req, res) => {
        const auth = twitterAuth('GET', twitter_url + '?screen_name=helenchenk', null)
        fetch(twitter_url + '?screen_name=helenchenk', {
            method: 'GET',
            headers: {
                'Content-Type'  : 'application/json',
                'Authorization' : auth
            }   
        }).then(res => res.json())
        .then(jsonRes => {
            console.log(jsonRes)
            res.status(200).send(JSON.stringify(jsonRes))
        })
          .catch(err => {
              console.log('Error: ',err)
              res.status(500).send(err)
          })
    })
    */}

    const twitterClient = new Twitter({
        consumer_key: process.env.TWITTER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN,
        access_token_secret: process.env.TWITTER_TOKEN_SECRET
      });
    var params = {screen_name: 'HelenchenK'};
    var usa = {'id': '2458410'} 
    var earth = {'id': '1'}
    //statuses/user_timeline
    
    //client.get('geo/reverse_geocode.json', {lat: 37.781157, long: -122.398720, granularity:'country'}, function(error, tweets, response) {
    const omniWeb = 'https://omniweb.sci.gsfc.nasa.gov/cgi/nx1.cgi?activity=retrieve&res=hour&spacecraft=omni2'
    const maxCount = 300
    app.post('/api/omniweb', (req, res) => {
        const userId = req.user ? req.user._id : null
        const startDate = req.body.startDate
        const startYear = startDate.substring(0, 4)
        const startMonth = startDate.substring(4, 6)
        const startDay = startDate.substring(6, 8)

        const endDate = req.body.endDate
        const endYear = endDate.substring(0, 4)
        const endMonth = endDate.substring(4, 6)
        const endDay = endDate.substring(6, 8)

        const deltaMonths = 12 * (endYear - startYear) + (endMonth - startMonth)
        fetch(omniWeb + `&start_date=${startDate}&end_date=${endDate}&vars=38&scale=Linear`)
            .then(response => response.text())
            .then(text => {
                tableStart = text.match(/YEAR/).index;
                tableEnd = text.match(/<\/pre>/).index;
                table = text.substring(tableStart + 16, tableEnd - 1)
                table = table.split('\n')
                
                combineNum = Math.ceil(table.length / (3 * maxCount))
                //console.log(table.length, combineNum)
                table = table
                    .filter((row, index) => index % 3 == 0 )
                    .map(row => parseFloat(row.split(/ +/)[3])/10)
                
                arr = []
                arrLength = Math.floor(table.length / combineNum)
                //console.log(table.length, arrLength, combineNum)
                for(var j = 0; j < arrLength - 1; j++){
                    arr.push([j, table.slice(j * combineNum, (j + 1) * combineNum).reduce((el, sum) => sum + el / combineNum, 0)])
                }
                arr.push([arr.length, table.slice(arr.length * combineNum, table.length - 1).reduce((el, sum) => sum + el / (table.length - 1 - arr.length * combineNum))])
                table = arr
                const newGraph = {
                    type:   'graph', 
                    width:  6, 
                    height: 2, 
                    top:    1, 
                    left:   1,
                    name: 'Kp index ' + startYear + '/' + startMonth + '/' + startDay
                    +' - ' + endYear + '/' + endMonth + '/' + endDay
                }
                Chart.create({
                    userId: userId,
                    ...newGraph,
                    args: table.map(val => val[0]),
                    vals: table.map(val => val[1])
                }, (err, doc) => {
                    if(err) res.status(500).send(`{'err': ${err}}`)
                    res.status(200).send(JSON.stringify({...newGraph, data: table, _id: doc._id}))
                })    
            })
            .catch(err => {
                console.log(err)
                res.status(500).send()
            })
    })
    app.get('/api/twitter', (req,res) => {
        const userId = req.user ? req.user._id : null
        twitterClient.get('trends/place.json', usa, function(error, tweets, response) {
            if (!error) {
                let hashTags = []
                tweets[0].trends.forEach(trend => {
                    if(trend.name[0]==='#' && trend.tweet_volume) hashTags.push([trend.name, trend.tweet_volume])
                })
                hashTags = hashTags.sort((a,b) => a[1] - b[1])
                const newBarChart = {
                    type:   'bar', 
                    width:  6, 
                    height: 2, 
                    top:    1, 
                    left:   1,
                    name: 'hashtags USA ' + new Date().toLocaleDateString('en-US')
                }
                Chart.create({
                    userId: userId, 
                    ...newBarChart,
                    labels: hashTags.map(hashTag => hashTag[0]), 
                    vals:   hashTags.map(hashTag => hashTag[1])}, 
                (err, doc) => {
                    if(err) res.status(500).send(`{'err': ${err}}`)
                    res.status(200).send(JSON.stringify({...newBarChart, data: hashTags, _id: doc._id}))
                })
            } else res.status(500).send(error)
            });
    })
    app.get('/api/dash', (req, res) => {
        const starWarsGermany = {
            'q': '#starwars', 
            'count': 100,
            'geocode': '51.09565,10.27054,500mi',
            'result_type': 'recent'
        }
        //console.log('asking for tweets')
        /*
        twitterClient.get('search/tweets.json', starWarsGermany, 
            function(error, tweets, response) {
            if(error) console.log(error)
            let allTweets = [...tweets.statuses]
            let oldest_id = Math.min(...tweets.statuses.map(tweet => tweet.id))
            let numQueries = 1;
            let foundAll = tweets.statuses < 100
            const makeTwitterRequest = function(){
                console.log('found '+allTweets.length+' tweets... asking again')
                twitterClient.get('search/tweets.json', {...starWarsGermany, max_id: oldest_id - 1}, 
                    function(error, tweets, response) {
                        if(error) console.log(error)
                        oldest_id = Math.min(...tweets.statuses.map(tweet => tweet.id))
                        allTweets = [...allTweets, ...tweets.statuses]
                        numQueries++
                        foundAll = tweets.statuses < 100
                        if(numQueries < 10 && !foundAll) makeTwitterRequest()
                        else console.log(allTweets.map(tweet => tweet.id), 'found ' + allTweets.length + ' tweets')
                })
            }
            makeTwitterRequest()
        })*/
        Chart.find({}, (err, data) => {
            if(err) res.status(500).send(err)
            const charts = data.map(chart => {
                const {userId, labels, args, vals, __v, ...rest} = chart.toObject()
                const data = vals.map((value, i) => [chart.type==='graph'?args[i]:labels[i],value])
                return {
                    data: data,
                    ...rest
                }
            })
            res.status(200).send(charts)
        })
    })
    app.post('/api/dash', async (req, res) => {
        const graphs = req.body.graphs
        const userId = req.user ? req.user._id : null
        const [update, insert] = graphs.reduce(
            ([pass, fail], el) => (el._id ? [[...pass, el], fail] : [pass, [...fail, el]]), [[], []]);
        const newData = graph => {
            const { data, ...newData } = graph
            const xVals = graph.type === 'graph' ? 'args' : 'labels'
            newData[xVals] = data.map(pair => pair[0])
            newData['vals'] = data.map(pair => pair[1])
            newData['userId'] = userId
            return newData
        }
        try{
            await Promise.all([
            Chart.insertMany(insert.map(graph => {
                return newData(graph)
            })),
            ...update.map(graph => {
                return Chart.updateOne({_id: graph._id}, newData(graph))
            })])
        } catch(err) {
            res.status(500).send()
            throw Error(err)
        }
        res.status(200).send({message: 'ok'})
    })
    app.post('/api/register', function(req, res, next) {
        const username = req.body.username;
        User.findOne({username: username}, (err, foundUser) => {
            if(err) res.status(500).send(err)
            else if(foundUser) res.status(303).send()
            else { 
                crypto.randomBytes(32, (err, salt) => {
                    if(err) res.status(500).send(err)
                    else argon2i.hash(req.body.password, salt).then(hash => {
                        User.create({
                            username: username,
                            password: hash
                        }, (err, data) => err ? res.status(500).send(err) : next(null, data))
                    });
                })
            }
        })
    }, passport.authenticate('local', {session: true}), (req, res) => {
        console.log(req.isAuthenticated())
        res.status(200).send(JSON.stringify({username: req.user.username}))
    })

    app.post('/api/login', passport.authenticate('local', {session: true}), (req, res) => {
        console.log('authenticated', req.user.username)
        res.status(200).send(JSON.stringify({username: req.user.username}))
    })
    app.get('/api/logout', (req, res) => {
        req.logOut();
        res.status(200).send()
    })
    app.listen(PORT, () => console.log('server running at ' + PORT));
})
.catch(err => console.log('mongodb error', err));