const express = require('express')
const Post = require('../models/post')
const User = require('../models/user')
const auth = require('../middleware/auth')

const router = new express.Router()

router.get('/friends/find', auth, async (req, res) => {
    const user = req.user;
    const friends = req.user.friends
    const userList = await User.find({_id: {$ne: user._id}})
    console.log(userList)
    const filteredUserList = userList.filter((user) => !friends.includes(user._id))
    console.log(filteredUserList)
    const response = []
    filteredUserList.forEach((filteredUser) => {
        response.push({
            possibleFriend: filteredUser.email
        })
    })
    res.send(response)
})

router.post('/friends/:email/request', auth, async (req, res) => {
    const email = req.params.email
    const reqUser = await User.findOne({email})
    if (!reqUser) {
        return res.status(400).send({'Status': 'User not found'})
    }
    if (req.user.friends.includes(reqUser._id)) {
        return res.send({'Status': `${email} is already your friend.`})
    }
    const isAlreadyRequested = reqUser.requests.find((request) => request.request === req.user.email)
    if (isAlreadyRequested) {
        return res.send({'Status': `You've already sent a friend request to ${email}. Please wait patiently.`})
    }
    reqUser.requests.push({'request' : req.user.email})
    await reqUser.save()
    res.send()
})

router.get('/friends/requests', auth, async(req, res) => {
    const user = req.user
    res.send(user.requests)
})

router.post('/friends/:email/:response', auth, async (req, res) => {
    const user = req.user
    const email = req.params.email
    const approve = req.params.response === 'true'
    const isRequestAvailable = user.requests.filter((request) => request.request === email)
    if (isRequestAvailable.length === 0) {
        return res.status(400).send({'Status': `You do not have a friend request from ${email}`})
    }
    //Remove from existing request if approved or denied
    user.requests = user.requests.filter((request) => request.request !== email)
    if (!approve) {
        await user.save()
        return res.send({'Status': `Denied friend request from ${email}`})
    }
    const friendUser = await User.findOne({email})
    if (!friendUser) {
        return res.status(400).send({'Status': `${email} has deleted his account and is not available anymore`})
    }
    user.friends.push({'friend': friendUser.email})
    await user.save()
    friendUser.friends.push({'friend': user.email})
    await friendUser.save()
    res.send({'Status': `Accepted friend request from ${email}`})
})

router.delete('/friends/:email', auth, async (req,res) => {
    const removeEmail = req.params.email
    let user = req.user
    let friendUser = await User.findOne({'email': removeEmail})
    if (!friendUser) {
        return res.status(400).send({'Status': `${removeEmail} is not your friend.`})
    }
    user.friends = user.friends.filter((friend) => friend.friend !== removeEmail)
    await user.save()
    friendUser.friends = friendUser.friends.filter((friend) => friend.friend !== user.email)
    await friendUser.save()
    res.send(user)
})

router.get('/friends', auth, async (req, res) => {
    const user = req.user
    res.send(user.friends)
})

router.get('/friends/:email', auth, async (req,res) => {
    const forbiddenKeys = ['_id', 'tokens', 'password', 'requests']
    const user = req.user
    const email = req.params.email
    const isFriend = user.friends.filter((friend) => friend.friend === email)
    if (isFriend.length === 0) {
        return res.status(404).send({'Status': `${email} is not your friend. Unable to see profile`})
    }
    const frienduser = await User.findOne({email})
    const friendProfile = frienduser.toObject()
    Object.keys(friendProfile).forEach((key) => {
        if (forbiddenKeys.includes(key)) {
            delete friendProfile[key]
        }
    })
    res.send(friendProfile)
})

router.get('/friends/:email/posts', auth, async (req, res) => {
    const user = req.user
    const email = req.params.email
    const isFriend = user.friends.filter((friend) => friend.friend === email)
    if (isFriend.length === 0) {
        return res.status(404).send({'Status': `${email} is not your friend. Unable to see his posts`})
    }
    const match = req.query
    const sort = {}
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    const frienduser = await User.findOne({email})
    try {
        await frienduser.populate({
            path: 'posts',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        frienduser.posts = frienduser.posts.filter((post) => post.privacy !== 'ONLYME')
        res.send(frienduser.posts)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router