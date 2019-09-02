const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Post = require('./post')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8,
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be positive number.')
            }
        }
    },
    location: {
        type: String,
        default: 'Earth',
        trim: true
    },
    status: {
        type: String,
    },
    hobbies: [{
        hobby: {
            type: String
        }
    }],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    },
    friends: [{
        friend: {
            type: String,
            ref: 'User'
        }
    }], 
    requests: [{
        request: {
            type: String
        }
    }]
}, {
    timestamps: true
})

userSchema.virtual('posts', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'owner'
})

// Hide Sensitive info
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

//Generate Token
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token
}

//Login User
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) throw new Error('Unable to login.')
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new Error('Unable to login.')
    return user
}

//Hash the password
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

//Delete posts when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Post.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User', userSchema)
module.exports = User