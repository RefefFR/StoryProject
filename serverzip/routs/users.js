const express = require("express");
const { validateUser, userModel, validateLogin, createToken } = require("../models/userModel");
const bcrypt=require("bcrypt");
const router = express.Router();
const {auth} = require("../midlewares/auth")


// ראוט שמציג משתמשים לפי חיפוש
router.get("/", async(req, res)=>{
  try{
      const limit=10;
      const page=req.query.page-1||0;

      let sFind={};
    if (req.query.s){
      const sExp = new RegExp(req.query.s, "i");
      sFind={name: sExp};
    }

    
  const data = await userModel.find(sFind)
  .limit(limit)
  .skip(page*limit)
  res.json(data);
  }catch(err){
      res.json(err);
  }
})



router.post("/signUp", async(req,res) => {
  const validBody = validateUser(req.body)
  if(validBody.error){
    return res.status(400).json(validBody.error.details);
  }
  try{
    
    const user = new userModel(req.body);
    // להצפין את הסיסמא של המשתמש עם בי קריפט
    // 10 - רמת הצפנה
    user.password = await bcrypt.hash(user.password,10);
    await user.save();

    // מחזירים לצד לקוח כוכביות במקום הצפנה כדי שלא ידע איך אנחנו מצפינים
    user.password="*****"
    return res.status(201).json(user);
  }
  catch(err){
    // בדיקת אם המייל האירור זה שהמייל כבר קיים בקולקשן/טבלה
    if(err.code == 11000){
      return res.status(400).json({err:"Email already in system",code:11000})
    }
    console.log(err);
    res.status(502).json({err})
  }
})
router.post("/login", async(req, res)=>{
  const validBody = validateLogin(req.body)
  if(validBody.error){
    return res.status(400).json(validBody.error.details);
  }
  try{
    // נבדוק אם המייל שנשלח בבאדי קיים בדאטא בייס
    const user = await userModel.findOne({email:req.body.email})
    if (!user){
      return res.status(401).json({err:"Email is not found"});
    }
    // נבדוק אם המייל מתאים לסיסמה 
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword){
      return res.status(401).json({err:"Password is not correct"});
    }
  

    // נחזיר למשתמש טוקן
    const token = createToken(user._id);

      res.json(token);
      

    




  }catch(err){
    console.log(err);
    res.status(502).json(err);
  }
   
})
// פונקציית מיידלוואר / אמצעית


router.get("/showInfo", auth ,async(req,res) => {
 
  try{
    // req.tokenData - מגיע מהפונקציית אוט שנמצאת בשרשור של הראוטר
    const data = await userModel.findOne({_id:req.tokenData._id},{password:0});
    res.json(data);
  }
  catch(err){
    console.log(err);
    res.status(502).json({err})
  }
})

module.exports=router;