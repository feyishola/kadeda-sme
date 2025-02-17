const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const kadunaWards = require("./wards.model");

const kadunaLGAs = Object.keys(kadunaWards);

const opsGrantsSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    bvn: { type: String, required: true },
    idDocument: {
      idDocType: { type: String, required: true },
      idDocPhotoUrl: { type: String, required: true },
    },
    email: { type: String },
    ownerPassportPhotoUrl: { type: String, required: true },
    address: { type: String, required: true },
    isCivilServant: { type: Boolean, default: false },
    businessName: { type: String, required: true },
    businessAddress: { type: String, required: true },
    businessLGA: { type: String, required: true, enum: kadunaLGAs },
    businessLGACode: { type: String, required: true },
    businessWard: {
      type: String,
      required: true,
      validate: {
        validator: function (ward) {
          return kadunaWards[this.businessLGA]?.includes(ward);
        },
        message: "Invalid ward for selected LGA",
      },
    },

    businessRegCat: {
      catType: { type: String, required: true },
      enum: [{ type: String }],
      certPhotoUrl: { type: String, required: true },
      cacProofDocPhotoUrl: { type: String },
    },
    businessRegIssuer: {
      type: String,
      required: true,
      enum: ["Cooperative", "Smedan", "CAC"],
    },
    businessRegNum: { type: String, required: true },
    ownerAtBusinessPhotoUrl: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    yearsInOperation: { type: Number, required: true },
    numStaff: { type: Number, required: true },
    itemsPurchased: [
      {
        itemsList: { type: String, required: true },
        receiptPhotoUrl: { type: String, required: true },
      },
    ],
    costOfIitems: { type: Number, default: 0 },
    bank: { type: String, required: true },
    accountNumber: { type: String, required: true },
    capturedBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["Pending", "Eligible", "Disbursed", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// Create a Full-Text Search Index on the required fields
opsGrantsSchema.index({
  businessLGA: "text",
  businessName: "text",
  status: "text",
  phoneNumber: "text",
  businessRegIssuer: "text",
});

const OpsGrants = mongoose.model("OpsGrants", opsGrantsSchema);

module.exports = OpsGrants;
