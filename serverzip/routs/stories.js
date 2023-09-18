const express = require("express");

const router = express.Router();
const {auth} = require("../midlewares/auth")
const {storyModel, validateStory} = require("../models/storyModel");


// ראוט שמציג פוסטים לפי חיפוש
router.get("/", async(req, res)=>{
  try{
      const limit=10;
      const page=req.query.page-1||0;

      let sFind={};
    if (req.query.s){
      const sExp = new RegExp(req.query.s, "i");
      sFind={name: sExp};
    }

    
  const data = await storyModel.find(sFind)
  .limit(limit)
  .skip(page*limit)
  res.json(data);
  }catch(err){
      res.json(err);
  }
})

// מוסיף סטורי
router.post("/", auth, async(req, res)=>{
  const isValid = validateStory(req.body);
  if(isValid.error){
      return res.status(401).json(isValid.error.details);
  }
  try{
      const story = new storyModel(req.body);
      story.user_id = req.tokenData._id;
      await story.save();
      res.json(story)
  }catch(err){
      res.json(err);
  }
})
// מוחק פוסט לפי איי די של הפוסט
router.delete("/:id", auth, async(req, res)=>{
  try{
      const idQ = req.params.id;
      const data = await storyModel.deleteOne({_id: idQ ,user_id: req.tokenData._id}, req.body)
      res.json(data)
  }catch(err){
      res.json(err);
  }
})
// נותן את הפוסטים לפי סדר כרונולוגי פר יוזר
router.get("/userStories", auth, async(req, res)=>{
  try{
      const limit=10;
      const page=req.query.page-1||0; 
      const data = await storyModel.find({user_id: req.tokenData._id }).sort({createdAt:1})
      .limit(limit)
      .skip(page*limit)
       res.json(data);
  }catch(err){
      res.json(err);
  }
})

// ראוט של הוספה או ביטול לייק

router.put("/:id", auth, async (req, res) => {
  try {
    const idQ = req.params.id;
    const userId = req.tokenData._id; 

    const story = await storyModel.findOne({ _id: idQ });
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    const likedIndex = story.likes.indexOf(userId);
    if (likedIndex === -1) {
      story.likes.push(userId);
    } else {
      story.likes.splice(likedIndex, 1);
    }

  //  אנחנו עושים סייב במקום אפדייט למרות שזה עדכון ולא הוספה,
  // פשוט כי כשאתה מוסיף לרשומה משהו שהאיידי שלו כבר קיים זה אוטומטית מעדכן במקום להוסיף אז כע
    const updatedStory = await story.save();

    res.json(updatedStory);
  } catch (err) {
    res.json(err);
  }
});

module.exports=router;

