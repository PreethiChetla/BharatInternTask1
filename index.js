const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const fs = require('fs');
mongoose.connect('mongodb://localhost:27017/bharatintern', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(session({
  secret: 'harshitha',
  resave: false,
  saveUninitialized: false,
}));
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
}, { collection: 'users' });
const User = mongoose.model('User', userSchema);
const blogPostSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  video: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
}, { collection: 'posts' });

const BlogPost = mongoose.model('BlogPost', blogPostSchema);
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('uploads'));
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extname = path.extname(file.originalname);
    callback(null, file.fieldname + '-' + uniqueSuffix + extname);
  },
});
const upload = multer({ storage: storage });
app.post('/uploadblog', upload.fields([{ name: 'postImage', maxCount: 1 }, { name: 'postVideo', maxCount: 1 }]), async (req, res) => {
  try {
    const { username, title, content } = req.body;
    const image = req.files['postImage'][0];
    const video = req.files['postVideo'][0];
    const newBlogPost = new BlogPost({
      username: username,
      title: title,
      content: content,
      image: image.filename,
      video: video.filename,
      date: new Date(),
    });
     await newBlogPost.save();
     res.redirect('/');
   } catch (error) {
     console.error('Error uploading blog post:', error);
     res.status(500).send('An error occurred while uploading the blog post.');
   }
 });
 app.get('/', async (req, res) => {
   try {
     const posts = await BlogPost.find().sort({ date: -1 });
 
     if (posts.length === 0) {
       res.render('home', { posts: [], showLoginButton: true });
     } else {
       res.render('home', { posts });
     }
   } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email, password: password });

  if (user) {
    console.log("dcfvhbjk");
    req.session.username = user.username;
    res.redirect('/myblogs'); 
  } else {
    res.send('Invalid email or password');
  }
});
app.get('/myblogs', async (req, res) => {
  try {
    const username = req.session.username;  
    if (!username) {
      console.log("myblog");
      res.redirect('/login');  
      return;
    }
    const blogs = await BlogPost.find({ username: username }).sort({ date: -1 });
    res.render('myblogs', { blogs });  
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/register', (req, res) => {
  res.render('register');
});
app.get('/delete/:id', (req, res) => {
  const blogId = req.params.id;
  Blog.findById(blogId, (err, blog) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    if (!blog) {
      return res.status(404).send('Blog not found');
    }
    res.render('delete', { blog });
  });
});
app.get('/login', (req, res) => {
  res.render('login');
});
app.get('/posts/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const blogPost = await BlogPost.findById(postId);
    if (!blogPost) {
      res.status(404).send('Blog post not found');
      return;
    }
    res.render('post', { post: blogPost });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/delete/:id', async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await BlogPost.findById(blogId);

    if (!blog) {
      return res.status(404).send('Blog not found');
    }
    const imagePath = path.join(__dirname, 'uploads', blog.image);
    const videoPath = path.join(__dirname, 'uploads', blog.video);
    fs.unlinkSync(imagePath);
    fs.unlinkSync(videoPath);
    await BlogPost.findByIdAndDelete(blogId);
    res.redirect('/myblogs');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const newUser = new User({ username, email, password });
  await newUser.save();

  res.render('login');
});
app.get('/uploadblog', (req, res) => {
  res.render('uploadblog');
});
app.get('/logout', (req, res) => {  
  req.session.destroy(err => {
    if (err) {
      console.log('Error destroying session:', err);
    } else {
      res.redirect('/login');
    }
  });
});
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});