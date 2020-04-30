const router = require('express').Router()
const mongoose = require('mongoose')
const planSchema = new mongoose.Schema({
    name: String,
    done: {
        type: Boolean,
        default: false
    },
    waitingPlus: {
        type: Boolean,
        default: false
    },
    list: {
        type: [mongoose.ObjectId],
        default: []
    },
    parentPlanId: {
        type: mongoose.ObjectId,
        default: null
    },
    userId: {
        type: mongoose.ObjectId,
        default: null
    }
})
const Plan = mongoose.model('Plan', planSchema)
router.post('/create', (req, res) => {
    const parentPlanId = req.body.parentPlanId
    const userId = req.user ? req.user._id : null
    console.log('creating a plan for user', userId)
    Plan.create({
        name: 'new plan', 
        parentPlanId: parentPlanId,
        userId: userId
    }, async function(err, data) {
        if(err) res.status(500).send(err)
        if(parentPlanId){
            await Plan.findByIdAndUpdate(parentPlanId, {$push: {list: data._id}}, function(err, data){
                if(err) res.status(500).send(err)
            })
        }
        res.status(201).send(JSON.stringify(data))
    })
})
router.get('/find', (req, res) => {
    const userId = req.user ? req.user._id : null
    Plan.find({ userId: userId }, function(err, data){
        if(err) res.status(500).send(err)
        res.status(200).send(data)
    })
})
router.get('/delete', (req, res) => {
    const userId = req.user ? req.user._id : null
    Plan.deleteMany({userId: userId}, function(err) {
        if(err) res.status(500).send(err)
        res.status(200).send()
    })
})
router.get('/done/:id', (req, res) => {
    Plan.findById(req.params.id, function(err, plan){
        if(err) res.status(500).send(err)
        plan.done = !plan.done
        plan.save(function(err, updatedPlan){
            if(err) res.status(500).send(err)
            res.status(200).send(updatedPlan)
        })
    })
})
router.put('/name/:id', (req, res) => {
    const updatedName = req.body.name
    Plan.findByIdAndUpdate(req.params.id, {name: updatedName}, {new: true}, function(err, data){
        if(err) res.status(500).send(err)
        res.status(200).send(data)
    })
})
module.exports = router;