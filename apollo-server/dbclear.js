require("dotenv").config({ path: __dirname + "/../variables.env" });

const seeder = require("mongoose-seed");

seeder.connect(process.env.DB_URL, { useUnifiedTopology: true }, function() {
  seeder.loadModels([
    "./apollo-server/models/Auth.Model",
    "./apollo-server/models/Course.Model",
    "./apollo-server/models/Lecture.Model",
    "./apollo-server/models/Notification.Model",
    "./apollo-server/models/RegistrationSection.Model",
    "./apollo-server/models/User.Model",
    "./apollo-server/models/UserGroup.Model"
  ]);
  seeder.clearModels(["Auth", "Course", "Lecture", "Notification", "RegistrationSection", "User", "UserGroup"], () =>
    seeder.disconnect()
  );
});
