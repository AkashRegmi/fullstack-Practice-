require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("./config/database");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookie = require("cookie-parser");
const multer = require("multer");

const Loggerr = require("./middleWare/custome");
const Books = require("./models/Books");
const User = require("./models/User");
const { auth, authAdmin } = require("./middleWare/authmiddleware");
const PORT = process.env.PORT || 1000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDB();
// for parsing application/json
// app.get("/w", (req, res) => {
//     res.send("this is the first with typing ");
// });

// app.get('/', (req, res) => {
//   console.log(req.headers);
//   res.send('Check your console');
// });
// app.get("/",Loggerr,(req,res)=>{
//   res.status(200).json({
//     status:"success",
//     message:"welcome to the home Page"
//   })
// });
// app.get("/about",Loggerr,(req,res)=>{
//   res.status(200).json({
//     status:"success",
//     message:"welcome to the about Page"
//   })
// });

// app.post("/user",(req,res)=>{
//   const {name,email}=req.body;
//   if(!name||!email){
//     return res.status(400).json({
//       status:"fail",
//       message:"name and email are required"
//     })
//   };
//   console.log(name,email)
//   res.status(200).json({
//     status:"success",
//     message:"user data received successfully",
//     data:{
//       name,
//       email
//     }
//   })
// })

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const name = Date.now();
    cb(null, `${name}_${file.originalname}`);
  },
});
const upload = multer({
  storage: storage,
});
//get the book for the one query 
app.get("/books/search", async (req,res)=>{
  console.log(req.query);
  const {title} = req.query;
  try {
    let filter={};
    if(title){
      filter.title={$regex:title,$options:"i"}
    };
    const books = await Books.find(filter);
    res.json(books)
  } catch (error) {
    
    res.json(error.message)
  }
})

//get the pagination 
app.get("/books/pagination",async(req,res)=>{
  try {
    const {page=1,limit=10}=req.query;
  const intpage=Number(page);
  const intlimit=Number(limit);
  const skipProduct = (page-1) * limit;

  const books = await Books.find().skip(skipProduct).limit(intlimit)
  res.status(200).json({
    status:"success",
    message:"Book fetched",
    books
  })
  } catch (error) {
    console.log(error.message)
  }
  
})

//get the book for the double query
app.get("/double", async (req,res)=>{
   const {title,price}=req.query;
   
})


app.post("/books", authAdmin, async (req, res) => {
  const { title, author, price } = req.body;
  if (!title || !author || !price) {
    return res.status(400).json({
      status: "fail",
      message: "id, title, author and price are required",
    });
  }

  try {
    const books = await Books.create({
      title,
      author,
      price,
    });

    res.status(200).json({
      status: "success",
      message: "Book Saved successfully in Database",
      data: {
        title,
        author,
        price,
      },
    });
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
});

app.get("/books", async (req, res) => {
  const StoredBooks = await Books.find({});
  if (!StoredBooks || StoredBooks.length === 0) {
    return res.status(404).json({
      status: "fail",
      message: "No books found in the database",
    });
  }
  res.status(200).json({
    status: "success",
    message: "Books retrieved successfully",
    data: StoredBooks,
  });
});

//get book by id
app.get("/books/:id", async (req, res) => {
  console.log(req.params);
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      status: "fail",
      message: "id is required",
    });
  }
  try {
    const specificBook = await Books.findById(id);
    if (!specificBook) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found",
      });
    }
    res.status(200).json({
      status: "success",
      message: "Book retrieved successfully",
      data: specificBook,
    });
  } catch (error) {
    console.error("Error retrieving book:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
});




// Delete the book by id
app.delete("/books/delete/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      status: "fail",
      message: "id is required to delete the book",
    });
  }
  try {
    const newBooks = await Books.findByIdAndDelete(id);

    if (newBooks.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No books found with the provided id",
      });
    }
    res.status(200).json({
      status: "success",
      message: `Book with id ${id} deleted successfully`,
      data: newBooks,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
});

// Update the book by id
app.put("/books/update/:id", authAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, author, price } = req.body;
  if (!id || !title || !author || !price) {
    return res.status(400).json({
      status: "fail",
      message: "id, title, author and price are required",
    });
  }
  try {
    const updatedBook = await Books.findByIdAndUpdate(id, {
      title,
      author,
      price,
    });

    if (!updatedBook) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: `Book with id ${id} updated successfully`,
      data: updatedBook,
    });
  } catch (error) {
    console.error("Error updating book:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
});

app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(404).json({
      status: "fail",
      message: "name, email, password feild id required",
    });
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(404).json({
      status: "fail",
      message: "email is already Regisdtered. So, Sign iN ",
    });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const newUser = new User({
    name,
    email,
    password,
    role,
  });
  await newUser.save();
  res.status(200).json({
    status: "success",
    message: ` Signup Successfully with email ${email}`,
  });
});

// signin
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: "fail",
      message: "Email and Password Required",
    });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "Email not Found. Register First ",
    });
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid Password",
    });
  }
  const token = jwt.sign(
    {
      user: user._id,
      role: user.role,
    },
    process.env.SECRETE_KEY,
    {
      expiresIn: 3600000,
    }
  );
  console.log(token);
  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 3600000,
  });
  res.status(200).json({
    status: "Success",
    message: "Login Successfully ",
    token,
  });
});
app.post("/uploads", upload.single("image"), (req, res) => {
    if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  console.log(req.file);
  try {
    res.status(200).json({
      message: "file Uploaded",
      data:req.file
    });
  } catch (error) {
    console.log(error.message);
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
