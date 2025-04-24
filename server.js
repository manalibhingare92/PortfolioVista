const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Create an express app
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/csvdata', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Create a schema
const studentSchema = new mongoose.Schema({
  student_id: String,
  sector: String,
  education: String,
  gender: String,
  age: Number,
  high_school_cgpa: String,
  skills: String,
  gpa: String,
  university: String,
  internships: Number,
  projects: Number,
  certifications: String,
  extracurricular_activities: String,
  expected_salary: Number
});

// Create a model
const Student = mongoose.model('Student', studentSchema);

// Route to serve HTML form
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/form.html');
});

// Route to handle form submission
app.post('/submit', async (req, res) => {
  const studentData = new Student({
    student_id: req.body.student_id,
    sector: req.body.sector,
    education: req.body.education,
    gender: req.body.gender,
    age: req.body.age,
    high_school_cgpa: req.body.high_school_cgpa,
    skills: req.body.skills,
    gpa: req.body.gpa,
    university: req.body.university,
    internships: req.body.internships,
    projects: req.body.projects,
    certifications: req.body.certifications,
    extracurricular_activities: req.body.extracurricular_activities,
    expected_salary: req.body.expected_salary
  });

  try {
    await studentData.save();
    // Redirect to the desired URL after successful data save
    res.redirect('http://127.0.0.1:5500/main/option.html');
  } catch (err) {
    res.status(400).send('Error saving data: ' + err);
  }
});
// Start the server
app.listen(3002, () => {
  console.log('Server started on http://localhost:3002');
});
