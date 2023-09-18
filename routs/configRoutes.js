
const usersR=require("./users");
const storyR=require("./stories");



exports.routsInit=(app)=>{
    app.use("/users", usersR);
    app.use("/stories", storyR);

}


