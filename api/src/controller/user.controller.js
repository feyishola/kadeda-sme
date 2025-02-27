const MobileUser = require("../models/User");
const AuthService = require("../services/authService");

exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await MobileUser.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Hash the password
    const hashedPassword = await AuthService.hashPassword(password);

    // Create and save user
    const newUser = new MobileUser({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await MobileUser.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await AuthService.validatePassword(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changeUserPassword = async (req, res) => {
  try {
    const user = await MobileUser.findById(req.user.id); // Assuming user is authenticated
    if (!user) return res.status(404).json({ message: "User not found" });

    await AuthService.changePassword(user, req.body.newPassword);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
