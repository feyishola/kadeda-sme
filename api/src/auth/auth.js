const bcrypt = require("bcrypt");
const MobileUser = require("../model/mobile.model");

class AuthService {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  static async validatePassword(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }

  static async changePassword(user, newPassword) {
    user.password = await this.hashPassword(newPassword);
    await MobileUser.save();
  }

  static async activateUser(user, newPassword, picture) {
    user.password = await this.hashPassword(newPassword);
    user.status = "active";
    user.picture = picture;
    await user.save();
  }
}

module.exports = AuthService;
