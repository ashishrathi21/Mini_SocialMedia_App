const express = require('express');
const app = express();

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const path = require('path');
const mongoose = require('mongoose');
const userModel = require('./models/user');
const postModel = require('./models/post');

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.get('/', (req, res) => {
   res.render('index');
})

app.get('/login', (req, res) => {
   res.render('login');
})

app.get('/post', isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
    let posts = await postModel.find().populate('user');
   res.render('post', {posts, user});
})

app.get('/account', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email : req.user.email}).populate('post');
   res.render('account', {user});
})

app.get('/post/create', isLoggedIn, async (req, res) => {
    res.render('createPost');
})


app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
})

app.get('/post/:id', isLoggedIn, async (req, res) => {
    let posts = await postModel.find({ user: req.params.id }).populate('user');
    res.render("postDetail", { posts });
});

app.get('/like/:id', isLoggedIn, async (req, res) => {
  
  let post = await postModel.findById(req.params.id);
  if (!post) return res.status(404).send("Post not found");

  let user = await userModel.findOne({ email: req.user.email });

  let index = post.postLikes.indexOf(user._id);

  if (index === -1) {
      post.postLikes.push(user._id);   // LIKE
  } else {
      post.postLikes.splice(index, 1); // UNLIKE
  }

  await post.save();

  res.redirect('/post');
});



app.post('/register', async (req, res) => {
   let { name, username, password, email } = req.body;

   if (!name ||!username || !email || !password) {
        return res.redirect("/"); 
    }


   let existingUser = await userModel.findOne({email});
   if(existingUser) return res.status(400).send('User already exists')
   bcrypt.genSalt(10, (err, salt)=> {
    bcrypt.hash(password, salt, async (err, hash)=> {
        let createdUser = await userModel.create({
            username,
            name,
            password: hash,
            email
        })

        let token = jwt.sign({email : createdUser.email}, 'secretkey123');
        res.cookie('token', token);
        res.redirect('/login');
    })
   })

})

app.post('/login', async (req, res) => {
   let { password, email } = req.body;
   
     if (!email || !password) {
        return res.redirect("/login"); 
    }

    let existingUser = await userModel.findOne({email});
   if(!existingUser) return res.status(400).send('User does not exist')
   bcrypt.compare(password, existingUser.password, (err, result)=> {
    if(result) {
        let token = jwt.sign({email : existingUser.email}, 'secretkey123');
        res.cookie('token', token);
        res.redirect('/post');
    } else {
        res.redirect('/login');
    }
   })

})

app.post('/post/create', isLoggedIn, async (req, res) => {
   let {content, image} = req.body;
   let user = await userModel.findOne({email : req.user.email} ).populate('post');

   let createdPost = await postModel.create({
    user : user._id,
    postContent : content,
    postImage : image
   })

   user.post.push(createdPost._id);
   await user.save();

   res.redirect('/account');

})



function isLoggedIn(req, res, next) {
    let token = req.cookies.token;

    if (!token) {
        return res.redirect("/login");
    }

    try {
        let data = jwt.verify(token, "secretkey123");
        req.user = data;
        next();
    } catch (err) {
        // Invalid token (tampered/expired)
        res.clearCookie("token");
        return res.redirect("/login");
    }
}



app.listen(3000)
