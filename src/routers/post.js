const express = require('express')
const Post = require('../models/post')
const auth = require('../middleware/auth')

const router = new express.Router()


router.post('/posts', auth, async (req, res) => {
    const post = new Post({
        ...req.body,
        owner: req.user._id
    })
    try {
        await post.save()
        res.status(201).send(post)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/posts', auth, async (req, res) => {
    const match = req.query
    const sort = {}
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    try {
        await req.user.populate({
            path: 'posts',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.posts)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/posts/public', auth, async (req, res) => {
    const publicPosts = await Post.find({ 'privacy': 'ALL' })
    let response = []
    for (let post of publicPosts) {
        await post.populate('owner').execPopulate()
        post = post.toObject()
        post['owner'] = post.owner.email
        response.push(post)
    }
    return res.send(response)
})

router.get('/posts/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const post = await Post.findOne({ _id, owner: req.user._id })
        if (!post) {
            return res.status(404).send()
        }
        res.send(post)
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/posts/:id/like', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const post = await Post.findOne({ _id, owner: { $ne: req.user._id } })
        if (!post) {
            return res.status(404).send()
        }
        post.likes++
        await post.save()
        res.send(post)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/posts/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'privacy']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    if (!isValidOperation) {
        return res.status(400).send('Invalid Updates!')
    }

    try {
        const post = await Post.findOne({ _id: req.params.id, owner: req.user._id })
        if (!post) {
            return res.status(404).send()
        }
        Object.assign(post, req.body)
        await post.save()
        res.send(post)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/posts/:id', auth, async (req, res) => {
    try {
        const post = await Post.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if (!post) {
            return res.status(404).send()
        }
        res.send(post)
    } catch (e) {
        res.status(400).send()
    }
})

module.exports = router