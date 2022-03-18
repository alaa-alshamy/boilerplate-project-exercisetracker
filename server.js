const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const ExcerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: String
}, { _id : false });
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  excercises: [ExcerciseSchema]
});
const User = mongoose.model('User', UserSchema);

app.route('/api/users')
  .get(async function(req, res) {
    res.json(await User.find({}).select('_id username'));
  })
  .post(async function (req, res) {
    const newUser = new User({
      username: req.body.username
    });
    const result = await newUser.save();

    res.json(result);
  });

app.post('/api/users/:_id/exercises', async function(req, res) {
  const reqUser = await User.findById(req.params._id);

  if (reqUser) {
    let date;
    if (req.body.date) {
      date = new Date(req.body.date);
    }
    else {
      date = new Date();
    }

    const duration = parseInt(req.body.duration, 10);
    reqUser.excercises.push({
      description: req.body.description,
      duration: duration,
      date: date.toDateString()
    });

    await reqUser.save();

    res.json({
      _id: reqUser._id,
      username: reqUser.username,
      description: req.body.description,
      duration: duration,
      date: date.toDateString()
    });
  }
  else {
    res.json({ error: 'user not found' });
  }
});

app.get('/api/users/:_id/logs', async function(req, res) {
  // let query = User.findById(req.params._id);
  // if (req.query.limit) {
  //   query = query.limit(req.query.limit);
  // }
  // const reqUser = await query.exec();
  // const reqUser = await User
  //                   .findById(req.params._id)
  //                   .select({
  //                     excercises: {
  //                       $filter: {
  //                         input: "$excercises",
  //                         as: "index",
  //                         cond: {
  //                           $and: [
  //                             { $gte: [ "$$index.duration", 10 ] },
  //                             { $lte: [ "$$index.duration", 40 ] },
  //                           ]
  //                         }
  //                       }
  //                     }
  //                   });
  // reqUser.select({
  //                     excercises: {
  //                       $slice: 1
  //                     }
  //                   })

  const reqUser = await User.findById(req.params._id);

  if (reqUser) {
    let excercises = reqUser.excercises;
    if (req.query.from || req.query.to) {
      excercises = excercises.filter((item) => {
        const date = new Date(item.date);
        return (
          (
            !req.query.from
            || (date.getTime() >= new Date(req.query.from).getTime())
          )
          && (
            !req.query.to
            || (date.getTime() <= new Date(req.query.to).getTime())
          )
        );
      });
    }
    if (req.query.limit) {
      excercises = excercises.slice(0, req.query.limit);
    }

    res.json({
      _id: reqUser._id,
      username: reqUser.username,
      count: reqUser.excercises.length,
      log: excercises
    });
  }
  else {
    res.json({ error: 'user not found' });
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
