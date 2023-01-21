const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const Note = require('../models/Note');

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()
    if(!users?.length){
        return res.status(400).json({
            message: 'No users found'
        })
    }
    res.json(users)
});


const createNewUser = asyncHandler(async (req, res) => {
    const {username, password, roles} = req.body;

    //confirm data
    if(!username || !password ){
        return res.status(400).json({
            message: 'All fields are required'
        });
    }

    //checking for duplicate
    const duplicate = await User.findOne({username}).collation({
        locale: 'en',
        strength: 2
    }).lean().exec();
    if(duplicate){
        return res.status(409).json({
            message: 'This user is already exists...'
        });
    }

    //hash password
    const hashedpwd = await bcrypt.hash(password, 10) //salt rounds.

    const userObject =(Array.isArray(roles) || !roles.length) ? 
        {username, "password": hashedpwd} 
    : 
        {username, "password": hashedpwd, roles}

    //creating and storing a new user
    const user = await User.create(userObject);
    if(user){
        res.status(201).json({
            message: `New user ${username} has been created`
        })
    }else{
        res.status(400).json({
            message: 'Invalid user data received'
        })
    }
});

const updateUser = asyncHandler(async (req, res) => {
    const {id, username, password, roles, active} = req.body;

    //confirming data
    if(!id || !username || !Array.isArray(roles) || !roles.length ||
    typeof active !== 'boolean'){
        return res.status(400).json({
            message: 'All fields are required'
        });
    }
    
    const user = await User.findById(id).exec();
    if(!user){
        return res.status(400).json({
            message: 'User not found'
        })
    }

    //checking for duplicate
    const duplicate = await User.findOne({username}).collation({
        locale: 'en',
        strength: 2
    }).lean().exec();
    //Allowing updates to the original user
    if(duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({
          message: 'This username is already taken..'
        })
    }

    //updating
    user.username = username;
    user.roles = roles;
    user.active = active;

    if(password){
        user.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await user.save();

    res.json({
        message: `${updatedUser.username} updated`
    });
});

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body;
    if(!id){
        return res.status(400).json({
            message: 'User ID required'
        });
    }
    const note = await Note.findOne({user: id}).lean().exec();
    if(note){
        return res.status(400).json({
            message: `The user has already assigned notes`
        });
    }

    const user = await User.findById(id).exec();

    if(!user){
        return res.status(400).json({
            message: 'User not found'
        })
    }

    const result = await user.deleteOne();
    const reply = `Username ${result.username} with ID ${result.id} deleted`;
    res.json(reply)
});

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}